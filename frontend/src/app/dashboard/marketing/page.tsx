"use client";

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Send, 
  Calendar, 
  Upload, 
  BarChart3, 
  Users, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  MailOpen,
  MousePointerClick,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MarketingCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch campaigns
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/marketing/campaigns');
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  // Mock CSV parsing
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);

      // Simulate parsing
      setCsvPreview([
        { name: "John Doe", phone: "+1 555-0101", status: "Valid" },
        { name: "Jane Smith", phone: "+1 555-0102", status: "Valid" },
        { name: "Peter Parker", phone: "+1 555-0103", status: "Valid" }
      ]);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !content) {
      setError('Please fill in the Campaign Name and Template Content.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMsg('');

      const body = {
        name,
        content,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null
      };

      const newCamp = await apiRequest('/marketing/campaigns', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setCampaigns([newCamp, ...campaigns]);
      setSuccessMsg(scheduledAt ? 'Campaign scheduled successfully!' : 'Campaign draft created!');
      
      // Reset form
      setName('');
      setContent('');
      setScheduledAt('');
      setCsvFile(null);
      setCsvPreview([]);
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNow = async (id: string) => {
    try {
      setError('');
      await apiRequest(`/marketing/campaigns/${id}/send`, { method: 'POST' });
      setSuccessMsg('Broadcast sent successfully!');
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message || 'Failed to send broadcast');
    }
  };

  // Analytics calculation
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
  const totalRead = campaigns.reduce((acc, c) => acc + (c.readCount || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clickCount || 0), 0);
  const avgReadRate = totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0;
  const avgClickRate = totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0;

  // Chart data
  const chartData = campaigns
    .filter(c => c.status === 'COMPLETED')
    .map(c => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
      Reads: c.readCount,
      Clicks: c.clickCount,
      CTR: Math.round((c.clickCount / (c.sentCount || 1)) * 100)
    })).reverse();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
            Campaign Broadcast Engine
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Send bulk personalized WhatsApp campaigns, schedule automated broadcasts, and analyze open/click engagement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/25">
            Active Broadcaster Online
          </span>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 text-sm flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400 text-sm flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Broadcasted</div>
            <div className="text-2xl font-bold mt-1 text-white">{totalSent.toLocaleString()}</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Across all campaigns</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-primary">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Avg Open Rate</div>
            <div className="text-2xl font-bold mt-1 text-white">{avgReadRate}%</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Industry avg: 85%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <MailOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Avg Click Rate</div>
            <div className="text-2xl font-bold mt-1 text-white">{avgClickRate}%</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Links in message template</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <MousePointerClick className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Active Campaigns</div>
            <div className="text-2xl font-bold mt-1 text-white">{campaigns.filter(c => c.status === 'DRAFT' || c.status === 'SCHEDULED').length}</div>
            <div className="text-[10px] text-neutral-500 mt-0.5">Queued or Draft state</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Create form vs Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Creation Form Panel */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-border space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base text-white">Create WhatsApp Campaign</h2>
          </div>

          <form onSubmit={handleCreateCampaign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Campaign Name</label>
              <input 
                type="text" 
                placeholder="e.g. June Product Launch" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-900 border border-border rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">Template Content</label>
                <span className="text-[10px] text-primary font-semibold hover:underline cursor-help">Variables Helper</span>
              </div>
              <textarea 
                rows={5}
                placeholder="Hi {{name}}, here is your discount for being a VIP: {{code}}" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-neutral-900 border border-border rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary transition-colors font-mono"
                required
              />
              <div className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                Use <code className="text-neutral-300 font-bold bg-neutral-900 px-1 py-0.5 rounded">{"{{name}}"}</code> to automatically interpolate the customer's full name from your CRM list.
              </div>
            </div>

            {/* CSV Recipient Upload Mock */}
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Audience List (.CSV)</label>
              <div className="border border-dashed border-border rounded-lg p-4 bg-neutral-950 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors relative">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleCsvChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="w-8 h-8 text-neutral-500 mb-2" />
                <div className="text-xs font-semibold text-neutral-300">
                  {csvFile ? csvFile.name : 'Upload custom CSV audience'}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Required headers: Phone, Name</div>
              </div>

              {csvPreview.length > 0 && (
                <div className="mt-3 bg-neutral-900 border border-border rounded-lg p-3 space-y-1.5">
                  <div className="text-[11px] font-bold text-neutral-400 border-b border-border pb-1 mb-1">
                    CSV Preview ({csvPreview.length} recipients found)
                  </div>
                  {csvPreview.map((row, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px]">
                      <span className="text-neutral-200">{row.name} ({row.phone})</span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">{row.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Schedule Broadcast (Optional)
              </label>
              <div className="relative">
                <input 
                  type="datetime-local" 
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-neutral-900 border border-border rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-primary transition-colors text-left"
                />
              </div>
              <div className="text-[10px] text-neutral-500 mt-1">Leave empty to save as a draft/send manually.</div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-lg h-10 font-bold text-sm flex items-center justify-center gap-2 transition-all glow-primary mt-2"
            >
              {scheduledAt ? (
                <>
                  <Calendar className="w-4 h-4" />
                  Schedule Broadcast
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Save Campaign Draft
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Performance Analytics Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h2 className="font-bold text-base text-white">Broadcast Engagement Performance</h2>
              </div>
              <div className="text-xs text-neutral-400 font-semibold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                CTR +2.4% this week
              </div>
            </div>
            
            {chartData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-10 h-10 text-neutral-600 mb-2" />
                <div className="text-xs text-neutral-400">No completed campaigns yet.</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Send a campaign to render engagement charts.</div>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="Reads" stroke="#3B82F6" fillOpacity={1} fill="url(#colorReads)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Clicks" stroke="#10B981" fillOpacity={1} fill="url(#colorClicks)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 border-t border-border pt-4 mt-4 text-center">
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase">Average Reads</div>
              <div className="text-lg font-bold text-blue-400 mt-0.5">{totalSent > 0 ? Math.round(totalRead / campaigns.filter(c=>c.status==='COMPLETED').length || 0) : 0}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase">Average Clicks</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{totalSent > 0 ? Math.round(totalClicks / campaigns.filter(c=>c.status==='COMPLETED').length || 0) : 0}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase">Average CTR</div>
              <div className="text-lg font-bold text-primary mt-0.5">{avgClickRate}%</div>
            </div>
          </div>
        </div>

      </div>

      {/* Campaigns History */}
      <div className="glass-panel p-6 rounded-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-violet-400" />
            <h2 className="font-bold text-base text-white">Broadcast Logs &amp; Queue</h2>
          </div>
          <button onClick={fetchCampaigns} className="text-xs text-primary font-semibold hover:underline">
            Refresh Queue
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">No campaigns created yet. Create a draft above to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-neutral-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">WhatsApp Content</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Sent</th>
                  <th className="py-3 px-4 text-center">Read Rate</th>
                  <th className="py-3 px-4 text-center">Clicks (CTR)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campaigns.map((c) => {
                  const hasSent = c.sentCount > 0;
                  const readPercent = hasSent ? Math.round((c.readCount / c.sentCount) * 100) : 0;
                  const clickPercent = hasSent ? Math.round((c.clickCount / c.sentCount) * 100) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white max-w-[150px] truncate">{c.name}</td>
                      <td className="py-3.5 px-4 text-neutral-400 max-w-[240px] truncate font-mono text-[11px]" title={c.content}>{c.content}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          c.status === 'COMPLETED' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : c.status === 'SCHEDULED'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            c.status === 'COMPLETED' ? 'bg-emerald-400' : c.status === 'SCHEDULED' ? 'bg-blue-400 animate-pulse' : 'bg-neutral-400'
                          }`} />
                          {c.status}
                        </span>
                        {c.scheduledAt && (
                          <div className="text-[9px] text-neutral-500 mt-1">
                            Sched: {new Date(c.scheduledAt).toLocaleDateString()} {new Date(c.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-neutral-200">{c.sentCount || 0}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-neutral-200">{readPercent}%</span>
                          <span className="text-[9px] text-neutral-500">{c.readCount || 0} reads</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-emerald-400">{c.clickCount || 0} ({clickPercent}%)</span>
                          <span className="text-[9px] text-neutral-500">CTR clicks</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {c.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleSendNow(c.id)}
                            className="bg-primary hover:bg-primary/95 text-white font-bold px-3 py-1.5 rounded-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1 text-[11px] ml-auto"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Send Now
                          </button>
                        )}
                        {c.status === 'COMPLETED' && (
                          <span className="text-[10px] font-bold text-neutral-500 italic">Dispatched</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
