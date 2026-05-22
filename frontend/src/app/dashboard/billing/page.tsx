"use client";

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  HelpCircle, 
  Sparkles, 
  MessageSquare, 
  Users, 
  Compass, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import confetti from 'canvas-confetti';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/billing/subscription');
      setSubscription(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription quotas');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (planName: string) => {
    try {
      setCheckoutLoading(planName);
      setError('');
      
      // Simulate real Stripe checkout trigger
      const checkoutRes = await apiRequest('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planName })
      });

      // Simulate a webhook callback after checkout to auto-upgrade locally
      await apiRequest('/billing/webhook-trigger', {
        method: 'POST',
        body: JSON.stringify({ planName })
      });

      // Trigger Confetti Celebration!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Refetch
      fetchSubscription();
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-neutral-500">Loading quotas and plans...</div>;
  }

  const { plan, usage } = subscription || { plan: 'STARTER', usage: { messagesSentThisMonth: 0, messageLimit: 1000, contactsCreated: 0, contactLimit: 500, workflowsCount: 0, workflowLimit: 5 } };

  // Calculate percentages
  const messagePercent = Math.min(100, Math.round((usage.messagesSentThisMonth / usage.messageLimit) * 100));
  const contactPercent = Math.min(100, Math.round((usage.contactsCreated / usage.contactLimit) * 100));
  const workflowPercent = Math.min(100, Math.round((usage.workflowsCount / usage.workflowLimit) * 100));

  const pricingTiers = [
    {
      name: 'STARTER',
      price: '$29',
      period: '/mo',
      description: 'Ideal for small businesses starting out with basic AI chat automation.',
      features: [
        '1,000 messages / month',
        '500 CRM Contacts limit',
        '5 Visual Workflows canvas',
        'OpenAI / Gemini integrations',
        'Meta WhatsApp Cloud API setup',
        'Standard Email support'
      ]
    },
    {
      name: 'GROWTH',
      price: '$79',
      period: '/mo',
      description: 'Best for scaling brands requiring multi-agent panels and high broadcast counts.',
      features: [
        '5,000 messages / month',
        '2,500 CRM Contacts limit',
        '15 Visual Workflows canvas',
        'Priority AI Agent suggestions',
        'Zapier & Make.com Webhooks',
        '24/7 Priority support'
      ],
      popular: true
    },
    {
      name: 'ENTERPRISE',
      price: '$249',
      period: '/mo',
      description: 'Built for high-volume sales organizations needing dedicated throughput.',
      features: [
        'Unlimited messages / month',
        '100,000 CRM Contacts limit',
        'Unlimited Visual Workflows',
        'Dedicated custom AI model prompts',
        'Database direct webhooks',
        'Dedicated Account Manager'
      ]
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header Banner */}
      <div className="border-b border-border pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
            Plan, Quotas &amp; Billing
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Manage your subscription tier, track real-time API limits, and test Stripe webhook automation.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-neutral-900 border border-border px-4 py-2 rounded-xl">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div className="text-left">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Current Tier</div>
            <div className="text-xs font-black text-white uppercase tracking-wider">{plan}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quota Progress meters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Messages Progress */}
        <div className="glass-panel p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Messages Sent</span>
              <MessageSquare className="w-5 h-5 text-violet-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">{usage.messagesSentThisMonth.toLocaleString()}</span>
              <span className="text-sm text-neutral-500">/ {usage.messageLimit === 1000000 ? 'Unlimited' : usage.messageLimit.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-[10px] font-bold mb-1.5">
              <span className="text-neutral-400">{messagePercent}% limit utilized</span>
              <span className="text-neutral-500">{usage.messageLimit - usage.messagesSentThisMonth} remaining</span>
            </div>
            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500" 
                style={{ width: `${messagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Contacts Progress */}
        <div className="glass-panel p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">CRM Contacts limit</span>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">{usage.contactsCreated.toLocaleString()}</span>
              <span className="text-sm text-neutral-500">/ {usage.contactLimit.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-[10px] font-bold mb-1.5">
              <span className="text-neutral-400">{contactPercent}% limit utilized</span>
              <span className="text-neutral-500">{usage.contactLimit - usage.contactsCreated} remaining</span>
            </div>
            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500" 
                style={{ width: `${contactPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Workflows Progress */}
        <div className="glass-panel p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Visual Workflows limit</span>
              <Compass className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">{usage.workflowsCount.toLocaleString()}</span>
              <span className="text-sm text-neutral-500">/ {usage.workflowLimit.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-[10px] font-bold mb-1.5">
              <span className="text-neutral-400">{workflowPercent}% limit utilized</span>
              <span className="text-neutral-500">{usage.workflowLimit - usage.workflowsCount} remaining</span>
            </div>
            <div className="h-2 bg-neutral-900 rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500" 
                style={{ width: `${workflowPercent}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Pricing Comparison Grid */}
      <div>
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-white">Compare Plans &amp; Capabilities</h2>
          <p className="text-neutral-400 text-xs max-w-lg mx-auto">
            Scale seamlessly. Select your required plan. Click upgrade to simulate full Stripe checkouts instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingTiers.map((tier) => {
            const isCurrent = plan === tier.name;
            return (
              <div 
                key={tier.name}
                className={`glass-panel rounded-3xl border p-6 flex flex-col justify-between relative transition-all ${
                  tier.popular ? 'border-primary ring-2 ring-primary/10 shadow-xl shadow-primary/5' : 'border-border/80'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Zap className="w-3 h-3" /> Popular Choice
                  </span>
                )}

                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-wider uppercase">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-4xl font-black text-white">{tier.price}</span>
                      <span className="text-neutral-400 text-xs font-semibold">{tier.period}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-2.5 leading-relaxed">{tier.description}</p>
                  </div>

                  <div className="border-t border-border/80 pt-4 space-y-2.5">
                    {tier.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  {isCurrent ? (
                    <div className="w-full bg-neutral-900 border border-neutral-700/50 text-neutral-300 rounded-xl h-10 font-bold text-xs flex items-center justify-center gap-2">
                      Active Subscription
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckout(tier.name)}
                      disabled={checkoutLoading !== null}
                      className={`w-full h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        tier.popular
                          ? 'bg-primary hover:bg-primary/95 text-white glow-primary'
                          : 'bg-neutral-900 hover:bg-neutral-800 border border-border text-white'
                      }`}
                    >
                      {checkoutLoading === tier.name ? (
                        'Processing checkout...'
                      ) : (
                        <>
                          Upgrade Plan
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enterprise card banner */}
      <div className="glass-panel p-6 rounded-3xl border border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="font-bold text-white text-base flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Need higher throughput and custom AI model prompts?
          </div>
          <p className="text-neutral-400 text-xs max-w-xl">
            We provide custom containerized WhatsApp API integrations, direct PostgreSQL replicas, and private fine-tuned Llama/Gemini model options for volume aggregators.
          </p>
        </div>
        <button className="bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-xs h-10 px-5 rounded-xl transition-all whitespace-nowrap">
          Schedule Tech Call
        </button>
      </div>

    </div>
  );
}
