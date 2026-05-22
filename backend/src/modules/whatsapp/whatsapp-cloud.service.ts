import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppGateway } from './whatsapp.gateway';
import { ChatbotService } from '../chatbot/chatbot.service';
import { MessageRole, ConversationStatus } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class WhatsAppCloudService {
  private readonly logger = new Logger(WhatsAppCloudService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: WhatsAppGateway,
    private chatbotService: ChatbotService,
  ) {}

  /**
   * Validates the Meta Webhook setup challenge request (GET).
   */
  validateWebhook(mode: string, token: string, challenge: string): string {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'velo_secret_token_123';
    
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Meta Webhook validated successfully.');
      return challenge;
    } else {
      this.logger.warn('Failed Meta Webhook validation challenge.');
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
  }

  /**
   * Processes the incoming message payload from WhatsApp Cloud API (POST).
   */
  async handleWebhookPayload(payload: any) {
    try {
      this.logger.log(`Received WhatsApp Cloud API webhook payload: ${JSON.stringify(payload)}`);
      
      const entry = payload.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const metadata = value?.metadata;
      
      // Extract target phone number ID to trace tenant mapping
      const phoneNumberId = metadata?.phone_number_id;
      const message = value?.messages?.[0];
      const contact = value?.contacts?.[0];

      if (!message) {
        // May be a message status status update (sent, delivered, read)
        const statusUpdate = value?.statuses?.[0];
        if (statusUpdate) {
          await this.handleStatusUpdate(statusUpdate);
        }
        return { status: 'ignored' };
      }

      const senderPhone = message.from; // Sender's phone number
      const senderName = contact?.profile?.name || `WhatsApp User (${senderPhone})`;
      const messageId = message.id;
      
      let textContent = '';
      if (message.type === 'text') {
        textContent = message.text?.body || '';
      } else if (message.type === 'image') {
        textContent = `[Image] ${message.image?.caption || 'Shared an image'}`;
      } else if (message.type === 'document') {
        textContent = `[Document] ${message.document?.filename || 'Shared a document'}`;
      } else {
        textContent = `[Media/Interaction] Received ${message.type} attachment.`;
      }

      // Map to correct organization tenant by scanning WhatsAppConnection phone numbers
      let connection = await this.prisma.whatsAppConnection.findFirst({
        where: {
          phoneNumber: {
            contains: senderPhone, // search substring or match
          },
        },
      });

      // If no direct phone match, fallback to the first active tenant to ensure the sandbox runs seamlessly
      if (!connection) {
        connection = await this.prisma.whatsAppConnection.findFirst();
      }

      if (!connection) {
        this.logger.error(`No tenant configuration found to receive message. Webhook mapping aborted.`);
        return { status: 'no_tenant_mapped' };
      }

      const organizationId = connection.organizationId;
      this.logger.log(`Mapped incoming WhatsApp message to organization ID: ${organizationId}`);

      // 1. Find or create CRM Contact
      let crmContact = await this.prisma.contact.findFirst({
        where: { organizationId, phone: senderPhone },
      });

      if (!crmContact) {
        const defaultStage = await this.prisma.leadStage.findFirst({
          where: { organizationId },
          orderBy: { position: 'asc' },
        });

        crmContact = await this.prisma.contact.create({
          data: {
            name: senderName,
            phone: senderPhone,
            organizationId,
            stageId: defaultStage?.id,
          },
        });
      } else {
        await this.prisma.contact.update({
          where: { id: crmContact.id },
          data: { lastActivity: new Date() },
        });
      }

      // 2. Find or create Chat Conversation
      let conversation = await this.prisma.conversation.findFirst({
        where: { contactId: crmContact.id, organizationId },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            contactId: crmContact.id,
            organizationId,
            status: ConversationStatus.ACTIVE,
          },
        });
      } else {
        await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: new Date(),
            unreadCount: { increment: 1 },
          },
        });
      }

      // 3. Save Message Record
      const savedMessage = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: MessageRole.USER,
          content: textContent,
          isRead: false,
          isAI: false,
          organizationId,
        },
      });

      // 4. Stream Message via WebSockets to Dashboard
      this.gateway.broadcastToOrg(organizationId, 'new_message', {
        ...savedMessage,
        contactName: crmContact.name,
        contactPhone: crmContact.phone,
      });

      // 5. Trigger AI Chatbot pipeline asynchronously
      this.chatbotService.handleIncomingMessage(organizationId, conversation.id, textContent)
        .catch((err) => this.logger.error(`AI chatbot failed processing web message: ${err.message}`));

      return { status: 'processed', messageId: savedMessage.id };
    } catch (error) {
      this.logger.error(`Error handling webhook callback: ${error.message}`, error.stack);
      return { status: 'error', details: error.message };
    }
  }

  /**
   * Sends an outbound message using Meta WhatsApp Cloud API.
   * Falls back to simulation log if credentials are not configured.
   */
  async sendCloudMessage(organizationId: string, toPhone: string, text: string, mediaUrl?: string): Promise<any> {
    const accessToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '106368295847382';

    if (!accessToken || accessToken === 'mock_token') {
      this.logger.log(`[WhatsApp Cloud API Sim] Sending message to ${toPhone}: "${text}"`);
      return { success: true, messageId: `msg_${Math.random().toString(36).substr(2, 9)}` };
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      
      const payload: any = {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: mediaUrl ? 'image' : 'text',
      };

      if (mediaUrl) {
        payload.image = {
          link: mediaUrl,
          caption: text,
        };
      } else {
        payload.text = {
          body: text,
        };
      }

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`WhatsApp Cloud API success response: ${JSON.stringify(response.data)}`);
      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
      };
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`WhatsApp Cloud API outbound send error: ${errorMsg}`);
      throw new Error(`WhatsApp Cloud API send failed: ${errorMsg}`);
    }
  }

  /**
   * Updates message status based on WhatsApp API delivery reports.
   */
  private async handleStatusUpdate(statusUpdate: any) {
    const messageId = statusUpdate.id;
    const status = statusUpdate.status.toUpperCase(); // SENT, DELIVERED, READ, FAILED
    
    this.logger.log(`WhatsApp Message Status Update: ${messageId} -> ${status}`);
    
    // In a real application, you would find the message record by the provider's messageId and update its status
    // For campaign logs:
    const log = await this.prisma.campaignLog.findFirst({
      where: {
        error: messageId, // If messageId was stored in error or similar fields, or by looking up logs.
      },
    });

    if (log) {
      await this.prisma.campaignLog.update({
        where: { id: log.id },
        data: { status },
      });
    }
  }
}
