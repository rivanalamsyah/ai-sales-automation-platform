"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  BarChart3, 
  Calendar, 
  Share2, 
  Play, 
  Check, 
  DollarSign, 
  CheckCircle2,
  Users,
  Terminal,
  Cpu
} from 'lucide-react';

export default function LandingPage() {
  const [chatInput, setChatInput] = useState('');
  const [chatLogs, setChatLogs] = useState<Array<{role: 'user' | 'bot', text: string}>>([
    { role: 'bot', text: "Hello! Welcome to Veloce AI. Type a message below to test our automated conversation engine!" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState({ messages: 128442, CTR: '28.4%', activeBots: 2420 });

  // Simulate dashboard statistics updates
  useEffect(() => {
    const timer = setInterval(() => {
      setStats(prev => ({
        messages: prev.messages + Math.floor(Math.random() * 3) + 1,
        CTR: '28.4%',
        activeBots: prev.activeBots
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatLogs(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      let reply = "I would be happy to help with that! We offer 24/7 sales agent support, webhook configurations, and campaign analytics. Would you like to schedule a 10-minute demo?";
      const text = userText.toLowerCase();

      if (text.includes('price') || text.includes('cost') || text.includes('pricing')) {
        reply = "Our pricing plans are simple: Free ($0/mo sandbox), Growth ($29/mo with 5k messages/mo), and Enterprise ($99/mo with unlimited quotas). You can sign up in seconds!";
      } else if (text.includes('human') || text.includes('agent') || text.includes('help')) {
        reply = "Understood. Our chatbot detects this query as a high-priority request and will mark this session for immediate Human Handoff. An agent has been alerted! 🔔";
      } else if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
        reply = "Hey there! Welcome. How can I help you automate your WhatsApp marketing workflows today?";
      }

      setChatLogs(prev => [...prev, { role: 'bot', text: reply }]);
      setIsTyping(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid-bg relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-whatsapp/5 blur-[150px]" />

      {/* Header Navigation */}
      <header className="border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center glow-primary">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">Veloce<span className="text-primary font-light">AI</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflows</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg flex items-center justify-center shadow-lg hover:shadow-primary/25 transition-all">
              Get Started <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold text-primary mb-6 animate-pulse-slow">
          <Sparkles className="w-3.5 h-3.5" /> Next-Generation WhatsApp Marketing & Sales automation
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Close more sales on <span className="bg-gradient-to-r from-whatsapp to-emerald-400 bg-clip-text text-transparent">WhatsApp</span> using Autonomous AI Agents
        </h1>
        <p className="text-neutral-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
          Combine powerful Conversational AI, Kanban Lead Management, Visual Automation Workflows, and Broadcasting to turn your chat windows into high-converting revenue streams.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
          <Link href="/auth/register" className="w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-primary to-violet-600 text-white font-semibold rounded-xl flex items-center justify-center shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Deploy Your AI Bot Free <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <a href="#demo" className="w-full sm:w-auto h-12 px-6 bg-neutral-900 border border-border hover:bg-neutral-800 text-neutral-300 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all">
            <Play className="w-4 h-4 fill-neutral-300" /> Watch 2m Walkthrough
          </a>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto p-6 rounded-2xl glass-panel border border-border/40 mb-20 text-left">
          <div>
            <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-1">Messages Transmitted Today</div>
            <div className="text-2xl font-bold font-mono tracking-tight text-white">{stats.messages.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-1">Avg. Broadcast Click Rate</div>
            <div className="text-2xl font-bold font-mono tracking-tight text-whatsapp">{stats.CTR}</div>
          </div>
          <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-border/60 pt-4 md:pt-0 md:pl-6">
            <div className="text-xs text-neutral-400 font-medium uppercase tracking-wider mb-1">Connected Tenant Bots</div>
            <div className="text-2xl font-bold font-mono tracking-tight text-violet-400">{stats.activeBots}</div>
          </div>
        </div>
      </section>

      {/* Interactive Chatbot Simulation Sandbox */}
      <section id="demo" className="max-w-7xl mx-auto px-6 py-16 relative z-10 border-t border-border/30">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 text-left">
            <div className="w-12 h-12 rounded-xl bg-whatsapp/10 border border-whatsapp/20 flex items-center justify-center text-whatsapp mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Experience the AI conversation flow live
            </h2>
            <p className="text-neutral-400 mb-6 leading-relaxed">
              Our chatbot detects prospect intents, answers FAQs with custom parameters, simulated organic delays, and forwards queries to a human agent when needed.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-whatsapp shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-300"><strong className="text-white">Intent-Detection:</strong> Auto-routes queries based on key terms.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-whatsapp shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-300"><strong className="text-white">Human Handoff:</strong> Deactivates AI when a custom user asks for support.</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-whatsapp shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-300"><strong className="text-white">Multilingual:</strong> Converses seamlessly in Spanish, English, Indonesian, and more.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {/* Mock Mobile / Chat Screen Mockup */}
            <div className="rounded-2xl border border-border/80 bg-neutral-950/80 shadow-2xl overflow-hidden max-w-lg mx-auto">
              <div className="bg-neutral-900 px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-whatsapp/20 flex items-center justify-center text-whatsapp font-bold text-sm relative">
                    V
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-whatsapp rounded-full border-2 border-neutral-900" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Veloce AI Assistant</div>
                    <div className="text-xs text-neutral-400">Online | AI Automated</div>
                  </div>
                </div>
                <div className="text-xs px-2.5 py-1 rounded bg-whatsapp/10 text-whatsapp border border-whatsapp/20 font-semibold">Active</div>
              </div>

              {/* Chat Window logs */}
              <div className="h-[280px] overflow-y-auto p-4 space-y-3 text-left text-sm flex flex-col bg-neutral-950">
                {chatLogs.map((log, i) => (
                  <div key={i} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                      log.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-neutral-800/80 border border-border text-neutral-200 rounded-tl-none'
                    }`}>
                      {log.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-neutral-800/80 border border-border text-neutral-400 rounded-xl rounded-tl-none px-4 py-2.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSimulateChat} className="p-3 bg-neutral-900 border-t border-border flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type 'pricing', 'speak to human', or hello..."
                  className="flex-1 h-10 px-3 bg-neutral-950 border border-border rounded-lg text-sm focus:outline-none focus:border-primary text-neutral-200"
                />
                <button type="submit" className="h-10 px-4 bg-whatsapp hover:bg-whatsapp/90 text-white font-semibold text-sm rounded-lg flex items-center justify-center transition-colors">
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-border/30 relative z-10 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          All-in-One Sales & Marketing Arsenal
        </h2>
        <p className="text-neutral-400 max-w-xl mx-auto mb-16">
          Everything your operations, customer support, and sales teams need to run robust WhatsApp automations.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl glass-card text-left">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live AI Chat Terminal</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Consolidate customer tickets, click suggested AI replies, apply tags, and trigger stages from a single dashboard console.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card text-left">
            <div className="w-10 h-10 rounded-lg bg-whatsapp/10 border border-whatsapp/20 flex items-center justify-center text-whatsapp mb-5">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Kanban Lead pipeline</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Visualize sales pipelines. Drag customer cards across Stages, log notes, and configure scheduled reminders for task management.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card text-left">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Marketing Broadcasts</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Send personalized templates to thousands of client numbers. Schedule cron drippings and inspect deliveries or clicks.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card text-left">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-5">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Visual Automation</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              A flow-chart builder. Connect triggers (e.g. Tag added) to actions like delay gates, AI replies, and n8n webhook sync.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card text-left">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Copywriter Assistant</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Generate cold outreach openers, high-urgency call-to-actions, and ad captions instantly using OpenAI and Gemini adapters.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card text-left">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Admin Resource Panel</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Supervisors can toggle user status, inspect detailed tenant usage audit logs, and monitor server CPU and RAM.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 border-t border-border/30 relative z-10 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          Flexible Pricing Plans
        </h2>
        <p className="text-neutral-400 max-w-xl mx-auto mb-16">
          Choose a plan that fits your growth profile. Cancel or change subscription tiers at any time.
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          {/* Free Tier */}
          <div className="p-8 rounded-2xl border border-border bg-neutral-950 flex flex-col justify-between">
            <div>
              <div className="text-sm text-neutral-400 font-semibold mb-2">Sandbox</div>
              <h3 className="text-xl font-bold text-white mb-4">Starter Free</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-sm text-neutral-400">/ forever</span>
              </div>
              <ul className="space-y-3.5 text-sm text-neutral-300 mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> 1,000 WhatsApp Messages/mo</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> 250 CRM Contacts limit</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> 5 Active workflows</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> Gemini Mock fallback</li>
              </ul>
            </div>
            <Link href="/auth/register" className="h-10 w-full rounded-lg border border-border hover:bg-neutral-900 text-sm font-semibold flex items-center justify-center transition-colors">
              Deploy Sandbox
            </Link>
          </div>

          {/* Growth Tier */}
          <div className="p-8 rounded-2xl border-2 border-primary bg-neutral-950 relative flex flex-col justify-between shadow-2xl shadow-primary/10">
            <div className="absolute top-0 right-6 transform -translate-y-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <div className="text-sm text-primary font-semibold mb-2">SaaS Scale</div>
              <h3 className="text-xl font-bold text-white mb-4">Growth Tier</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">$29</span>
                <span className="text-sm text-neutral-400">/ month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-neutral-300 mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> 10,000 WhatsApp Messages/mo</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> 2,500 CRM Contacts limit</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> 20 Active workflows</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> Real OpenAI / Gemini keys</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> n8n integration webhooks</li>
              </ul>
            </div>
            <Link href="/auth/register" className="h-10 w-full rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold flex items-center justify-center transition-colors shadow-lg shadow-primary/20">
              Upgrade to Growth
            </Link>
          </div>

          {/* Enterprise Tier */}
          <div className="p-8 rounded-2xl border border-border bg-neutral-950 flex flex-col justify-between">
            <div>
              <div className="text-sm text-neutral-400 font-semibold mb-2">High Volume</div>
              <h3 className="text-xl font-bold text-white mb-4">Enterprise</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">$99</span>
                <span className="text-sm text-neutral-400">/ month</span>
              </div>
              <ul className="space-y-3.5 text-sm text-neutral-300 mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> Unlimited Messages</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> Unlimited CRM Contacts</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> Unlimited Workflows</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> Custom System Prompt</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-whatsapp" /> Priority SLA & 24/7 Agent</li>
              </ul>
            </div>
            <Link href="/auth/register" className="h-10 w-full rounded-lg border border-border hover:bg-neutral-900 text-sm font-semibold flex items-center justify-center transition-colors">
              Contact Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="border-t border-border/40 py-12 bg-neutral-950/60 backdrop-blur-md relative z-10 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-neutral-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-white">Veloce AI</span>
          </div>
          <div>
            © 2026 Veloce AI Inc. All rights reserved. Built for global scaling.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
