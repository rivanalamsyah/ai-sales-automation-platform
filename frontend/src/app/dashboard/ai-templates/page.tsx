"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  MessageSquare, 
  Flame, 
  Compass, 
  MousePointer, 
  Settings2,
  RefreshCw,
  Eye,
  Sliders,
  Send,
  CornerDownLeft,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';

export default function AiTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Custom generator parameters
  const [category, setCategory] = useState('SALES_SCRIPT');
  const [audience, setAudience] = useState('');
  const [offer, setOffer] = useState('');
  const [tone, setTone] = useState('Professional');
  
  const [generatedText, setGeneratedText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Fetch AI prompt templates on mount
  useEffect(() => {
    apiRequest('/ai/templates')
      .then(data => {
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplate(data[0]);
        }
      })
      .catch(err => {
        console.error('Error fetching AI templates:', err);
      });
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audience || !offer) {
      setError('Please provide target audience and offer parameters.');
      return;
    }

    try {
      setGenerating(true);
      setError('');
      setGeneratedText('');

      const result = await apiRequest('/ai/content', {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplate?.id || 'custom',
          category,
          audience,
          offer,
          tone
        })
      });

      // Simple artificial delay for premium micro-animation loading look
      setTimeout(() => {
        // Interpolate parameters just to make output feel highly responsive and dynamic
        let finalOutput = result.generatedText;
        if (audience || offer) {
          finalOutput = finalOutput
            .replace('integrating our platform', `bringing ${offer} to ${audience}`)
            .replace('pricing: Starter ($29/mo), Pro ($79/mo)', `exclusive deal for ${audience}`);
        }
        setGeneratedText(finalOutput);
        setGenerating(false);
      }, 1200);

    } catch (err: any) {
      setError(err.message || 'AI Content generation failed');
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectCategoryTemplate = (tmpl: any) => {
    setSelectedTemplate(tmpl);
    setCategory(tmpl.category);
    // Auto populate fields based on category
    if (tmpl.category === 'SALES_SCRIPT') {
      setAudience('retail shop owners');
      setOffer('24/7 AI WhatsApp Sales Automations');
    } else if (tmpl.category === 'HOOK') {
      setAudience('e-commerce managers');
      setOffer('free shipping code integrations');
    } else {
      setAudience('leads who abandoned checkout');
      setOffer('15% direct coupon');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="border-b border-border pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            AI Marketing Copywriter
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Generate high-converting WhatsApp copywriting scripts, hook ideas, and calls to action instantly using fine-tuned prompts.
          </p>
        </div>
        <Link 
          href="/dashboard/ai-templates/prompt-manager" 
          className="bg-neutral-900 hover:bg-neutral-850 hover:border-neutral-700 border border-border text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 self-start md:self-auto shadow-md"
        >
          <Bot className="w-4 h-4 text-primary" />
          Manage Chatbot Personality
        </Link>
      </div>

      {/* Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Preset Templates */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-border">
            <h2 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              1. Choose Prompt Blueprint
            </h2>
            <div className="space-y-2.5">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplate?.id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => selectCategoryTemplate(tmpl)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected 
                        ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' 
                        : 'bg-neutral-900/60 border-border/80 hover:border-neutral-700 hover:bg-neutral-900'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${
                      tmpl.category === 'SALES_SCRIPT' ? 'bg-rose-500/10 text-rose-400' :
                      tmpl.category === 'HOOK' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {tmpl.category === 'SALES_SCRIPT' && <Flame className="w-4 h-4" />}
                      {tmpl.category === 'HOOK' && <Compass className="w-4 h-4" />}
                      {tmpl.category === 'CTA' && <MousePointer className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{tmpl.name}</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">{tmpl.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-border space-y-3">
            <div className="text-xs font-bold text-white">Why AI copywriting?</div>
            <p className="text-[10.5px] text-neutral-400 leading-relaxed">
              WhatsApp campaigns perform best when they are highly personalized, direct, and leverage urgency formatting (bold stars, clean emojis). Our AI models are customized specifically for conversational chat formats.
            </p>
          </div>
        </div>

        {/* Center Column: Parameters Config */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-border h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="font-bold text-sm text-white border-b border-border pb-3 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-violet-400" />
                2. Fine-tune Parameters
              </h2>

              {error && <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 text-xs">{error}</div>}

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-neutral-900 border border-border rounded-lg h-10 px-3 text-xs text-white focus:outline-none focus:border-primary"
                  >
                    <option value="SALES_SCRIPT">Sales Script &amp; Offers</option>
                    <option value="HOOK">Engagement Hooks &amp; Openers</option>
                    <option value="CTA">Call to Actions &amp; Urgency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Target Audience</label>
                  <input 
                    type="text" 
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. coffee shop owners, SaaS managers"
                    className="w-full bg-neutral-900 border border-border rounded-lg h-10 px-3 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Your Offer / Core Value</label>
                  <textarea 
                    rows={3}
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    placeholder="e.g. 30% discount on first box, free integration audit"
                    className="w-full bg-neutral-900 border border-border rounded-lg p-3 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Tone of Voice</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Professional', 'Energetic', 'Casual', 'Urgent'].map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setTone(t)}
                        className={`h-8 rounded-lg border text-xs font-semibold transition-all ${
                          tone === t 
                            ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' 
                            : 'bg-neutral-900 border-border text-neutral-400 hover:border-neutral-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-primary hover:bg-primary/95 text-white rounded-lg h-10 font-bold text-xs flex items-center justify-center gap-2 transition-all glow-primary mt-6"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Copy...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Copywriting
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output & WhatsApp Simulator */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Editor Container */}
          <div className="glass-panel p-5 rounded-2xl border border-border flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  3. Generated Output
                </span>
                {generatedText && (
                  <button 
                    onClick={handleCopy} 
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-900 border border-border px-2 py-1 rounded-md"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>

              {generating ? (
                <div className="space-y-3 py-6">
                  <div className="h-4 bg-neutral-900 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-neutral-900 rounded animate-pulse w-5/6"></div>
                  <div className="h-4 bg-neutral-900 rounded animate-pulse w-1/2"></div>
                  <div className="h-4 bg-neutral-900 rounded animate-pulse w-2/3"></div>
                </div>
              ) : generatedText ? (
                <div className="bg-neutral-950 border border-border/80 rounded-xl p-4 font-mono text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
                  {generatedText}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-500 text-xs">
                  Fill parameters and click Generate.
                </div>
              )}
            </div>

            {generatedText && (
              <div className="text-[10px] text-neutral-500 mt-4 text-center">
                Copy text output and insert into templates in the campaigns scheduler page.
              </div>
            )}
          </div>

          {/* WhatsApp Interactive Preview Frame */}
          <div className="glass-panel p-4 rounded-2xl border border-border bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-5">
            <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-extrabold uppercase shrink-0">V</div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-white leading-none">WhatsApp Preview</div>
                <div className="text-[8px] text-neutral-400">Business Account</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="bg-emerald-950/80 border border-emerald-500/25 rounded-2xl rounded-tl-none p-3 max-w-[85%] text-[10.5px] text-neutral-200 shadow-sm relative">
                {generatedText ? (
                  <p className="whitespace-pre-wrap leading-normal font-sans">
                    {generatedText.replace(/\*(.*?)\*/g, '$1')}
                  </p>
                ) : (
                  <p className="text-neutral-400 italic">No output text generated yet. Preview will render here.</p>
                )}
                <div className="text-[8px] text-right text-neutral-400 mt-1">10:14 PM ✔✔</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
