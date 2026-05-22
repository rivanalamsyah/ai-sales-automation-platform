import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppGateway } from './whatsapp.gateway';
import { WhatsAppCloudService } from './whatsapp-cloud.service';
import { BaileysSessionAdapter } from './baileys-session.adapter';
import { AuthModule } from '../auth/auth.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ChatbotModule),
  ],
  controllers: [WhatsAppController],
  providers: [WhatsAppService, WhatsAppGateway, WhatsAppCloudService, BaileysSessionAdapter],
  exports: [WhatsAppService, WhatsAppGateway, WhatsAppCloudService, BaileysSessionAdapter],
})
export class WhatsAppModule {}
