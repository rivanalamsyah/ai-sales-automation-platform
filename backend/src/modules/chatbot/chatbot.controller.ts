import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  @Get('config')
  async getConfig(@Request() req: any) {
    return this.chatbotService.getBotConfig(req.user.organizationId);
  }

  @Post('config')
  async updateConfig(@Request() req: any, @Body() body: any) {
    return this.chatbotService.updateBotConfig(req.user.organizationId, body);
  }

  @Post('toggle')
  async toggleBot(@Request() req: any, @Body() body: { conversationId: string; isBotActive: boolean }) {
    return this.chatbotService.toggleBotForConversation(req.user.organizationId, body.conversationId, body.isBotActive);
  }
}
