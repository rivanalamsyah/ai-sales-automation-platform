"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Save, 
  RefreshCw, 
  MessageSquare, 
  HelpCircle,
  AlertCircle,
  Cpu,
  Info,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

const PRESET_PROMPTS = [
  {
    name: "Elite Sales Pitcher",
    description: "Configured to qualify leads, present products, and schedule sales calls.",
    systemPrompt: "You are an elite sales consultant for Acme Corp. Your goal is to qualify incoming WhatsApp leads, present our service value, and gently capture their contact email or schedule a demo. Keep responses concise, friendly, and structured. Use bullet points and spacing to make it scannable.",
    fallbackReply: "Thanks for reaching out! A senior sales representative is checking your message and will reply in a moment.",
    temperature: 0.7,
    modelProvider: "GEMINI",
    modelName: "gemini-1.5-flash"
  },
  {
    name: "Customer Support Agent",
    description: "Optimized for troubleshooting, answering questions, and resolving tickets.",
    systemPrompt: "You are a customer support agent for Acme Corp. Your goal is to resolve issues politely and efficiently. Answer technical or account questions using the company guidelines. If the query requires account access or manual resolution, state clearly that you are transferring them to a live agent.",
    fallbackReply: "Sorry for the delay! We are mapping your issue to our technical support team now.",
    temperature: 0.3,
    modelProvider: "GEMINI",
    modelName: "gemini-1.5-flash"
  },
  {
    name: "Lead Qualifier & Capture",
    description: "Designed for running campaigns and identifying highly interested prospects.",
    systemPrompt: "You are a lead qualification bot. Engage prospects who respond to our campaigns, identify if they are business owners or managers, ask about their main pain points, and ask for their email address to send our pricing brochures.",
    fallbackReply: "Thank you! We've received your query and will email you the requested brochure shortly.",
    temperature: 0.5,
    modelProvider: "OPENAI",
    modelName: "gpt-4o-mini"
  }
];

export default function PromptManagerPage() {
  const [config, setConfig] = useState<any>({
    isActive: false,
    systemPrompt: '',
    temperature: 0.7,
    fallbackReply: '',
    modelProvider: 'GEMINI',
    modelName: 'gemini-1.5-flash'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch bot configurations
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest('/chatbot/config');
      if (data) {
        setConfig(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch chatbot config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const payload = {
        isActive: config.isActive,
        systemPrompt: config.systemPrompt,
        temperature: parseFloat(config.temperature),
        fallbackReply: config.fallbackReply,
        modelProvider: config.modelProvider,
        modelName: config.modelName
      };

      const updated = await apiRequest('/chatbot/config', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (updated) {
        setConfig(updated);
        setSuccess('Chatbot configuration saved successfully!');
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save chatbot config');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof PRESET_PROMPTS[0]) => {
    setConfig((prev: any) => ({
      ...prev,
      systemPrompt: preset.systemPrompt,
      fallbackReply: preset.fallbackReply,
      temperature: preset.temperature,
      modelProvider: preset.modelProvider,
      modelName: preset.modelName
    }));
    setSuccess(`Applied "${preset.name}" template configuration! Make sure to save changes.`);
    setTimeout(() => setSuccess(''), 4000);
  };

  const getTemperatureLabel = (temp: number) => {
    if (temp <= 0.2) return "Highly Deterministic / Concise";
    if (temp <= 0.5) return "Predictable & Professional";
    if (temp <= 0.7) return "Balanced & Natural";
    return "Creative & Conversational";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm text-neutral-400">Loading AI Prompt configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent flex items-center gap-2">
            <Bot className="w-8 h-8 text-primary animate-pulse" />
            AI Prompt Manager
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Configure default system prompts, chatbot personalities, temperature controls, and model configurations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - Preset Injection & Instructions */}
        <div className="lg:col-span-4 space-y-5">
          <div className="glass-panel p-5 rounded-2xl border border-border space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <Sparkles className="w-4 h-4 text-violet-400" />
              AI Prompt Blueprints
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Inject tested prompts to instantly reconfigure your conversational agent. Make sure to review the prompt content to insert custom variables if necessary.
            </p>
            <div className="space-y-3 pt-2">
              {PRESET_PROMPTS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="w-full text-left p-3.5 rounded-xl border border-border/85 bg-neutral-900/60 hover:bg-neutral-900/90 hover:border-neutral-700 transition-all flex flex-col gap-1.5"
                >
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {preset.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-normal">
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-border space-y-3 bg-neutral-950/20">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" />
              Prompt Engineering Advice
            </div>
            <ul className="space-y-2 text-[10.5px] text-neutral-400 list-disc list-inside leading-relaxed">
              <li>Keep instructions under 350 words to avoid context truncation.</li>
              <li>State the name of your organization, services, and product pricing structure clearly.</li>
              <li>Always tell the chatbot to remain concise since WhatsApp users prefer brief messages.</li>
              <li>Avoid emojis overload. Instruct the bot to use maximum 2 emojis per reply.</li>
            </ul>
          </div>
        </div>

        {/* Right column - Configuration Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-border space-y-6">
            
            {/* Status alerts */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            {/* Global Activate Switch */}
            <div className="flex items-center justify-between bg-neutral-950/40 p-4 rounded-xl border border-border">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white">Enable WhatsApp AI Autopilot</div>
                <div className="text-[10px] text-neutral-400">
                  Allow AI chatbot auto-responses on WhatsApp for all connected channels.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.isActive} 
                  onChange={(e) => setConfig((prev: any) => ({ ...prev, isActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white peer-checked:after:border-primary"></div>
              </label>
            </div>

            {/* Model & Providers Setup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary" />
                  Model Provider
                </label>
                <select
                  value={config.modelProvider}
                  onChange={(e) => setConfig((prev: any) => ({ ...prev, modelProvider: e.target.value, modelName: e.target.value === 'GEMINI' ? 'gemini-1.5-flash' : 'gpt-4o-mini' }))}
                  className="w-full bg-neutral-900 border border-border rounded-xl h-10 px-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                >
                  <option value="GEMINI">Google Gemini API</option>
                  <option value="OPENAI">OpenAI GPT Engines</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                  Model Engine
                </label>
                <select
                  value={config.modelName}
                  onChange={(e) => setConfig((prev: any) => ({ ...prev, modelName: e.target.value }))}
                  className="w-full bg-neutral-900 border border-border rounded-xl h-10 px-3 text-xs text-white focus:outline-none focus:border-primary transition-all"
                >
                  {config.modelProvider === 'GEMINI' ? (
                    <>
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Fast, Recommended)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (High intelligence)</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o-mini">gpt-4o-mini (Cost-effective, Recommended)</option>
                      <option value="gpt-4o">gpt-4o (Premium reasoning)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* System Instruction / Core Prompt */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                System Instruction Prompt
              </label>
              <textarea
                rows={6}
                value={config.systemPrompt}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="You are an expert representative..."
                className="w-full bg-neutral-900 border border-border rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-primary transition-all placeholder:text-neutral-600 leading-relaxed font-sans"
              />
              <span className="text-[10px] text-neutral-500 mt-1.5 block">
                This dictates the personality, style, boundary rules, and target conversion parameters of the AI.
              </span>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  Creativity Temperature ({config.temperature})
                </label>
                <span className="text-[10px] text-primary font-bold">
                  {getTemperatureLabel(config.temperature)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-primary bg-neutral-800 rounded-lg h-2"
              />
              <div className="flex justify-between text-[8px] text-neutral-500 mt-1 font-mono">
                <span>0.0 (Strict / Uniform)</span>
                <span>0.5 (Balanced)</span>
                <span>1.0 (Creative / Loose)</span>
              </div>
            </div>

            {/* Fallback Response */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Webhook Fallback Message
              </label>
              <input
                type="text"
                value={config.fallbackReply}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, fallbackReply: e.target.value }))}
                placeholder="A human will be with you shortly..."
                className="w-full bg-neutral-900 border border-border rounded-xl h-11 px-3.5 text-xs text-white focus:outline-none focus:border-primary transition-all"
              />
              <span className="text-[10px] text-neutral-500 mt-1.5 block">
                The safety fallback message sent if the LLM API fails, quota limits are reached, or processing errors out.
              </span>
            </div>

            {/* Footer Form Submit */}
            <div className="border-t border-border pt-5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl h-11 px-5 flex items-center gap-2 transition-all glow-primary"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Chatbot Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
