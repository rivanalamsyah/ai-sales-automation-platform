import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppGateway } from './whatsapp.gateway';
import { ChatbotService } from '../chatbot/chatbot.service';
import { MessageRole, MessageType, ConversationStatus } from '@prisma/client';

@Injectable()
export class WhatsAppService {
  constructor(
    private prisma: PrismaService,
    private gateway: WhatsAppGateway,
    @Inject(forwardRef(() => ChatbotService))
    private chatbotService: ChatbotService,
  ) {}

  async getConnectionStatus(organizationId: string) {
    let conn = await this.prisma.whatsAppConnection.findUnique({
      where: { organizationId },
    });

    if (!conn) {
      conn = await this.prisma.whatsAppConnection.create({
        data: { organizationId, status: 'DISCONNECTED' },
      });
    }

    return conn;
  }

  async connectWhatsApp(organizationId: string) {
    const conn = await this.getConnectionStatus(organizationId);

    // Transition state: DISCONNECTED -> CONNECTING
    await this.prisma.whatsAppConnection.update({
      where: { id: conn.id },
      data: {
        status: 'CONNECTING',
        // Mock QR Code data URL representation
        qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="30" height="30" fill="black"/><rect x="15" y="15" width="20" height="20" fill="white"/><rect x="18" y="18" width="14" height="14" fill="black"/><rect x="60" y="10" width="30" height="30" fill="black"/><rect x="65" y="15" width="20" height="20" fill="white"/><rect x="68" y="18" width="14" height="14" fill="black"/><rect x="10" y="60" width="30" height="30" fill="black"/><rect x="15" y="65" width="20" height="20" fill="white"/><rect x="18" y="68" width="14" height="14" fill="black"/><rect x="60" y="60" width="10" height="10" fill="black"/><rect x="75" y="75" width="15" height="15" fill="black"/><rect x="50" y="50" width="10" height="10" fill="black"/></svg>',
      },
    });

    this.gateway.broadcastToOrg(organizationId, 'whatsapp_connection_update', {
      status: 'CONNECTING',
      qrCode: 'data:image/svg+xml;utf8,...',
    });

    // Simulate scanning after 6 seconds in the background
    setTimeout(async () => {
      try {
        const checkConn = await this.prisma.whatsAppConnection.findUnique({
          where: { organizationId },
        });

        if (checkConn && checkConn.status === 'CONNECTING') {
          await this.prisma.whatsAppConnection.update({
            where: { organizationId },
            data: {
              status: 'CONNECTED',
              phoneNumber: '+15550199',
              qrCode: null,
            },
          });

          this.gateway.broadcastToOrg(organizationId, 'whatsapp_connection_update', {
            status: 'CONNECTED',
            phoneNumber: '+15550199',
          });

          // Log the connection event
          await this.prisma.auditLog.create({
            data: {
              organizationId,
              action: 'CONNECT_WHATSAPP',
              details: 'WhatsApp instance scanned and connected successfully (Simulated)',
            },
          });
        }
      } catch (err) {
        console.error('Failed to update mock WhatsApp connection scan status:', err);
      }
    }, 6000);

    return { status: 'CONNECTING', qrCode: 'data:image/svg+xml;utf8...' };
  }

  async disconnectWhatsApp(organizationId: string) {
    const conn = await this.getConnectionStatus(organizationId);

    await this.prisma.whatsAppConnection.update({
      where: { id: conn.id },
      data: {
        status: 'DISCONNECTED',
        phoneNumber: null,
        qrCode: null,
      },
    });

    this.gateway.broadcastToOrg(organizationId, 'whatsapp_connection_update', {
      status: 'DISCONNECTED',
    });

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        action: 'DISCONNECT_WHATSAPP',
        details: 'WhatsApp client disconnected manually',
      },
    });

    return { status: 'DISCONNECTED' };
  }

  async sendMessage(organizationId: string, conversationId: string, content: string, isAI = false) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
      include: { contact: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Save message record
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        role: MessageRole.ASSISTANT,
        content,
        isRead: true,
        isAI,
        organizationId,
      },
    });

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadCount: 0,
      },
    });

    // Broadcast the message locally via WebSocket to frontend client
    this.gateway.broadcastToOrg(organizationId, 'new_message', {
      ...message,
      contactName: conversation.contact.name,
      contactPhone: conversation.contact.phone,
    });

    // Update message count usage limit quota
    await this.prisma.usageQuota.update({
      where: { organizationId },
      data: {
        messagesSentThisMonth: {
          increment: 1,
        },
      },
    });

    return message;
  }

  // Simulate an incoming WhatsApp message from a prospect (for live testing)
  async simulateIncomingMessage(organizationId: string, phone: string, name: string, content: string) {
    // 1. Create or fetch contact
    let contact = await this.prisma.contact.findFirst({
      where: { organizationId, phone },
    });

    if (!contact) {
      const defaultStage = await this.prisma.leadStage.findFirst({
        where: { organizationId },
        orderBy: { position: 'asc' },
      });

      contact = await this.prisma.contact.create({
        data: {
          name,
          phone,
          organizationId,
          stageId: defaultStage?.id,
        },
      });
    } else {
      // Update contact activity
      await this.prisma.contact.update({
        where: { id: contact.id },
        data: { lastActivity: new Date() },
      });
    }

    // 2. Resolve or create conversation session
    let conversation = await this.prisma.conversation.findFirst({
      where: { contactId: contact.id, organizationId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          contactId: contact.id,
          organizationId,
          status: ConversationStatus.ACTIVE,
        },
      });
    } else {
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: {
            increment: 1,
          },
        },
      });
    }

    // 3. Save incoming message
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.USER,
        content,
        isRead: false,
        isAI: false,
        organizationId,
      },
    });

    // 4. Stream message details via WebSocket
    this.gateway.broadcastToOrg(organizationId, 'new_message', {
      ...message,
      contactName: contact.name,
      contactPhone: contact.phone,
    });

    // 5. Asynchronously trigger AI processing (Chatbot Module)
    this.chatbotService.handleIncomingMessage(organizationId, conversation.id, content)
      .catch((err) => console.error('Error executing chatbot flow response:', err));

    return message;
  }

  async getConversations(organizationId: string) {
    return this.prisma.conversation.findMany({
      where: { organizationId },
      include: {
        contact: {
          include: {
            stage: true,
            tags: true,
          },
        },
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }
}
