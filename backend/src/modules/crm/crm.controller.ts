import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('crm')
export class CrmController {
  constructor(private crmService: CrmService) {}

  @Post('contacts')
  async createContact(@Request() req: any, @Body() dto: CreateContactDto) {
    return this.crmService.createContact(req.user.organizationId, dto);
  }

  @Get('contacts')
  async findAllContacts(@Request() req: any) {
    return this.crmService.findAllContacts(req.user.organizationId);
  }

  @Get('contacts/:id')
  async findOneContact(@Request() req: any, @Param('id') id: string) {
    return this.crmService.findOneContact(req.user.organizationId, id);
  }

  @Patch('contacts/:id')
  async updateContact(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.crmService.updateContact(req.user.organizationId, id, dto);
  }

  @Delete('contacts/:id')
  async deleteContact(@Request() req: any, @Param('id') id: string) {
    return this.crmService.deleteContact(req.user.organizationId, id);
  }

  @Get('stages')
  async getStages(@Request() req: any) {
    return this.crmService.getStages(req.user.organizationId);
  }

  @Post('stages')
  async createStage(@Request() req: any, @Body() body: { name: string; color: string; position: number }) {
    return this.crmService.createStage(req.user.organizationId, body.name, body.color, body.position);
  }

  @Get('tags')
  async getTags(@Request() req: any) {
    return this.crmService.getTags(req.user.organizationId);
  }

  @Post('tags')
  async createTag(@Request() req: any, @Body() body: { name: string; color: string }) {
    return this.crmService.createTag(req.user.organizationId, body.name, body.color);
  }

  @Post('contacts/:id/notes')
  async addNote(@Request() req: any, @Param('id') id: string, @Body() body: { content: string }) {
    return this.crmService.addNote(id, req.user.id, body.content);
  }

  @Post('contacts/:id/reminders')
  async addReminder(@Request() req: any, @Param('id') id: string, @Body() body: { title: string; dueAt: string; description?: string }) {
    return this.crmService.addReminder(req.user.organizationId, req.user.id, id, body.title, body.dueAt, body.description);
  }
}
