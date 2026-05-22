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

    try {
      // 3. Queue sending jobs in BullMQ (1-second intervals between broadcasts for rate limit protection)
      if (contacts.length > 0) {
        const contact = contacts[0];
        // Try queuing the first message to verify Redis connection
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
            delay: 0,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
        );

        // Queue the rest if connection check passes
        for (let i = 1; i < contacts.length; i++) {
          const c = contacts[i];
          await this.campaignQueue.add(
            'send_message',
            {
              organizationId,
              campaignId: campaign.id,
              contactId: c.id,
              contactPhone: c.phone,
              contactName: c.name,
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
      }
      return { success: true, targetCount: contacts.length, mode: 'queue' };
    } catch (error) {
      console.warn('BullMQ queue connection failed. Falling back to in-memory broadcast execution:', error.message);
      // Reset sentCount and process synchronously in background
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          sentCount: 0,
        },
      });

      this.executeInMemoryBroadcast(organizationId, campaign.id, contacts, campaign.content).catch((err) => {
        console.error('In-memory broadcast error:', err);
      });

      return { success: true, targetCount: contacts.length, mode: 'in_memory_fallback' };
    }
  }

  private async executeInMemoryBroadcast(
    organizationId: string,
    campaignId: string,
    contacts: any[],
    content: string,
  ) {
    let sentSuccess = 0;
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      // Delay between dispatches (pacing)
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      try {
        // 1. Personalize content
        const personalizedContent = content
          .replace(/{{name}}/g, contact.name)
          .replace(/{{phone}}/g, contact.phone);

        // 2. Resolve/create conversation
        let conversation = await this.prisma.conversation.findFirst({
          where: { contactId: contact.id, organizationId },
        });

        if (!conversation) {
          conversation = await this.prisma.conversation.create({
            data: { contactId: contact.id, organizationId },
          });
        }

        // 3. Send message via WhatsApp
        await this.whatsAppService.sendMessage(organizationId, conversation.id, personalizedContent, false);

        // 4. Create successful log entry
        await this.prisma.campaignLog.create({
          data: {
            campaignId,
            contactId: contact.id,
            status: 'SENT',
          },
        });

        // 5. Update campaign running counters
        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: {
            sentCount: { increment: 1 },
          },
        });
        sentSuccess++;
      } catch (err) {
        console.error(`In-memory broadcast failure for contact ${contact.phone}:`, err.message);
        
        await this.prisma.campaignLog.create({
          data: {
            campaignId,
            contactId: contact.id,
            status: 'FAILED',
            error: err.message,
          },
        });
      }
    }

    // Set campaign status
    const finalStatus = sentSuccess > 0 ? CampaignStatus.COMPLETED : CampaignStatus.FAILED;
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: finalStatus },
    });
  }
}

