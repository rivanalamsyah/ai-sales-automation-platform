import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';
import { BroadcastProcessor } from './broadcast.processor';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    WhatsAppModule,
    BullModule.registerQueue({
      name: 'campaign_broadcast',
    }),
  ],
  controllers: [MarketingController],
  providers: [MarketingService, BroadcastProcessor],
  exports: [MarketingService],
})
export class MarketingModule {}
