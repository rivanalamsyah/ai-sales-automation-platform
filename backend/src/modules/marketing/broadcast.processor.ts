import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CampaignStatus } from '@prisma/client';

@Processor('campaign_broadcast')
export class BroadcastProcessor extends WorkerHost {
  private readonly logger = new Logger(BroadcastProcessor.name);

  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { organizationId, campaignId, contactId, contactPhone, contactName, content } = job.data;
    
    this.logger.log(`Processing broadcast job ${job.id} for Campaign ${campaignId} to Contact ${contactPhone}`);

    try {
      // 1. Personalize the template content
      const personalizedContent = this.personalizeContent(content, contactName, contactPhone);

      // 2. Resolve or create a conversation for this contact
      let conversation = await this.prisma.conversation.findFirst({
        where: { contactId, organizationId },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: { contactId, organizationId },
        });
      }

      // 3. Send the message via WhatsApp service
      await this.whatsAppService.sendMessage(organizationId, conversation.id, personalizedContent, false);

      // 4. Record successful dispatch in Campaign Log
      await this.prisma.campaignLog.create({
        data: {
          campaignId,
          contactId,
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

      // 6. Check if this is the final message in the campaign queue to mark campaign COMPLETED
      await this.checkAndUpdateCampaignStatus(campaignId);

      return { success: true, contactPhone };
    } catch (err) {
      this.logger.error(`Broadcast failure for job ${job.id}: ${err.message}`, err.stack);

      // Create a failed campaign log entry
      await this.prisma.campaignLog.create({
        data: {
          campaignId,
          contactId,
          status: 'FAILED',
          error: err.message,
        },
      });

      // Update counters
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.FAILED,
        },
      });

      throw err;
    }
  }

  private personalizeContent(content: string, name: string, phone: string): string {
    return content.replace(/{{name}}/g, name).replace(/{{phone}}/g, phone);
  }

  private async checkAndUpdateCampaignStatus(campaignId: string) {
    // Look up the campaign and count contacts vs logs
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        organization: {
          include: {
            contacts: true,
          },
        },
      },
    });

    if (!campaign) return;

    const totalContacts = campaign.organization.contacts.length;
    
    const logsCount = await this.prisma.campaignLog.count({
      where: { campaignId },
    });

    if (logsCount >= totalContacts) {
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.COMPLETED,
        },
      });
      this.logger.log(`Campaign ${campaignId} has completed processing all ${totalContacts} broadcast queues.`);
    }
  }
}
