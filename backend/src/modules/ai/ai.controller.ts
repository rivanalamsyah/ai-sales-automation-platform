import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('templates')
  async getTemplates() {
    return this.aiService.getTemplates();
  }

  @Post('generate')
  async generateCompletion(
    @Request() req: any,
    @Body() body: { prompt: string; systemInstruction?: string },
  ) {
    return this.aiService.generateCompletion(
      req.user.organizationId,
      body.prompt,
      body.systemInstruction,
    );
  }

  @Post('content')
  async generateContent(
    @Request() req: any,
    @Body() body: { templateId: string; inputs: Record<string, string> },
  ) {
    return this.aiService.generateAIContent(req.user.organizationId, body.templateId, body.inputs);
  }

  @Post('smart-replies')
  async generateSmartReplies(
    @Request() req: any,
    @Body() body: { conversationId: string },
  ) {
    return this.aiService.generateSmartReplies(req.user.organizationId, body.conversationId);
  }
}
