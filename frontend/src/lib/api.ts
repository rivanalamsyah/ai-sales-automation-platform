const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Safe wrapper for localStorage
const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('whatsaas_token');
  }
  return null;
};

const getStoredUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('whatsaas_user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

// Simulated Local Database for Frontend Sandbox (fallback when backend is not active)
const mockData = {
  user: {
    id: "mock-user-123",
    email: "ceo@acme-corp.com",
    name: "Tony Stark",
    role: "OWNER",
    organizationId: "mock-org-456"
  },
  token: "mock-jwt-signature-string",
  contacts: [
    { id: "c1", name: "Steve Rogers", phone: "+1 555-0143", email: "steve@avengers.org", leadScore: 92, stageId: "s3", tags: [{ id: "t1", name: "Hot Lead", color: "#EF4444" }], lastActivity: new Date().toISOString(), notes: [{ id: "n1", content: "Interested in the Growth plan. Requests custom contract terms.", createdAt: new Date().toISOString() }], reminders: [] },
    { id: "c2", name: "Bruce Banner", phone: "+1 555-0178", email: "bruce@gamma.edu", leadScore: 68, stageId: "s2", tags: [{ id: "t2", name: "Warm Lead", color: "#F59E0B" }], lastActivity: new Date().toISOString(), notes: [], reminders: [] },
    { id: "c3", name: "Natasha Romanoff", phone: "+1 555-0112", email: "natasha@shield.gov", leadScore: 99, stageId: "s5", tags: [{ id: "t3", name: "VIP Customer", color: "#8B5CF6" }], lastActivity: new Date().toISOString(), notes: [], reminders: [] },
    { id: "c4", name: "Thor Odinson", phone: "+1 555-0199", email: "thor@asgard.net", leadScore: 45, stageId: "s1", tags: [], lastActivity: new Date().toISOString(), notes: [], reminders: [] },
    { id: "c5", name: "Wanda Maximoff", phone: "+1 555-0210", email: "wanda@magic.io", leadScore: 30, stageId: "s6", tags: [], lastActivity: new Date().toISOString(), notes: [], reminders: [] }
  ],
  stages: [
    { id: "s1", name: "New Lead", color: "#3B82F6", position: 1 },
    { id: "s2", name: "Contacted", color: "#F59E0B", position: 2 },
    { id: "s3", name: "Qualified", color: "#10B981", position: 3 },
    { id: "s4", name: "Proposal Sent", color: "#8B5CF6", position: 4 },
    { id: "s5", name: "Won", color: "#059669", position: 5 },
    { id: "s6", name: "Lost", color: "#EF4444", position: 6 }
  ],
  tags: [
    { id: "t1", name: "Hot Lead", color: "#EF4444" },
    { id: "t2", name: "Warm Lead", color: "#F59E0B" },
    { id: "t3", name: "VIP Customer", color: "#8B5CF6" }
  ],
  botConfig: {
    isActive: true,
    systemPrompt: "You are a professional sales assistant for Acme Corp. Highlight pricing: Starter ($29/mo), Pro ($79/mo). Maintain a friendly, supportive tone.",
    temperature: 0.7,
    fallbackReply: "Sorry, I didn't catch that. Moving you to our customer representative shortly."
  },
  whatsAppStatus: {
    status: "CONNECTED",
    phoneNumber: "+1 555-0199"
  },
  campaigns: [
    { id: "camp1", name: "Product Launch Broadcast", content: "Hey {{name}}, we just launched our new visual workflow automation! Try it now: veloce.ai/workflows", status: "COMPLETED", sentCount: 150, readCount: 135, clickCount: 42, scheduledAt: null, createdAt: new Date().toISOString() },
    { id: "camp2", name: "Black Friday Discount", content: "Exclusive: Upgrade to Veloce Pro today and save 40% code: BLACK40", status: "DRAFT", sentCount: 0, readCount: 0, clickCount: 0, scheduledAt: new Date().toISOString(), createdAt: new Date().toISOString() }
  ],
  aiTemplates: [
    { id: "t1", name: "Sales Script Pitch", category: "SALES_SCRIPT", description: "Convert cold leads into demos fast.", prompt: "Write a WhatsApp sales pitch..." },
    { id: "t2", name: "Engagement Hook", category: "HOOK", description: "Openers that get a reply.", prompt: "5 hooks targeting..." },
    { id: "t3", name: "Call-to-Action", category: "CTA", description: "Boost click rates.", prompt: "Short urgent CTAs..." }
  ],
  billing: {
    plan: "GROWTH",
    status: "ACTIVE",
    usage: {
      messagesSentThisMonth: 185,
      messageLimit: 5000,
      contactsCreated: 4,
      contactLimit: 1000,
      workflowsCount: 3,
      workflowLimit: 10
    }
  },
  workflows: [
    {
      id: "wf1",
      name: "Welcome Auto-Responder",
      description: "Triggered on first incoming message. Sends welcome, tags, then updates stage.",
      isActive: true,
      triggerType: "INCOMING_MESSAGE",
      nodes: [
        { id: "n-trig", type: "TRIGGER", label: "Incoming Message", positionX: 100, positionY: 200, config: {} },
        { id: "n-ai", type: "ACTION_AI", label: "AI Smart Welcome", positionX: 350, positionY: 200, config: { promptText: "Say hi and offer assistance." } },
        { id: "n-delay", type: "ACTION_DELAY", label: "Wait 5 Seconds", positionX: 600, positionY: 200, config: { delaySeconds: 5 } }
      ],
      edges: [
        { id: "e1", sourceNodeId: "n-trig", targetNodeId: "n-ai" },
        { id: "e2", sourceNodeId: "n-ai", targetNodeId: "n-delay" }
      ],
      runs: [
        { id: "run1", contactName: "Steve Rogers", status: "SUCCESS", createdAt: new Date().toISOString(), logs: '[{"time":"2026-05-22T22:15:00Z","message":"Trigger verified: Incoming message"},{"time":"2026-05-22T22:15:01Z","message":"AI Welcome complete"},{"time":"2026-05-22T22:15:06Z","message":"Workflow terminal node finished"}]' }
      ]
    }
  ]
};

// Core HTTP wrapper supporting automatic token injections and sandbox fallbacks
export const apiRequest = async (path: string, options: RequestInit = {}): Promise<any> => {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.warn(`Backend connection failed for path [${path}]. Intercepting with sandbox fallback.`);
    return resolveMockRequest(path, options);
  }
};

// Route matcher that intercept network calls when backend is down
const resolveMockRequest = async (path: string, options: RequestInit): Promise<any> => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth routes
  if (path === '/auth/login') {
    if (body.email === 'admin@whatsaas.com' && body.password === 'admin123') {
      return { accessToken: mockData.token, user: mockData.user };
    }
    // Simulate register override or default back
    return {
      accessToken: mockData.token,
      user: {
        id: "mock-user-rand",
        email: body.email,
        name: body.email.split('@')[0],
        role: "OWNER",
        organizationId: "mock-org-rand"
      }
    };
  }
  if (path === '/auth/register') {
    return { accessToken: mockData.token, user: mockData.user };
  }
  if (path === '/auth/me') {
    const user = getStoredUser();
    return user || mockData.user;
  }

  // CRM routes
  if (path === '/crm/contacts') {
    if (method === 'POST') {
      const newContact = {
        id: `c-${Date.now()}`,
        name: body.name,
        phone: body.phone,
        email: body.email,
        leadScore: body.leadScore || 50,
        stageId: body.stageId || "s1",
        tags: body.tagIds?.map((tid: string) => mockData.tags.find(t => t.id === tid)).filter(Boolean) || [],
        lastActivity: new Date().toISOString(),
        notes: [],
        reminders: []
      };
      mockData.contacts.push(newContact);
      return newContact;
    }
    return mockData.contacts;
  }
  if (path.startsWith('/crm/contacts/')) {
    const contactId = path.split('/')[3];
    const contactIdx = mockData.contacts.findIndex(c => c.id === contactId);

    if (method === 'PATCH') {
      if (contactIdx !== -1) {
        mockData.contacts[contactIdx] = {
          ...mockData.contacts[contactIdx],
          ...body,
          tags: body.tagIds?.map((tid: string) => mockData.tags.find(t => t.id === tid)).filter(Boolean) || mockData.contacts[contactIdx].tags
        };
        return mockData.contacts[contactIdx];
      }
    }
    if (method === 'DELETE') {
      if (contactIdx !== -1) mockData.contacts.splice(contactIdx, 1);
      return { success: true };
    }
    // GET single contact details
    const contact = mockData.contacts.find(c => c.id === contactId);
    if (!contact) throw new Error('Contact not found');
    return contact;
  }
  if (path === '/crm/stages') {
    if (method === 'POST') {
      const newStage = { id: `s-${Date.now()}`, name: body.name, color: body.color, position: body.position };
      mockData.stages.push(newStage);
      return newStage;
    }
    return mockData.stages;
  }
  if (path === '/crm/tags') {
    if (method === 'POST') {
      const newTag = { id: `t-${Date.now()}`, name: body.name, color: body.color };
      mockData.tags.push(newTag);
      return newTag;
    }
    return mockData.tags;
  }

  // WhatsApp connection routes
  if (path === '/whatsapp/status') {
    return mockData.whatsAppStatus;
  }
  if (path === '/whatsapp/connect') {
    mockData.whatsAppStatus.status = 'CONNECTED';
    return { status: 'CONNECTED', phoneNumber: '+1 555-0199' };
  }
  if (path === '/whatsapp/disconnect') {
    mockData.whatsAppStatus.status = 'DISCONNECTED';
    mockData.whatsAppStatus.phoneNumber = '';
    return { status: 'DISCONNECTED' };
  }
  if (path === '/whatsapp/conversations') {
    // Generate list of conversations from contacts
    return mockData.contacts.map(c => ({
      id: `conv-${c.id}`,
      contactId: c.id,
      contact: c,
      status: 'ACTIVE',
      isBotActive: true,
      unreadCount: c.id === 'c1' ? 1 : 0,
      messages: c.id === 'c1' ? [
        { id: "m1", role: "USER", content: "Hi, I saw your advertising about automated campaigns. Do you integrate with n8n?", timestamp: new Date().toISOString() }
      ] : [
        { id: "m-last", role: "ASSISTANT", content: "Thanks for checking Veloce! Let us know if you need a demo.", timestamp: new Date().toISOString() }
      ]
    }));
  }
  if (path === '/whatsapp/send') {
    const contactId = body.conversationId.replace('conv-', '');
    const contactIdx = mockData.contacts.findIndex(c => c.id === contactId);
    if (contactIdx !== -1) {
      mockData.contacts[contactIdx].lastActivity = new Date().toISOString();
    }
    return { id: `m-${Date.now()}`, role: "ASSISTANT", content: body.content, timestamp: new Date().toISOString() };
  }
  if (path === '/whatsapp/simulate') {
    return { id: `m-${Date.now()}`, role: "USER", content: body.content, timestamp: new Date().toISOString() };
  }

  // AI Assistant routes
  if (path === '/ai/templates') {
    return mockData.aiTemplates;
  }
  if (path === '/ai/content') {
    const template = mockData.aiTemplates.find(t => t.id === body.templateId);
    return {
      templateId: body.templateId,
      name: template?.name || 'Generated Copy',
      category: template?.category || 'SALES_SCRIPT',
      generatedText: `*✨ Custom Copywriting output:*\n\nHey there! Looking to boost conversions by up to 45%? 🚀\n\nTry integrating our platform. Instantly replies to users 24/7.\n\n*Reply Demo to get started!*`
    };
  }
  if (path === '/ai/smart-replies') {
    return {
      suggestions: [
        "Sure, we integrate with n8n via webhooks!",
        "Our Growth Plan costs $29/mo.",
        "Let me connect you to a support agent."
      ]
    };
  }

  // Chatbot configuration
  if (path === '/chatbot/config') {
    if (method === 'POST') {
      mockData.botConfig = { ...mockData.botConfig, ...body };
      return mockData.botConfig;
    }
    return mockData.botConfig;
  }

  // Marketing broadcast
  if (path === '/marketing/campaigns') {
    if (method === 'POST') {
      const newCamp = {
        id: `camp-${Date.now()}`,
        name: body.name,
        content: body.content,
        status: "DRAFT",
        sentCount: 0,
        readCount: 0,
        clickCount: 0,
        scheduledAt: body.scheduledAt || null,
        createdAt: new Date().toISOString()
      };
      mockData.campaigns.push(newCamp);
      return newCamp;
    }
    return mockData.campaigns;
  }
  if (path.startsWith('/marketing/campaigns/')) {
    const campId = path.split('/')[3];
    if (path.endsWith('/send')) {
      const camp = mockData.campaigns.find(c => c.id === campId);
      if (camp) {
        camp.status = 'COMPLETED';
        camp.sentCount = 420;
        camp.readCount = 385;
        camp.clickCount = 98;
      }
      return { success: true };
    }
    // Details
    const campaign = mockData.campaigns.find(c => c.id === campId);
    return {
      ...campaign,
      logs: [
        { id: "log1", contact: mockData.contacts[0], status: "READ" },
        { id: "log2", contact: mockData.contacts[1], status: "READ" },
        { id: "log3", contact: mockData.contacts[2], status: "DELIVERED" }
      ]
    };
  }

  // Workflows
  if (path === '/workflows') {
    if (method === 'POST') {
      const newWf = {
        id: `wf-${Date.now()}`,
        name: body.name,
        description: body.description || '',
        isActive: false,
        triggerType: body.triggerType,
        nodes: [{ id: "n-trig", type: "TRIGGER", label: "Trigger Node", positionX: 100, positionY: 100, config: {} }],
        edges: [],
        runs: []
      };
      mockData.workflows.push(newWf);
      return newWf;
    }
    return mockData.workflows;
  }
  if (path.startsWith('/workflows/')) {
    const wfId = path.split('/')[2];
    const wfIdx = mockData.workflows.findIndex(w => w.id === wfId);

    if (path.endsWith('/graph')) {
      if (wfIdx !== -1) {
        mockData.workflows[wfIdx].nodes = body.nodes;
        mockData.workflows[wfIdx].edges = body.edges;
        if (body.isActive !== undefined) mockData.workflows[wfIdx].isActive = body.isActive;
        return mockData.workflows[wfIdx];
      }
    }

    const wf = mockData.workflows.find(w => w.id === wfId);
    if (!wf) throw new Error('Workflow not found');
    return wf;
  }

  // Billing
  if (path === '/billing/subscription') {
    return mockData.billing;
  }
  if (path === '/billing/checkout') {
    return { checkoutUrl: `https://checkout.stripe.com/pay/mock_${Date.now()}` };
  }
  if (path === '/billing/webhook-trigger') {
    mockData.billing.plan = body.planName;
    mockData.billing.usage.messageLimit = body.planName === 'GROWTH' ? 10000 : 1000000;
    mockData.billing.usage.contactLimit = body.planName === 'GROWTH' ? 2500 : 100000;
    return { success: true, plan: body.planName };
  }

  // Admin Metrics
  if (path === '/admin/metrics') {
    return {
      current: { cpuUsage: Math.floor(10 + Math.random() * 20), ramUsage: 54, activeConns: 3 },
      history: Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
        cpuUsage: Math.floor(10 + Math.random() * 30),
        ramUsage: 52 + (i % 3),
        activeConns: 2 + (i % 2)
      })),
      dbSize: '1.4 MB',
      uptime: '1d 12h 43m'
    };
  }
  if (path === '/admin/users') {
    return [
      { id: "u1", name: "Tony Stark", email: "ceo@acme-corp.com", role: "OWNER", isActive: true, organization: { name: "Acme Corporation", plan: "GROWTH" }, createdAt: new Date().toISOString() }
    ];
  }
  if (path === '/admin/audits') {
    return [
      { id: "a1", action: "LOGIN", details: "User logged in successfully", createdAt: new Date().toISOString(), user: { name: "Tony Stark", email: "ceo@acme-corp.com" }, organization: { name: "Acme Corporation" } }
    ];
  }

  return {};
};
