import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getSubscriptionDetails(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { usageQuota: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return {
      plan: org.plan,
      status: org.subStatus,
      usage: org.usageQuota,
    };
  }

  // Quota enforcement hooks
  async checkMessageLimit(organizationId: string) {
    const quota = await this.prisma.usageQuota.findUnique({
      where: { organizationId },
    });

    if (!quota) return;

    if (quota.messagesSentThisMonth >= quota.messageLimit) {
      throw new ForbiddenException('Monthly WhatsApp message quota limit reached. Please upgrade your subscription plan.');
    }
  }

  async checkContactLimit(organizationId: string) {
    const quota = await this.prisma.usageQuota.findUnique({
      where: { organizationId },
    });

    if (!quota) return;

    if (quota.contactsCreated >= quota.contactLimit) {
      throw new ForbiddenException('Lead/Contact registration quota limit reached. Please upgrade your subscription plan.');
    }
  }

  async checkWorkflowLimit(organizationId: string) {
    const quota = await this.prisma.usageQuota.findUnique({
      where: { organizationId },
    });

    if (!quota) return;

    if (quota.workflowsCount >= quota.workflowLimit) {
      throw new ForbiddenException('Workflow automation quota limit reached. Please upgrade your subscription plan.');
    }
  }

  // Payment Checkout Session Simulator
  async initiateCheckout(organizationId: string, planName: 'GROWTH' | 'ENTERPRISE') {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) throw new NotFoundException('Organization not found');

    const paymentUrl = `https://checkout.stripe.com/pay/simulated_session_${Math.floor(100000 + Math.random() * 900000)}?orgId=${organizationId}&plan=${planName}`;

    return {
      checkoutUrl: paymentUrl,
      message: 'Checkout session created (Simulated)',
    };
  }

  // Payment Webhook Processor Simulator
  async processPaymentWebhook(organizationId: string, planName: 'GROWTH' | 'ENTERPRISE') {
    const limits = {
      FREE: { messages: 1000, contacts: 250, workflows: 5 },
      GROWTH: { messages: 10000, contacts: 2500, workflows: 20 },
      ENTERPRISE: { messages: 1000000, contacts: 100000, workflows: 100 },
    };

    const activeLimits = limits[planName];

    // Update Plan and reset quotas
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan: planName,
        subStatus: 'ACTIVE',
      },
    });

    await this.prisma.usageQuota.update({
      where: { organizationId },
      data: {
        messageLimit: activeLimits.messages,
        contactLimit: activeLimits.contacts,
        workflowLimit: activeLimits.workflows,
        messagesSentThisMonth: 0,
        contactsCreated: 0,
        workflowsCount: 0,
        billingCycleStart: new Date(),
      },
    });

    // Audit logs
    await this.prisma.auditLog.create({
      data: {
        organizationId,
        action: 'UPGRADE_PLAN',
        details: `Subscribed to ${planName} plan (Billing Quotas Updated)`,
      },
    });

    return { success: true, plan: planName };
  }
}
