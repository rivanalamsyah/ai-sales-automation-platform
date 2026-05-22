import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get('subscription')
  async getSubscription(@Request() req: any) {
    return this.billingService.getSubscriptionDetails(req.user.organizationId);
  }

  @Post('checkout')
  async checkout(@Request() req: any, @Body() body: { planName: 'GROWTH' | 'ENTERPRISE' }) {
    return this.billingService.initiateCheckout(req.user.organizationId, body.planName);
  }

  // Exposed mock endpoint allowing front-end simulated checkouts to complete
  @Post('webhook-trigger')
  async webhookTrigger(@Request() req: any, @Body() body: { planName: 'GROWTH' | 'ENTERPRISE' }) {
    return this.billingService.processPaymentWebhook(req.user.organizationId, body.planName);
  }
}
