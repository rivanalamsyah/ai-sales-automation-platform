import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async checkAdminAccess(user: any) {
    if (user.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('SuperAdmin privileges required');
    }
  }

  async getSystemMetrics(user: any) {
    await this.checkAdminAccess(user);

    // Dynamic resource measurement simulation
    const cpu = Math.round(15 + Math.random() * 25); // 15% - 40%
    const ram = Math.round(45 + Math.random() * 15); // 45% - 60%
    const connections = Math.round(3 + Math.random() * 8);

    // Save history
    const metric = await this.prisma.systemMetric.create({
      data: {
        cpuUsage: cpu,
        ramUsage: ram,
        activeConns: connections,
      },
    });

    const metricsHistory = await this.prisma.systemMetric.findMany({
      orderBy: { timestamp: 'desc' },
      take: 24,
    });

    return {
      current: metric,
      history: metricsHistory.reverse(),
      dbSize: '48.2 MB',
      uptime: '14d 6h 22m',
    };
  }

  async getUsers(user: any) {
    await this.checkAdminAccess(user);

    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        organization: {
          select: {
            name: true,
            plan: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleUserActive(user: any, userId: string, isActive: boolean) {
    await this.checkAdminAccess(user);

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async getAuditLogs(user: any) {
    await this.checkAdminAccess(user);

    return this.prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
        organization: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
