import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email address already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create organization first
    const slug = dto.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.organizationName,
        slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
        plan: 'FREE',
      },
    });

    // Create user and bind to organization as OWNER
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        role: Role.OWNER,
        organizationId: organization.id,
        emailVerified: true,
      },
    });

    // Seed default pipeline stages for the new organization
    const defaultStages = [
      { name: 'New Lead', color: '#3B82F6', position: 1 },
      { name: 'Contacted', color: '#F59E0B', position: 2 },
      { name: 'Qualified', color: '#10B981', position: 3 },
      { name: 'Won', color: '#059669', position: 4 },
      { name: 'Lost', color: '#EF4444', position: 5 },
    ];

    await this.prisma.leadStage.createMany({
      data: defaultStages.map((stage) => ({
        ...stage,
        organizationId: organization.id,
      })),
    });

    // Seed default tags
    const defaultTags = [
      { name: 'Hot Lead', color: '#EF4444' },
      { name: 'Warm Lead', color: '#F59E0B' },
      { name: 'VIP Customer', color: '#8B5CF6' },
    ];

    await this.prisma.tag.createMany({
      data: defaultTags.map((tag) => ({
        ...tag,
        organizationId: organization.id,
      })),
    });

    // Setup Usage Quota limit
    await this.prisma.usageQuota.create({
      data: {
        organizationId: organization.id,
        messagesSentThisMonth: 0,
        messageLimit: 1000,
        contactsCreated: 0,
        contactLimit: 250,
        workflowsCount: 0,
        workflowLimit: 5,
      },
    });

    // Create a bot config
    await this.prisma.chatbotConfig.create({
      data: {
        organizationId: organization.id,
        isActive: false,
        systemPrompt: 'You are a professional assistant helping visitors.',
        temperature: 0.7,
        fallbackReply: 'Thank you. An agent will contact you shortly.',
      },
    });

    // Connect placeholder
    await this.prisma.whatsAppConnection.create({
      data: {
        organizationId: organization.id,
        status: 'DISCONNECTED',
      }
    });

    // Log the registration
    await this.prisma.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        action: 'REGISTER',
        details: `Registered organization ${organization.name} and owner ${user.name}`,
      },
    });

    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid login credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    // Audit logs
    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'LOGIN',
        details: `User ${user.email} logged in`,
      },
    });

    return this.generateToken(user);
  }

  async generateToken(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      orgId: user.organizationId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
