import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('marketing')
export class MarketingController {
  constructor(private marketingService: MarketingService) {}

  @Post('campaigns')
  async createCampaign(
    @Request() req: any,
    @Body() body: { name: string; content: string; mediaUrl?: string; scheduledAt?: string },
  ) {
    return this.marketingService.createCampaign(req.user.organizationId, body);
  }

  @Get('campaigns')
  async getCampaigns(@Request() req: any) {
    return this.marketingService.getCampaigns(req.user.organizationId);
  }

  @Get('campaigns/:id')
  async getCampaignDetails(@Request() req: any, @Param('id') id: string) {
    return this.marketingService.getCampaignDetails(req.user.organizationId, id);
  }

  @Post('campaigns/:id/send')
  async sendCampaign(@Request() req: any, @Param('id') id: string) {
    return this.marketingService.startBroadcast(req.user.organizationId, id);
  }
}
