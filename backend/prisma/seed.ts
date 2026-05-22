import { PrismaClient, Role, ModelProvider } from '@prisma/client';
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
