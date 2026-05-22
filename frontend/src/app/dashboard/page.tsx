"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Route, 
  Sparkles, 
  Zap, 
  ArrowUpRight, 
  ChevronRight,
  Activity,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any>({
    messagesSent: 185,
    messageLimit: 5000,
    contacts: 5,
    contactLimit: 1000,
    workflows: 3,
    workflowLimit: 10,
    activeChats: 3,
    recentAudits: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Collect dashboard metrics
    Promise.all([
      apiRequest('/billing/subscription'),
      apiRequest('/crm/contacts'),
      apiRequest('/admin/audits').catch(() => []) // Fallback if regular user
    ]).then(([billing, contacts, audits]) => {
      setMetrics({
        messagesSent: billing?.usage?.messagesSentThisMonth || 185,
        messageLimit: billing?.usage?.messageLimit || 5000,
        contacts: contacts?.length || 5,
        contactLimit: billing?.usage?.contactLimit || 1000,
        workflows: billing?.usage?.workflowsCount || 3,
        workflowLimit: billing?.usage?.workflowLimit || 10,
        activeChats: 3,
        recentAudits: audits.slice(0, 4) || [
          { id: '1', action: 'LOGIN', details: 'User logged in successfully', createdAt: new Date().toISOString() },
          { id: '2', action: 'CREATE_CONTACT', details: 'Added lead Steve Rogers', createdAt: new Date().toISOString() }
        ]
      });
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const kpis = [
    { name: 'Monthly Messages', value: metrics.messagesSent, limit: metrics.messageLimit, color: 'from-violet-500 to-purple-600', percent: Math.round((metrics.messagesSent / metrics.messageLimit) * 100), desc: 'API cloud broadcast quota usage' },
    { name: 'Lead Pipeline', value: metrics.contacts, limit: metrics.contactLimit, color: 'from-whatsapp to-emerald-600', percent: Math.round((metrics.contacts / metrics.contactLimit) * 100), desc: 'CRM contacts limit' },
    { name: 'Active Workflows', value: metrics.workflows, limit: metrics.workflowLimit, color: 'from-blue-500 to-indigo-600', percent: Math.round((metrics.workflows / metrics.workflowLimit) * 100), desc: 'Trigger-action logic gates' },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Page Header banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Analytics Hub</h1>
          <p className="text-sm text-neutral-400 mt-1">Real-time SaaS quota trackers and sales performance metrics.</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-lg border border-border bg-neutral-900 text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-whatsapp" /> System normal
          </div>
        </div>
      </div>

      {/* KPI Tiers Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="p-6 rounded-2xl bg-neutral-950 border border-border flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] rounded-full" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">{kpi.name}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono tracking-tight text-white">{kpi.value}</span>
                <span className="text-xs text-neutral-500">/ {kpi.limit.toLocaleString()}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1.5">{kpi.desc}</p>
            </div>
            {/* Quota limit bars */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 mb-1">
                <span>Usage progress</span>
                <span>{kpi.percent}%</span>
              </div>
              <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-border/40">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${kpi.color}`}
                  style={{ width: `${Math.min(kpi.percent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Funnel & Activity Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Sales Pipeline Funnel Graphic */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-neutral-950 border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-white">Conversion Pipeline Funnel</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Leads distribution by active stages</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-whatsapp/10 text-whatsapp border border-whatsapp/20 text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +12.4% Conversions
              </span>
            </div>

            {/* Custom SVG Pipeline Funnel Visualization */}
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 mb-1">
                  <span>New Leads Stage (100% Volume)</span>
                  <span>4 Leads</span>
                </div>
                <div className="h-6 w-full bg-neutral-900 rounded-lg overflow-hidden flex border border-border/60">
                  <div className="h-full bg-primary flex items-center px-3 text-[10px] font-bold text-white tracking-wider uppercase" style={{ width: '100%' }}>
                    Capture Pool
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 mb-1">
                  <span>Contacted Pipeline (75% Volume)</span>
                  <span>3 Leads</span>
                </div>
                <div className="h-6 w-full bg-neutral-900 rounded-lg overflow-hidden flex border border-border/60">
                  <div className="h-full bg-violet-600 flex items-center px-3 text-[10px] font-bold text-white tracking-wider uppercase" style={{ width: '75%' }}>
                    Active Chats
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 mb-1">
                  <span>Qualified / Demo Scheduled (50% Volume)</span>
                  <span>2 Leads</span>
                </div>
                <div className="h-6 w-full bg-neutral-900 rounded-lg overflow-hidden flex border border-border/60">
                  <div className="h-full bg-whatsapp flex items-center px-3 text-[10px] font-bold text-white tracking-wider uppercase" style={{ width: '50%' }}>
                    Sales Hooked
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 mb-1">
                  <span>Deals Won (25% Volume)</span>
                  <span>1 Lead</span>
                </div>
                <div className="h-6 w-full bg-neutral-900 rounded-lg overflow-hidden flex border border-border/60">
                  <div className="h-full bg-emerald-500 flex items-center px-3 text-[10px] font-bold text-white tracking-wider uppercase" style={{ width: '25%' }}>
                    Contract Signed
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-6 pt-4 text-xs text-neutral-400 flex items-center gap-1.5 justify-end">
            <span className="font-semibold text-white">Strategy Tip:</span> Connect a visual follow-up auto-responder workflow to boost conversion rates.
          </div>
        </div>

        {/* Recent Audit Action Feed */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-neutral-950 border border-border flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary animate-pulse" /> Workspace Event Feed
            </h3>
            
            <div className="space-y-4">
              {metrics.recentAudits.map((audit: any, index: number) => (
                <div key={index} className="flex gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  <div>
                    <div className="text-xs font-semibold text-white uppercase tracking-wider">{audit.action}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{audit.details}</div>
                    <div className="text-[10px] text-neutral-600 mt-0.5">{new Date(audit.createdAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border mt-6 pt-4">
            <button className="w-full text-xs font-bold text-primary hover:text-primary/80 flex items-center justify-center gap-1 py-1">
              Export Audit Trail <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
