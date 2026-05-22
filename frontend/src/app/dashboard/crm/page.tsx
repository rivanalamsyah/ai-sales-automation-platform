"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  FileText,
  AlertCircle,
  TrendingUp,
  Mail,
  Phone,
  User,
  Clock,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function CrmKanban() {
  const [stages, setStages] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lead creation form states
  const [showAddLead, setShowAddLead] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newScore, setNewScore] = useState(50);
  const [newStageId, setNewStageId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  // Follow-up reminder drawer
  const [activeLeadForReminder, setActiveLeadForReminder] = useState<any>(null);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDue, setReminderDue] = useState('');

  useEffect(() => {
    loadCRMData();
  }, []);

  const loadCRMData = async () => {
    try {
      const [stagesData, contactsData, tagsData] = await Promise.all([
        apiRequest('/crm/stages'),
        apiRequest('/crm/contacts'),
        apiRequest('/crm/tags')
      ]);
      setStages(stagesData);
      setContacts(contactsData);
      setTags(tagsData);
      if (stagesData.length > 0) {
        setNewStageId(stagesData[0].id);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    try {
      await apiRequest('/crm/contacts', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          email: newEmail || undefined,
          leadScore: Number(newScore),
          stageId: newStageId,
          tagIds: selectedTagIds
        }),
      });

      // Reset
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewScore(50);
      setSelectedTagIds([]);
      setShowAddLead(false);

      loadCRMData();
    } catch (err) {}
  };

  const handleMoveStage = async (contactId: string, currentStageId: string, direction: 'left' | 'right') => {
    const currentIdx = stages.findIndex(s => s.id === currentStageId);
    if (currentIdx === -1) return;

    let targetIdx = direction === 'left' ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= stages.length) return; // boundary check

    const targetStageId = stages[targetIdx].id;

    // Optimistic update
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, stageId: targetStageId } : c));

    try {
      await apiRequest(`/crm/contacts/${contactId}`, {
        method: 'PATCH',
        body: JSON.stringify({ stageId: targetStageId }),
      });
    } catch (err) {
      loadCRMData(); // revert if failed
    }
  };

  const handleDeleteLead = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      await apiRequest(`/crm/contacts/${contactId}`, {
        method: 'DELETE',
      });
      loadCRMData();
    } catch (err) {}
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderDue || !activeLeadForReminder) return;

    try {
      await apiRequest(`/crm/contacts/${activeLeadForReminder.id}/reminders`, {
        method: 'POST',
        body: JSON.stringify({
          title: reminderTitle,
          dueAt: reminderDue,
        }),
      });

      setReminderTitle('');
      setReminderDue('');
      setActiveLeadForReminder(null);
      alert('Reminder scheduled successfully!');
      loadCRMData();
    } catch (err) {}
  };

  const getStageContacts = (stageId: string) => {
    return contacts.filter((c) => c.stageId === stageId);
  };

  return (
    <div className="space-y-6 text-left relative min-h-[calc(100vh-10rem)]">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">CRM Kanban Board</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage and scoring your sales leads stages from WhatsApp conversations.</p>
        </div>
        <button
          onClick={() => setShowAddLead(true)}
          className="h-10 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 transition-colors"
        >
          <Plus className="w-4.5 h-4.5" /> Add New Lead Card
        </button>
      </div>

      {/* Kanban Board Container */}
      {loading ? (
        <div className="text-xs text-neutral-500 py-10">Syncing sales boards...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
          {stages.map((stage) => {
            const stageLeads = getStageContacts(stage.id);
            return (
              <div 
                key={stage.id} 
                className="w-72 bg-neutral-950/70 border border-border/80 rounded-xl p-4 shrink-0 flex flex-col gap-3 min-h-[480px]"
              >
                {/* Column header */}
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-bold text-xs text-white uppercase tracking-wider">{stage.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 border border-border font-bold text-neutral-400">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards feed */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {stageLeads.map((c) => (
                    <div 
                      key={c.id} 
                      className="p-3.5 rounded-xl border border-border/80 bg-neutral-950 hover:border-primary/40 transition-colors flex flex-col justify-between gap-3 text-left relative group shadow-sm"
                    >
                      {/* Name & score indicator */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-white truncate max-w-[170px]">{c.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-whatsapp/10 text-whatsapp border border-whatsapp/20 font-mono">
                            {c.leadScore} pts
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-1 font-mono">{c.phone}</div>
                      </div>

                      {/* Tags */}
                      {c.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {c.tags.map((t: any) => (
                            <span 
                              key={t.id} 
                              className="text-[9px] px-1.5 py-0.5 rounded font-medium border text-white"
                              style={{ backgroundColor: `${t.color}15`, borderColor: `${t.color}40` }}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/60 mt-1">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleMoveStage(c.id, stage.id, 'left')}
                            className="p-1 rounded bg-neutral-900 border border-border text-neutral-500 hover:text-white"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveStage(c.id, stage.id, 'right')}
                            className="p-1 rounded bg-neutral-900 border border-border text-neutral-500 hover:text-white"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex gap-2">
                          {/* Schedule reminder trigger */}
                          <button
                            onClick={() => setActiveLeadForReminder(c)}
                            className="p-1 rounded text-neutral-500 hover:text-primary"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete Card */}
                          <button
                            onClick={() => handleDeleteLead(c.id)}
                            className="p-1 rounded text-neutral-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL dialog: Create Contact */}
      {showAddLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-md bg-neutral-950 border border-border rounded-xl p-6 text-left shadow-2xl relative">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Add New Lead Card</h3>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Name</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Steve Rogers"
                    className="w-full h-8 pl-8 pr-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 555-0143"
                    className="w-full h-8 pl-8 pr-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="steve@avengers.org"
                    className="w-full h-8 pl-8 pr-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Lead Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newScore}
                    onChange={(e) => setNewScore(Number(e.target.value))}
                    className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Starting Stage</label>
                  <select
                    value={newStageId}
                    onChange={(e) => setNewStageId(e.target.value)}
                    className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-xs text-neutral-300 focus:outline-none"
                  >
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tag selector */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1.5">Apply Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setSelectedTagIds(prev => 
                            isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                          );
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          isSelected ? 'bg-primary border-primary text-white font-bold' : 'bg-neutral-900 border-border text-neutral-400'
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddLead(false)}
                  className="h-8 px-4 border border-border text-neutral-400 text-xs font-semibold rounded hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded"
                >
                  Confirm Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL dialog: Add Reminder */}
      {activeLeadForReminder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-sm bg-neutral-950 border border-border rounded-xl p-6 text-left shadow-2xl relative">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" /> Schedule Reminder
            </h3>
            <p className="text-[11px] text-neutral-400 mb-4">Add a call, demo request, or check reminder for: <strong className="text-white">{activeLeadForReminder.name}</strong></p>
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Reminder Action Title</label>
                <input
                  type="text"
                  required
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="Call to pitch Pro plan upgrade"
                  className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Due Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={reminderDue}
                  onChange={(e) => setReminderDue(e.target.value)}
                  className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none text-neutral-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setActiveLeadForReminder(null)}
                  className="h-8 px-4 border border-border text-neutral-400 text-xs font-semibold rounded hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
