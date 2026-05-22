import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('metrics')
  async getMetrics(@Request() req: any) {
    return this.adminService.getSystemMetrics(req.user);
  }

  @Get('users')
  async getUsers(@Request() req: any) {
    return this.adminService.getUsers(req.user);
  }

  @Post('users/:id/toggle')
  async toggleUser(@Request() req: any, @Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleUserActive(req.user, id, body.isActive);
  }

  @Get('audits')
  async getAudits(@Request() req: any) {
    return this.adminService.getAuditLogs(req.user);
  }
}
