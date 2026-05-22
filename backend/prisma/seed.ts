import { PrismaClient, Role, ModelProvider, CampaignStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Default Organizations and SuperAdmin User
  const orgSlug = 'acme-corp';
  let org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Acme Corporation',
        slug: orgSlug,
        plan: 'GROWTH',
        subStatus: 'ACTIVE',
      },
    });
    console.log(`Created organization: ${org.name}`);
  }

  // Check and create SuperAdmin
  const adminEmail = 'admin@whatsaas.com';
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'SaaS SuperAdmin',
        password: hashedPassword,
        role: Role.SUPERADMIN,
        emailVerified: true,
        organizationId: org.id,
      },
    });
    console.log(`Created admin user: ${adminUser.email}`);
  }

  // 2. Create Default Lead Stages for this Org
  const stages = [
    { name: 'New Lead', color: '#3B82F6', position: 1 },
    { name: 'Contacted', color: '#F59E0B', position: 2 },
    { name: 'Qualified', color: '#10B981', position: 3 },
    { name: 'Proposal Sent', color: '#8B5CF6', position: 4 },
    { name: 'Won', color: '#059669', position: 5 },
    { name: 'Lost', color: '#EF4444', position: 6 },
  ];

  for (const s of stages) {
    const existingStage = await prisma.leadStage.findFirst({
      where: { organizationId: org.id, name: s.name },
    });
    if (!existingStage) {
      await prisma.leadStage.create({
        data: {
          name: s.name,
          color: s.color,
          position: s.position,
          organizationId: org.id,
        },
      });
    }
  }
  console.log('Seeded CRM pipeline stages.');

  // 3. Create Default Tags for this Org
  const tags = [
    { name: 'Hot Lead', color: '#EF4444' },
    { name: 'Warm Lead', color: '#F59E0B' },
    { name: 'Cold Lead', color: '#3B82F6' },
    { name: 'VIP', color: '#8B5CF6' },
    { name: 'Support Request', color: '#10B981' },
  ];

  for (const t of tags) {
    const existingTag = await prisma.tag.findFirst({
      where: { organizationId: org.id, name: t.name },
    });
    if (!existingTag) {
      await prisma.tag.create({
        data: {
          name: t.name,
          color: t.color,
          organizationId: org.id,
        },
      });
    }
  }
  console.log('Seeded CRM contact tags.');

  // 4. Create Usage Quota Entry
  const existingQuota = await prisma.usageQuota.findUnique({
    where: { organizationId: org.id },
  });
  if (!existingQuota) {
    await prisma.usageQuota.create({
      data: {
        organizationId: org.id,
        messagesSentThisMonth: 120,
        messageLimit: 5000,
        contactsCreated: 15,
        contactLimit: 1000,
        workflowsCount: 2,
        workflowLimit: 10,
      },
    });
    console.log('Seeded organization usage quotas.');
  }

  // 5. Create Default Chatbot Configuration
  const existingBot = await prisma.chatbotConfig.findUnique({
    where: { organizationId: org.id },
  });
  if (!existingBot) {
    await prisma.chatbotConfig.create({
      data: {
        organizationId: org.id,
        isActive: true,
        systemPrompt: 'You are an elite sales bot representing Acme Corp. Answer customer questions politely, present pricing details, and try to capture their email addresses to move them to a Sales stage.',
        temperature: 0.6,
        fallbackReply: 'Thank you for reaching out! A specialist will review your request shortly.',
        modelProvider: ModelProvider.GEMINI,
        modelName: 'gemini-1.5-flash',
      },
    });
    console.log('Seeded WhatsApp bot config.');
  }

  // 6. Create AI Content Assistant Templates
  const templates = [
    {
      name: 'High-Converting Sales Script',
      category: 'SALES_SCRIPT',
      description: 'Generates a persuasive WhatsApp conversation flow designed to introduce a product and close leads.',
      prompt: 'Write a professional, friendly 3-step conversational Sales script to sell a B2B SaaS system called {productName}. Address the pain point: {painPoint}. Direct CTA is {cta}. Include polite greetings and natural breaks.'
    },
    {
      name: 'Irresistible Marketing Hook',
      category: 'HOOK',
      description: 'Generates 5 attention-grabbing hooks to kick off cold outreach campaigns.',
      prompt: 'Generate 5 short, punchy, curiosity-inducing WhatsApp intro hook ideas targeting {targetAudience}. Product focus: {productFocus}. Must be under 150 characters each.'
    },
    {
      name: 'Urgent CTA (Call-to-Action)',
      category: 'CTA',
      description: 'Writes quick CTAs to drive users to schedule a call or purchase a subscription.',
      prompt: 'Create 3 variations of urgent CTAs for a WhatsApp broadcast promoting {offerName}. Embed scarcity or quick action triggers.'
    },
    {
      name: 'Warm Follow-Up Script',
      category: 'SALES_SCRIPT',
      description: 'Generates a polite follow-up template for cold leads that went unresponsive.',
      prompt: 'Create a gentle and warm follow-up WhatsApp message template for a prospect who has not replied for {daysIdle} days. Remind them of {valueProp} without being pushy.'
    }
  ];

  for (const t of templates) {
    const existingTpl = await prisma.aIContentTemplate.findFirst({
      where: { name: t.name },
    });
    if (!existingTpl) {
      await prisma.aIContentTemplate.create({
        data: t,
      });
    }
  }
  console.log('Seeded AI content assistant templates.');

  // 7. Seed WhatsApp Connection placeholder
  const existingConn = await prisma.whatsAppConnection.findUnique({
    where: { organizationId: org.id },
  });
  if (!existingConn) {
    await prisma.whatsAppConnection.create({
      data: {
        organizationId: org.id,
        status: 'DISCONNECTED',
      }
    });
  }

  // 8. Seed Demo Account and Demo Data
  console.log('Seeding Demo Account and Demo Data...');
  const demoEmail = 'demo@whatsaas.com';
  let demoUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!demoUser) {
    const hashedPassword = await bcrypt.hash('demo123', 10);
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        name: 'Demo Business Owner',
        password: hashedPassword,
        role: Role.OWNER,
        emailVerified: true,
        organizationId: org.id,
      },
    });
    console.log(`Created demo user: ${demoUser.email}`);
  }

  // Fetch Stages and Tags to associate with Contacts
  const newLeadStage = await prisma.leadStage.findFirst({
    where: { organizationId: org.id, name: 'New Lead' },
  });
  const contactedStage = await prisma.leadStage.findFirst({
    where: { organizationId: org.id, name: 'Contacted' },
  });
  const qualifiedStage = await prisma.leadStage.findFirst({
    where: { organizationId: org.id, name: 'Qualified' },
  });
  const wonStage = await prisma.leadStage.findFirst({
    where: { organizationId: org.id, name: 'Won' },
  });

  const vipTag = await prisma.tag.findFirst({
    where: { organizationId: org.id, name: 'VIP' },
  });
  const hotTag = await prisma.tag.findFirst({
    where: { organizationId: org.id, name: 'Hot Lead' },
  });

  // Seed sample CRM Contacts if they don't exist
  const contactsData = [
    { name: 'Natasha Romanoff', phone: '+6281234567890', email: 'natasha@avengers.org', stageId: contactedStage?.id, leadScore: 40 },
    { name: 'Tony Stark', phone: '+6281234567891', email: 'tony@starkindustries.com', stageId: qualifiedStage?.id, leadScore: 95 },
    { name: 'Bruce Banner', phone: '+6281234567892', email: 'bruce@bannerlabs.org', stageId: wonStage?.id, leadScore: 80 },
    { name: 'Clint Barton', phone: '+6281234567893', email: 'clint@shield.gov', stageId: newLeadStage?.id, leadScore: 25 },
  ];

  const seededContacts = [];
  for (const cData of contactsData) {
    let contact = await prisma.contact.findFirst({
      where: { organizationId: org.id, phone: cData.phone },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: cData.name,
          phone: cData.phone,
          email: cData.email,
          leadScore: cData.leadScore,
          stageId: cData.stageId,
          organizationId: org.id,
        },
      });
      
      // Relate tag manually
      if (cData.name === 'Tony Stark' && vipTag) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { tags: { connect: { id: vipTag.id } } },
        });
      } else if (cData.name === 'Natasha Romanoff' && hotTag) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { tags: { connect: { id: hotTag.id } } },
        });
      }
      console.log(`Created CRM contact: ${contact.name}`);
    }
    seededContacts.push(contact);
  }

  // Seed Conversations & Message Histories
  for (const contact of seededContacts) {
    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id, organizationId: org.id },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          organizationId: org.id,
          status: 'ACTIVE',
          isBotActive: contact.name !== 'Bruce Banner',
        },
      });
      console.log(`Created conversation for: ${contact.name}`);

      // Seed chat message history
      if (contact.name === 'Tony Stark') {
        await prisma.message.createMany({
          data: [
            {
              conversationId: conversation.id,
              role: 'USER',
              content: 'Hey, I am interested in setting up WhatsApp marketing campaigns for Stark Industries. Can your platform handle 10k messages daily?',
              organizationId: org.id,
              timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
            },
            {
              conversationId: conversation.id,
              role: 'ASSISTANT',
              content: 'Hello Tony! Yes, VeloceAI supports high-throughput campaign broadcasts powered by either our scale-out queue engine or local API setups. We can easily scale to handle millions of messages per day.',
              isAI: true,
              organizationId: org.id,
              timestamp: new Date(Date.now() - 3600000 * 2 + 60000), // 1.9 hours ago
            },
            {
              conversationId: conversation.id,
              role: 'USER',
              content: 'Sounds perfect. Send me a demo workflow setup and standard pricing for Enterprise tiers.',
              organizationId: org.id,
              timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            },
          ],
        });
      } else if (contact.name === 'Natasha Romanoff') {
        await prisma.message.createMany({
          data: [
            {
              conversationId: conversation.id,
              role: 'USER',
              content: 'Hello, what are your chatbot configuration capabilities?',
              organizationId: org.id,
              timestamp: new Date(Date.now() - 3600000 * 24), // 24 hours ago
            },
            {
              conversationId: conversation.id,
              role: 'ASSISTANT',
              content: 'Hi Natasha! You can customize prompts, set custom models (OpenAI, Gemini), tune responses, and define fallback replies.',
              isAI: true,
              organizationId: org.id,
              timestamp: new Date(Date.now() - 3600000 * 24 + 120000), // 23.9 hours ago
            },
          ],
        });
      } else if (contact.name === 'Clint Barton') {
        await prisma.message.createMany({
          data: [
            {
              conversationId: conversation.id,
              role: 'USER',
              content: 'Testing connection from Budapest.',
              organizationId: org.id,
              timestamp: new Date(Date.now() - 600000), // 10 mins ago
            },
          ],
        });
      }
    }
  }

  // Seed sample Campaigns
  let campaign = await prisma.campaign.findFirst({
    where: { organizationId: org.id, name: 'Q2 Product Launch' },
  });

  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        name: 'Q2 Product Launch',
        content: 'Hi {{name}}! We are thrilled to launch our new AI WhatsApp automation platform. Get 20% off today!',
        status: CampaignStatus.COMPLETED,
        sentCount: seededContacts.length,
        readCount: Math.ceil(seededContacts.length * 0.75),
        clickCount: 1,
        organizationId: org.id,
      },
    });
    console.log(`Created campaign: ${campaign.name}`);

    // Create CampaignLogs for each contact
    for (const c of seededContacts) {
      await prisma.campaignLog.create({
        data: {
          campaignId: campaign.id,
          contactId: c.id,
          status: c.name === 'Clint Barton' ? 'FAILED' : 'SENT',
          error: c.name === 'Clint Barton' ? 'Disconnected number' : null,
        },
      });
    }
  }

  let draftCampaign = await prisma.campaign.findFirst({
    where: { organizationId: org.id, name: 'Weekend Special Promo' },
  });

  if (!draftCampaign) {
    draftCampaign = await prisma.campaign.create({
      data: {
        name: 'Weekend Special Promo',
        content: 'Hello {{name}}! Exclusive weekend deals are here. Click this link to browse products now.',
        status: CampaignStatus.DRAFT,
        organizationId: org.id,
      },
    });
    console.log(`Created draft campaign: ${draftCampaign.name}`);
  }

  // Seed sample Workflow config
  let workflow = await prisma.workflow.findFirst({
    where: { organizationId: org.id, name: 'New Lead Auto-Welcome' },
  });

  if (!workflow) {
    workflow = await prisma.workflow.create({
      data: {
        name: 'New Lead Auto-Welcome',
        description: 'Automatically greet new leads and qualify them using AI.',
        triggerType: 'INCOMING_MESSAGE',
        isActive: true,
        organizationId: org.id,
      },
    });
    console.log(`Created workflow: ${workflow.name}`);

    // Create workflow nodes
    const nodeTrigger = await prisma.workflowNode.create({
      data: {
        workflowId: workflow.id,
        type: 'TRIGGER',
        label: 'When Message Received',
        positionX: 100,
        positionY: 200,
        config: JSON.stringify({ triggerOn: 'first_message' }),
      },
    });

    const nodeSend = await prisma.workflowNode.create({
      data: {
        workflowId: workflow.id,
        type: 'ACTION_SEND',
        label: 'Send Welcome Message',
        positionX: 400,
        positionY: 200,
        config: JSON.stringify({ message: 'Welcome to our business! Let us know how we can assist you.' }),
      },
    });

    const nodeAi = await prisma.workflowNode.create({
      data: {
        workflowId: workflow.id,
        type: 'ACTION_AI',
        label: 'AI Qualification Assistant',
        positionX: 700,
        positionY: 200,
        config: JSON.stringify({ prompt: 'Qualify if the user is looking for enterprise or retail setup.' }),
      },
    });

    // Create workflow edges
    await prisma.workflowEdge.createMany({
      data: [
        {
          workflowId: workflow.id,
          sourceNodeId: nodeTrigger.id,
          targetNodeId: nodeSend.id,
        },
        {
          workflowId: workflow.id,
          sourceNodeId: nodeSend.id,
          targetNodeId: nodeAi.id,
        },
      ],
    });
    console.log('Seeded workflow nodes and edges.');
  }

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
