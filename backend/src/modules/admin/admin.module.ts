import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UploadController } from './upload.controller';

@Module({
  controllers: [AdminController, UploadController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
