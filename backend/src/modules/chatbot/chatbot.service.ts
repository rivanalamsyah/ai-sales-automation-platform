import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { WhatsAppGateway } from '../whatsapp/whatsapp.gateway';

@Injectable()
export class ChatbotService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private gateway: WhatsAppGateway,
    @Inject(forwardRef(() => WhatsAppService))
    private whatsAppService: WhatsAppService,
  ) {}

  async getBotConfig(organizationId: string) {
    let config = await this.prisma.chatbotConfig.findUnique({
      where: { organizationId },
    });

    if (!config) {
      config = await this.prisma.chatbotConfig.create({
        data: { organizationId },
      });
    }

    return config;
  }

  async updateBotConfig(organizationId: string, data: any) {
    return this.prisma.chatbotConfig.update({
      where: { organizationId },
      data,
    });
  }

  // Invoked asynchronously when a user sends a message on WhatsApp
  async handleIncomingMessage(organizationId: string, conversationId: string, userText: string) {
    const config = await this.getBotConfig(organizationId);

    // If bot is disabled globally, ignore
    if (!config.isActive) return;

    // Fetch conversation details
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
      include: { contact: true },
    });

    if (!conversation) return;

    // If conversation is in manual human-only mode, ignore
    if (!conversation.isBotActive) return;

    // 1. Fetch conversation history for context (up to last 8 messages)
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'desc' },
      take: 8,
    });

    // Format chat history for the AI prompt
    const formattedHistory = history
      .reverse()
      .map((m) => `${m.role === 'USER' ? 'Customer' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // 2. Build full prompt
    const prompt = `Here is the conversation history with ${conversation.contact.name}. Please formulate the next response based on your instruction.
    
Conversation logs:
${formattedHistory}

Next response:`;

    // Simulate WhatsApp Typing state to frontend
    this.gateway.broadcastToOrg(organizationId, 'typing_status', {
      conversationId,
      isTyping: true,
    });

    // 3. Generate response using AI Service
    let botReply = '';
    try {
      botReply = await this.aiService.generateCompletion(
        organizationId,
        prompt,
        config.systemPrompt,
        config.modelProvider,
      );
    } catch (err) {
      console.error('Error in chatbot LLM completion:', err);
      botReply = config.fallbackReply;
    }

    // Smart Delay Simulation: sleep for 2.5 seconds to feel organic
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Disable typing state
    this.gateway.broadcastToOrg(organizationId, 'typing_status', {
      conversationId,
      isTyping: false,
    });

    // 4. Handoff Detection: Check if response indicates transferring to an agent
    const handoffTriggers = [
      'speak to a human',
      'transfer you',
      'connecting you with a representative',
      'human representative',
      'agent will help',
      'live agent',
    ];
    const isHandoff = handoffTriggers.some((trigger) => botReply.toLowerCase().includes(trigger));

    // 5. Send message
    await this.whatsAppService.sendMessage(organizationId, conversationId, botReply, true);

    if (isHandoff) {
      // Deactivate bot for this conversation so human can take over
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { isBotActive: false },
      });

      // Notify agents via WebSocket
      this.gateway.broadcastToOrg(organizationId, 'handoff_triggered', {
        conversationId,
        contactName: conversation.contact.name,
        reason: 'AI detected handoff query',
      });

      await this.prisma.auditLog.create({
        data: {
          organizationId,
          action: 'HUMAN_HANDOFF',
          details: `Chatbot triggered handoff for contact ${conversation.contact.name} (${conversation.contact.phone})`,
        },
      });
    }
  }

  async toggleBotForConversation(organizationId: string, conversationId: string, isBotActive: boolean) {
    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { isBotActive },
    });

    await this.gateway.broadcastToOrg(organizationId, 'conversation_bot_toggle', {
      conversationId,
      isBotActive,
    });

    return updated;
  }
}
