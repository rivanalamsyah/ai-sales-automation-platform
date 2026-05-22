import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { AiService } from '../ai/ai.service';
import { WorkflowRunStatus } from '@prisma/client';

@Injectable()
export class WorkflowsService {
  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
    private aiService: AiService,
  ) {}

  async createWorkflow(organizationId: string, data: { name: string; description?: string; triggerType: string }) {
    return this.prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        organizationId,
      },
    });
  }

  async getWorkflows(organizationId: string) {
    return this.prisma.workflow.findMany({
      where: { organizationId },
      include: {
        nodes: true,
        edges: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getWorkflow(organizationId: string, id: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
      include: {
        nodes: true,
        edges: true,
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async updateWorkflowGraph(
    organizationId: string,
    id: string,
    nodes: any[],
    edges: any[],
    isActive?: boolean,
  ) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Wrap in a transaction to safely rebuild nodes and edges
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete existing nodes and edges
      await tx.workflowEdge.deleteMany({ where: { workflowId: id } });
      await tx.workflowNode.deleteMany({ where: { workflowId: id } });

      // 2. Insert new nodes
      await tx.workflowNode.createMany({
        data: nodes.map((n) => ({
          id: n.id,
          workflowId: id,
          type: n.type,
          label: n.label,
          positionX: n.positionX || 0,
          positionY: n.positionY || 0,
          config: JSON.stringify(n.config || {}),
        })),
      });

      // 3. Insert new edges
      await tx.workflowEdge.createMany({
        data: edges.map((e) => ({
          workflowId: id,
          sourceNodeId: e.sourceNodeId,
          targetNodeId: e.targetNodeId,
        })),
      });

      // 4. Update workflow state
      const updateData: any = { updatedAt: new Date() };
      if (isActive !== undefined) {
        updateData.isActive = isActive;
      }

      return tx.workflow.update({
        where: { id },
        data: updateData,
        include: {
          nodes: true,
          edges: true,
        },
      });
    });
  }

  // Visual Automation Workflow Execution Engine
  async triggerWorkflow(organizationId: string, triggerType: string, contactId: string, contextPayload: any = {}) {
    // Fetch all active workflows matching the trigger type
    const workflows = await this.prisma.workflow.findMany({
      where: {
        organizationId,
        triggerType,
        isActive: true,
      },
      include: {
        nodes: true,
        edges: true,
      },
    });

    for (const workflow of workflows) {
      this.executeWorkflowInstance(organizationId, workflow, contactId, contextPayload)
        .catch((err) => console.error(`Workflow instance execution failed: ${workflow.name}`, err));
    }
  }

  private async executeWorkflowInstance(organizationId: string, workflow: any, contactId: string, contextPayload: any) {
    // 1. Create a Workflow Run log
    const run = await this.prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        contactId,
        organizationId,
        status: WorkflowRunStatus.RUNNING,
        logs: JSON.stringify([{ time: new Date(), message: `Workflow started: ${workflow.name}` }]),
      },
    });

    const logs: any[] = JSON.parse(run.logs);
    const logHelper = async (msg: string) => {
      logs.push({ time: new Date(), message: msg });
      await this.prisma.workflowRun.update({
        where: { id: run.id },
        data: { logs: JSON.stringify(logs) },
      });
    };

    try {
      // 2. Identify the Trigger node
      const triggerNode = workflow.nodes.find((n) => n.type === 'TRIGGER');
      if (!triggerNode) {
        await logHelper('Error: No trigger node found in this workflow graph.');
        await this.prisma.workflowRun.update({
          where: { id: run.id },
          data: { status: WorkflowRunStatus.FAILED },
        });
        return;
      }

      await logHelper(`Trigger verified: ${triggerNode.label}`);

      // 3. Traversal Queue
      let currentNode = triggerNode;
      let traversalCompleted = false;

      while (!traversalCompleted) {
        // Find outbound edge
        const edge = workflow.edges.find((e) => e.sourceNodeId === currentNode.id);
        if (!edge) {
          await logHelper('Reached workflow terminal node.');
          traversalCompleted = true;
          break;
        }

        // Fetch target node
        const targetNode = workflow.nodes.find((n) => n.id === edge.targetNodeId);
        if (!targetNode) {
          await logHelper(`Error: Connection edge targets non-existent node: ${edge.targetNodeId}`);
          throw new Error('Graph consistency broken');
        }

        currentNode = targetNode;
        await logHelper(`Executing node action: [${targetNode.type}] ${targetNode.label}`);

        const nodeConfig = JSON.parse(targetNode.config);

        // 4. Node Action Processor
        switch (targetNode.type) {
          case 'ACTION_SEND':
            // Send direct WhatsApp text
            await this.executeActionSend(organizationId, contactId, nodeConfig.messageText, logHelper);
            break;

          case 'ACTION_AI':
            // Generate and send AI completion response
            await this.executeActionAI(organizationId, contactId, nodeConfig.promptText, logHelper);
            break;

          case 'ACTION_DELAY':
            // Delay action (simulated sleep)
            const seconds = parseInt(nodeConfig.delaySeconds) || 5;
            await logHelper(`Delay active. Sleeping for ${seconds} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
            break;

          case 'ACTION_WEBHOOK':
            // Trigger n8n/Google sheets or custom url webhook
            await this.executeActionWebhook(nodeConfig.url, contactId, contextPayload, logHelper);
            break;

          default:
            await logHelper(`Unknown action type omitted: ${targetNode.type}`);
        }
      }

      // Mark success
      await this.prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: WorkflowRunStatus.SUCCESS },
      });

      // Update org workflows executed usage stats
      await this.prisma.usageQuota.update({
        where: { organizationId },
        data: {
          workflowsCount: {
            increment: 1,
          },
        },
      });
    } catch (err) {
      await logHelper(`Execution aborted with error: ${err.message}`);
      await this.prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: WorkflowRunStatus.FAILED },
      });
    }
  }

  // Action helpers
  private async executeActionSend(orgId: string, contactId: string, text: string, logger: (msg: string) => Promise<void>) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) throw new Error('Contact not found');

    let conversation = await this.prisma.conversation.findFirst({
      where: { contactId, organizationId: orgId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { contactId, organizationId: orgId },
      });
    }

    const compiledText = text.replace(/{{name}}/g, contact.name);
    await this.whatsAppService.sendMessage(orgId, conversation.id, compiledText, false);
    await logger(`WhatsApp message dispatched to ${contact.name}: "${compiledText}"`);
  }

  private async executeActionAI(orgId: string, contactId: string, prompt: string, logger: (msg: string) => Promise<void>) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) throw new Error('Contact not found');

    let conversation = await this.prisma.conversation.findFirst({
      where: { contactId, organizationId: orgId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { contactId, organizationId: orgId },
      });
    }

    const userPrompt = `Prospect Name: ${contact.name}. Instruction: ${prompt}`;
    const aiOutput = await this.aiService.generateCompletion(orgId, userPrompt, 'You are an auto-reply automation system.');

    await this.whatsAppService.sendMessage(orgId, conversation.id, aiOutput, true);
    await logger(`AI generated response dispatched: "${aiOutput}"`);
  }

  private async executeActionWebhook(url: string, contactId: string, payload: any, logger: (msg: string) => Promise<void>) {
    if (!url) {
      await logger('Webhook execution skipped: missing endpoint URL.');
      return;
    }

    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });

    await logger(`Triggering webhook POST callback to ${url}...`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'workflow_trigger',
          contact: {
            id: contact?.id,
            name: contact?.name,
            phone: contact?.phone,
            email: contact?.email,
          },
          payload,
        }),
      });

      await logger(`Webhook status response: ${response.status} ${response.statusText}`);
    } catch (err) {
      await logger(`Webhook connection failed: ${err.message}`);
    }
  }
}
