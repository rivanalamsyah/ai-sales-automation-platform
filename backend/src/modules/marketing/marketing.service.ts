import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CampaignStatus } from '@prisma/client';

@Injectable()
export class MarketingService {
  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
    @InjectQueue('campaign_broadcast') private campaignQueue: Queue,
  ) {}

  async createCampaign(organizationId: string, data: { name: string; content: string; mediaUrl?: string; scheduledAt?: string }) {
    return this.prisma.campaign.create({
      data: {
        name: data.name,
        content: data.content,
        mediaUrl: data.mediaUrl,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: CampaignStatus.DRAFT,
        organizationId,
      },
    });
  }

  async getCampaigns(organizationId: string) {
    return this.prisma.campaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaignDetails(organizationId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
      include: {
        logs: {
          include: {
            contact: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async startBroadcast(organizationId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // 1. Fetch target contacts
    const contacts = await this.prisma.contact.findMany({
      where: { organizationId },
    });

    if (contacts.length === 0) {
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.FAILED },
      });
      return { success: false, message: 'No contacts found to broadcast to.' };
    }

    // 2. Set status to SENDING
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.SENDING,
        sentCount: 0,
        readCount: 0,
        clickCount: 0,
      },
    });

    // 3. Queue sending jobs in BullMQ (1-second intervals between broadcasts for rate limit protection)
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      await this.campaignQueue.add(
        'send_message',
        {
          organizationId,
          campaignId: campaign.id,
          contactId: contact.id,
          contactPhone: contact.phone,
          contactName: contact.name,
          content: campaign.content,
        },
        {
          delay: i * 1000, // anti-ban pacing
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
    }

    return { success: true, targetCount: contacts.length };
  }
}

