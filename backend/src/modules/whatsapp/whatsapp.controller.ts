import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppCloudService } from './whatsapp-cloud.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private whatsAppService: WhatsAppService,
    private whatsAppCloudService: WhatsAppCloudService,
  ) {}

  // ==================== WEBHOOK ROUTES (PUBLIC) ====================

  @Get('webhook')
  @ApiOperation({ summary: 'Verify Meta WhatsApp Cloud API webhook connection (Public challenge)' })
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    return this.whatsAppCloudService.validateWebhook(mode, token, challenge);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Receive message callbacks from Meta WhatsApp Cloud API (Public)' })
  async receiveWebhook(@Body() body: any) {
    return this.whatsAppCloudService.handleWebhookPayload(body);
  }

  // ==================== PROTECTED ROUTING ====================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('status')
  @ApiOperation({ summary: 'Get current WhatsApp connection status' })
  async getStatus(@Request() req: any) {
    return this.whatsAppService.getConnectionStatus(req.user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('connect')
  @ApiOperation({ summary: 'Initialize a new WhatsApp instance connection (Generates QR)' })
  async connect(@Request() req: any) {
    return this.whatsAppService.connectWhatsApp(req.user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('disconnect')
  @ApiOperation({ summary: 'Disconnect the active WhatsApp device link' })
  async disconnect(@Request() req: any) {
    return this.whatsAppService.disconnectWhatsApp(req.user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('conversations')
  @ApiOperation({ summary: 'Fetch all message threads and conversations' })
  async getConversations(@Request() req: any) {
    return this.whatsAppService.getConversations(req.user.organizationId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('send')
  @ApiOperation({ summary: 'Send a manual text response to an active chat window' })
  async sendMessage(@Request() req: any, @Body() body: { conversationId: string; content: string }) {
    return this.whatsAppService.sendMessage(req.user.organizationId, body.conversationId, body.content, false);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('simulate')
  @ApiOperation({ summary: 'Simulate receiving an incoming customer chat message' })
  async simulateIncoming(@Request() req: any, @Body() body: { phone: string; name: string; content: string }) {
    return this.whatsAppService.simulateIncomingMessage(req.user.organizationId, body.phone, body.name, body.content);
  }
}

