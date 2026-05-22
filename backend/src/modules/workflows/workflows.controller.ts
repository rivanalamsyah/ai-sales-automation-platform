import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private workflowsService: WorkflowsService) {}

  @Post()
  async createWorkflow(@Request() req: any, @Body() body: { name: string; description?: string; triggerType: string }) {
    return this.workflowsService.createWorkflow(req.user.organizationId, body);
  }

  @Get()
  async getWorkflows(@Request() req: any) {
    return this.workflowsService.getWorkflows(req.user.organizationId);
  }

  @Get(':id')
  async getWorkflow(@Request() req: any, @Param('id') id: string) {
    return this.workflowsService.getWorkflow(req.user.organizationId, id);
  }

  @Post(':id/graph')
  async updateGraph(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { nodes: any[]; edges: any[]; isActive?: boolean },
  ) {
    return this.workflowsService.updateWorkflowGraph(
      req.user.organizationId,
      id,
      body.nodes,
      body.edges,
      body.isActive,
    );
  }
}
