import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  async createContact(organizationId: string, dto: CreateContactDto) {
    // Check if phone already registered in this organization
    const existing = await this.prisma.contact.findFirst({
      where: {
        organizationId,
        phone: dto.phone,
      },
    });

    if (existing) {
      throw new ConflictException('Contact with this phone number already exists in organization');
    }

    // Resolve stage
    let stageId = dto.stageId;
    if (!stageId) {
      const defaultStage = await this.prisma.leadStage.findFirst({
        where: { organizationId },
        orderBy: { position: 'asc' },
      });
      stageId = defaultStage?.id;
    }

    // Connect tags if provided
    const tagConnect = dto.tagIds?.map((id) => ({ id })) || [];

    const contact = await this.prisma.contact.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        leadScore: dto.leadScore || 0,
        stageId,
        organizationId,
        tags: {
          connect: tagConnect,
        },
      },
      include: {
        stage: true,
        tags: true,
      },
    });

    // Create a conversational session / conversation if it doesn't exist
    const existingConv = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id, organizationId },
    });
    if (!existingConv) {
      await this.prisma.conversation.create({
        data: {
          contactId: contact.id,
          organizationId,
          status: 'ACTIVE',
        },
      });
    }

    // Add audit log
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        action: 'CREATE_CONTACT',
        details: `Created contact ${contact.name} (${contact.phone})`,
      },
    });

    // Update usage quotas
    await this.prisma.usageQuota.update({
      where: { organizationId },
      data: {
        contactsCreated: {
          increment: 1,
        },
      },
    });

    return contact;
  }

  async findAllContacts(organizationId: string) {
    return this.prisma.contact.findMany({
      where: { organizationId },
      include: {
        stage: true,
        tags: true,
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        reminders: true,
      },
      orderBy: { lastActivity: 'desc' },
    });
  }

  async findOneContact(organizationId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
      include: {
        stage: true,
        tags: true,
        notes: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reminders: true,
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  async updateContact(organizationId: string, id: string, dto: any) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const { tagIds, ...rest } = dto;
    const updateData: any = { ...rest };

    if (tagIds) {
      updateData.tags = {
        set: tagIds.map((tid) => ({ id: tid })),
      };
    }

    const updated = await this.prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        stage: true,
        tags: true,
      },
    });

    // Handle stage change trigger for workflows later
    return updated;
  }

  async deleteContact(organizationId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    await this.prisma.contact.delete({
      where: { id },
    });

    // Update usage quotas
    await this.prisma.usageQuota.update({
      where: { organizationId },
      data: {
        contactsCreated: {
          decrement: 1,
        },
      },
    });

    return { success: true };
  }

  // --- STAGES ---
  async getStages(organizationId: string) {
    return this.prisma.leadStage.findMany({
      where: { organizationId },
      orderBy: { position: 'asc' },
    });
  }

  async createStage(organizationId: string, name: string, color: string, position: number) {
    return this.prisma.leadStage.create({
      data: {
        name,
        color,
        position,
        organizationId,
      },
    });
  }

  // --- TAGS ---
  async getTags(organizationId: string) {
    return this.prisma.tag.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async createTag(organizationId: string, name: string, color: string) {
    return this.prisma.tag.create({
      data: {
        name,
        color,
        organizationId,
      },
    });
  }

  // --- NOTES ---
  async addNote(contactId: string, userId: string, content: string) {
    return this.prisma.note.create({
      data: {
        contactId,
        userId,
        content,
      },
    });
  }

  // --- REMINDERS ---
  async addReminder(organizationId: string, userId: string, contactId: string, title: string, dueAt: string, desc?: string) {
    return this.prisma.taskReminder.create({
      data: {
        contactId,
        userId,
        organizationId,
        title,
        description: desc,
        dueAt: new Date(dueAt),
        status: 'PENDING',
      },
    });
  }
}
