import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModelProvider } from '@prisma/client';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  // Central Completion Dispatcher
  async generateCompletion(
    organizationId: string,
    prompt: string,
    systemInstruction = 'You are a helpful assistant.',
    provider?: ModelProvider,
  ): Promise<string> {
    const activeProvider = provider || (process.env.DEFAULT_AI_PROVIDER as ModelProvider) || ModelProvider.GEMINI;

    // Check if API keys exist, otherwise fallback to our advanced simulated response
    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const hasRealKey =
      (activeProvider === ModelProvider.OPENAI && openAiKey && !openAiKey.startsWith('sk-...')) ||
      (activeProvider === ModelProvider.GEMINI && geminiKey && !geminiKey.startsWith('AIzaSy'));

    if (!hasRealKey) {
      return this.simulateLLMResponse(prompt, systemInstruction);
    }

    try {
      if (activeProvider === ModelProvider.OPENAI) {
        return await this.callOpenAI(prompt, systemInstruction);
      } else {
        return await this.callGemini(prompt, systemInstruction);
      }
    } catch (err) {
      console.warn(`Real AI execution failed (${activeProvider}), falling back to simulator:`, err.message);
      return this.simulateLLMResponse(prompt, systemInstruction);
    }
  }

  private async callOpenAI(prompt: string, systemInstruction: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI HTTP Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callGemini(prompt: string, systemInstruction: string): Promise<string> {
    // Calling Gemini Developer API directly via fetch
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nUser Input: ${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini HTTP Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  // High-fidelity local AI response generator based on key concepts
  private simulateLLMResponse(prompt: string, systemInstruction: string): string {
    const normalizedPrompt = prompt.toLowerCase();
    const normalizedSystem = systemInstruction.toLowerCase();

    // CRM / Stage transitions mock
    if (normalizedPrompt.includes('sales script') || normalizedPrompt.includes('productName')) {
      return `*🌟 Acem Corp WhatsApp Pitch:*

Hey there! 👋 I noticed you were looking for ways to streamline operations. 

We built a custom workspace platform that solves this exact problem by:
1️⃣ Automating your CRM triggers instantly.
2️⃣ Providing smart AI chatbot support 24/7.
3️⃣ Generating copy suggestions in one click.

Would you be open to a quick 10-minute demo this Thursday at 2 PM? Let me know if that works! 🚀`;
    }

    if (normalizedPrompt.includes('hook') || normalizedPrompt.includes('marketing hook')) {
      return `Here are 3 thumb-stopping WhatsApp hooks:
1. "Quick question: how much time does your sales team waste manually messaging leads every day? 🕰️ Let's automate it."
2. "No one likes waiting. Give your clients instant answers on WhatsApp 24/7, even while you sleep. 🤖"
3. "Are your marketing broadcasts getting ignored? Try WhatsApp. 98% open rates don't lie. 📈"`;
    }

    // Default conversational responses
    if (normalizedPrompt.includes('hello') || normalizedPrompt.includes('hi') || normalizedPrompt.includes('hey')) {
      if (normalizedSystem.includes('sales')) {
        return "Hello! Thanks for reaching out to Acme Corporation. How can I help you find the right automation tools today? We offer Starter, Growth, and Enterprise plans! 😊";
      }
      return "Hi there! I am your AI assistant. How can I support you today?";
    }

    if (normalizedPrompt.includes('pricing') || normalizedPrompt.includes('cost') || normalizedPrompt.includes('plan')) {
      return "Our subscriptions start at just $29/mo for the Growth Plan (which includes 5,000 WhatsApp messages and 10 automation pipelines). Our Enterprise Plan starts at $99/mo and features unlimited quotas. Which option matches your needs?";
    }

    if (normalizedPrompt.includes('human') || normalizedPrompt.includes('agent') || normalizedPrompt.includes('speak to a person')) {
      return "I understand you would like to speak to a representative. I am marking this conversation for human handoff now. An agent will reply to you here shortly! 🤝";
    }

    return `Thank you for your message. 
Based on your inquiry: "${prompt}", we recommend visiting our dashboard or speaking with a consultant.

Let us know if you need anything else! (Simulated response)`;
  }

  // AI Content Copywriting Assistant Generator
  async generateAIContent(organizationId: string, templateId: string, inputs: Record<string, string>) {
    const template = await this.prisma.aIContentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('AI Copywriting template not found');
    }

    // Interpolate inputs into the template prompt
    let formattedPrompt = template.prompt;
    Object.keys(inputs).forEach((key) => {
      formattedPrompt = formattedPrompt.replace(new RegExp(`{${key}}`, 'g'), inputs[key]);
    });

    const systemPrompt = `You are a world-class conversion copywriter. Write highly engaging, short-form messaging optimized for WhatsApp. Use spacing and formatting like bold words (*word*) and emojis to make it scannable.`;
    const result = await this.generateCompletion(organizationId, formattedPrompt, systemPrompt);

    return {
      templateId: template.id,
      name: template.name,
      category: template.category,
      generatedText: result,
    };
  }

  // Generate 3 Smart Click-to-Send replies for a live support agent
  async generateSmartReplies(organizationId: string, conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId, organizationId },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    if (messages.length === 0) {
      return { suggestions: ['Hello! How can I help you?', 'Are you looking for support?', 'Hi! How is your day?'] };
    }

    // Build chat transcript context
    const transcript = messages
      .reverse()
      .map((m) => `${m.role === 'USER' ? 'Client' : 'Agent'}: ${m.content}`)
      .join('\n');

    const prompt = `Based on the following last few messages in a WhatsApp chat, generate exactly 3 separate short click-to-send reply options for the support agent. Keep them concise (less than 60 characters each). Separate suggestions with newlines.
    
Transcript:
${transcript}`;

    const systemPrompt = `You are an AI assistant helping a support agent reply to a customer. Write friendly, short, clickable response suggestions. Return ONLY the 3 suggestions, one per line. No numbers or list tags.`;
    const response = await this.generateCompletion(organizationId, prompt, systemPrompt);

    const suggestions = response
      .split('\n')
      .map((s) => s.trim().replace(/^-\s*/, '').replace(/^\d+\.\s*/, ''))
      .filter((s) => s.length > 0)
      .slice(0, 3);

    // Fallback if formatting was loose
    if (suggestions.length === 0) {
      return {
        suggestions: ['Sure, let me check that for you!', 'Could you tell me your order number?', 'Thanks! Let me know if that works.'],
      };
    }

    return { suggestions };
  }

  async getTemplates() {
    return this.prisma.aIContentTemplate.findMany();
  }
}
