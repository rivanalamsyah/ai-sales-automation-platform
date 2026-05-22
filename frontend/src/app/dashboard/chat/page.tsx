"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Tag, 
  Layers, 
  FileText, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  ArrowDownCircle,
  BellRing
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function LiveChatConsole() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Right details drawer states
  const [stages, setStages] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');

  // Simulator state
  const [simName, setSimName] = useState('Steve Rogers');
  const [simPhone, setSimPhone] = useState('+1 555-0143');
  const [simText, setSimText] = useState('Can I get a pricing list?');

  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Poll database on mount & connect WebSockets
  useEffect(() => {
    loadChatConsole();
    // Load CRM stages and tags
    apiRequest('/crm/stages').then(res => setStages(res)).catch(() => {});
    apiRequest('/crm/tags').then(res => setTags(res)).catch(() => {});

    // Establish WebSocket Sync connection
    const token = typeof window !== 'undefined' ? localStorage.getItem('whatsaas_token') : null;
    if (token && token !== 'mock-jwt-signature-string') {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';
      const socket = new WebSocket(`${wsUrl}?token=${token}`);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('Realtime WS synchronization connected.');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'new_message') {
            const newMsg = payload.data;
            
            // Update messages feed if it matches active conversation
            setActiveConv((prevActive: any) => {
              if (prevActive && prevActive.id === newMsg.conversationId) {
                setMessages(prevMsgs => {
                  if (prevMsgs.some(m => m.id === newMsg.id || (m.id.startsWith('temp-') && m.content === newMsg.content))) {
                    return prevMsgs.map(m => m.id.startsWith('temp-') && m.content === newMsg.content ? newMsg : m);
                  }
                  return [...prevMsgs, newMsg];
                });
                return {
                  ...prevActive,
                  messages: [...(prevActive.messages || []).filter((m: any) => !(m.id.startsWith('temp-') && m.content === newMsg.content)), newMsg]
                };
              }
              return prevActive;
            });

            // Update conversations list representation
            loadChatConsole();
          }
        } catch (err) {
          console.error('Failed parsing WS message:', err);
        }
      };

      socket.onclose = () => {
        console.log('Realtime WS synchronization disconnected.');
      };

      return () => {
        socket.close();
      };
    }
  }, []);

  useEffect(() => {
    if (activeConv) {
      setMessages(activeConv.messages || []);
      setNotes(activeConv.contact.notes || []);
      loadSmartReplies(activeConv.id);
    }
  }, [activeConv]);

  useEffect(() => {
    // Scroll chat window to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatConsole = async () => {
    try {
      const data = await apiRequest('/whatsapp/conversations');
      setConversations(data);
      if (data.length > 0 && !activeConv) {
        setActiveConv(data[0]);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const loadSmartReplies = async (convId: string) => {
    try {
      const res = await apiRequest('/ai/smart-replies', {
        method: 'POST',
        body: JSON.stringify({ conversationId: convId }),
      });
      setSuggestions(res.suggestions || []);
    } catch (err) {}
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() || !activeConv) return;

    if (!customText) setInputMsg('');

    // Append message optimistic update
    const tempMsg = {
      id: `temp-${Date.now()}`,
      role: 'ASSISTANT',
      content: textToSend,
      timestamp: new Date().toISOString(),
      isAI: false
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await apiRequest('/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: activeConv.id,
          content: textToSend,
        }),
      });

      // Reload logs
      loadChatConsole();
    } catch (err) {
      console.error(err);
    }
  };

  // Switch chatbot auto-replies for this active window
  const handleToggleBot = async (checked: boolean) => {
    if (!activeConv) return;
    try {
      await apiRequest('/chatbot/toggle', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: activeConv.id,
          isBotActive: checked
        }),
      });

      setActiveConv((prev: any) => ({
        ...prev,
        isBotActive: checked
      }));

      loadChatConsole();
    } catch (err) {}
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !activeConv) return;

    try {
      const res = await apiRequest(`/crm/contacts/${activeConv.contact.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: newNote }),
      });

      setNotes(prev => [res, ...prev]);
      setNewNote('');
    } catch (err) {}
  };

  const handleUpdateStage = async (stageId: string) => {
    if (!activeConv) return;
    try {
      await apiRequest(`/crm/contacts/${activeConv.contact.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stageId }),
      });
      loadChatConsole();
    } catch (err) {}
  };

  // SIMULATOR: Send a message as if you are the customer (triggers AI reply)
  const handleTriggerSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;

    try {
      await apiRequest('/whatsapp/simulate', {
        method: 'POST',
        body: JSON.stringify({
          phone: simPhone,
          name: simName,
          content: simText,
        }),
      });

      setSimText('');
      // Reload console after 1s to view the simulated results
      setTimeout(() => {
        loadChatConsole();
      }, 1000);
    } catch (err) {}
  };

  return (
    <div className="h-[calc(100vh-10rem)] border border-border rounded-2xl bg-neutral-950 overflow-hidden grid grid-cols-12 text-left">
      {/* 1. Left List Pane */}
      <div className="col-span-3 border-r border-border flex flex-col bg-neutral-950">
        <div className="p-4 border-b border-border font-bold text-sm text-white uppercase tracking-wider">
          Conversations ({conversations.length})
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {loading ? (
            <div className="p-4 text-xs text-neutral-500">Loading live streams...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-xs text-neutral-500 text-center">No active chats</div>
          ) : (
            conversations.map((conv) => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              const isSelected = activeConv?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full p-4 text-left hover:bg-neutral-900 transition-colors flex flex-col gap-1.5 ${
                    isSelected ? 'bg-neutral-900 border-l-2 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate max-w-[140px]">{conv.contact.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 truncate leading-relaxed">
                    {lastMsg ? lastMsg.content : 'Session initialized'}
                  </div>
                  <div className="flex items-center gap-1">
                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-primary text-[10px] font-bold text-white uppercase tracking-wider">Unread</span>
                    )}
                    {conv.isBotActive ? (
                      <span className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary flex items-center gap-0.5"><Cpu className="w-3 h-3" /> AI Bot Active</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500">Manual Handoff</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Middle Active Chat Pane */}
      <div className="col-span-6 flex flex-col justify-between bg-neutral-950 border-r border-border">
        {activeConv ? (
          <>
            {/* Header controls */}
            <div className="h-14 border-b border-border px-6 flex items-center justify-between">
              <div className="text-left">
                <span className="font-bold text-sm text-white">{activeConv.contact.name}</span>
                <span className="text-[11px] text-neutral-500 font-mono ml-2">{activeConv.contact.phone}</span>
              </div>

              {/* Bot toggler toggle */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-neutral-400">AI Auto-Replies</label>
                <input 
                  type="checkbox"
                  checked={activeConv.isBotActive}
                  onChange={(e) => handleToggleBot(e.target.checked)}
                  className="w-8 h-4 rounded-full bg-neutral-900 border border-border appearance-none checked:bg-primary relative before:absolute before:top-0.5 before:left-0.5 before:w-2.5 before:h-2.5 before:bg-white before:rounded-full before:transition-transform checked:before:translate-x-4 cursor-pointer"
                />
              </div>
            </div>

            {/* Message Feed panel */}
            <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-neutral-950">
              {messages.map((m) => {
                const isAgent = m.role === 'ASSISTANT';
                return (
                  <div key={m.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[80%] flex flex-col gap-1">
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isAgent 
                          ? 'bg-neutral-900 border border-border text-neutral-200 rounded-tr-none' 
                          : 'bg-primary text-white rounded-tl-none'
                      }`}>
                        {m.content}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end px-1">
                        {m.isAI && (
                          <span className="text-[9px] font-semibold text-primary uppercase tracking-wider flex items-center gap-0.5"><Bot className="w-3 h-3" /> Bot Reply</span>
                        )}
                        <span className="text-[9px] text-neutral-600 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Suggested click-to-replies & manual Input */}
            <div className="p-4 border-t border-border bg-neutral-950">
              {/* Click-to-Send smart replies */}
              {suggestions.length > 0 && (
                <div className="mb-3.5 flex flex-wrap gap-2 text-left">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(undefined, s)}
                      className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-primary flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="w-3 h-3" /> {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Main message draft form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Type a manual message response to client..."
                  className="flex-1 h-11 px-4 bg-neutral-900 border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-neutral-200 placeholder:text-neutral-500"
                />
                <button type="submit" className="w-11 h-11 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center justify-center transition-colors shadow-lg shadow-primary/15">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Bot className="w-12 h-12 text-neutral-600 mb-2.5" />
            <div className="font-bold text-sm text-neutral-300">No conversation selected</div>
            <p className="text-xs text-neutral-500 max-w-xs mt-1">Select an active contact thread from the left sidebar panel to begin messaging.</p>
          </div>
        )}
      </div>

      {/* 3. Right Details & Mock Simulator Drawer */}
      <div className="col-span-3 bg-neutral-950 flex flex-col divide-y divide-border">
        {activeConv ? (
          <>
            {/* Contact details */}
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-900/40 flex items-center justify-center text-primary font-bold">
                  {activeConv.contact.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs text-white">{activeConv.contact.name}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Score: <span className="font-mono text-whatsapp font-bold">{activeConv.contact.leadScore}</span></div>
                </div>
              </div>

              {/* CRM Stage selector */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Lead pipeline Stage</label>
                <div className="relative">
                  <select
                    value={activeConv.contact.stageId || ''}
                    onChange={(e) => handleUpdateStage(e.target.value)}
                    className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-xs font-semibold text-neutral-300 focus:outline-none focus:border-primary"
                  >
                    <option value="" disabled>Select Pipeline Stage</option>
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="p-4 flex-1 overflow-y-auto flex flex-col justify-between">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Internal Client Notes</label>
                <div className="space-y-2 max-h-[140px] overflow-y-auto mb-3 text-left">
                  {notes.length === 0 ? (
                    <div className="text-[11px] text-neutral-600">No notes written.</div>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="p-2 rounded bg-neutral-900 border border-border/40 text-[11px] text-neutral-300">
                        {n.content}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <form onSubmit={handleAddNote} className="flex gap-1.5">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a fast note..."
                  className="flex-1 h-8 px-2 bg-neutral-900 border border-border rounded text-[11px] focus:outline-none focus:border-primary text-neutral-200"
                />
                <button type="submit" className="h-8 px-3 bg-neutral-900 border border-border hover:bg-neutral-800 text-[11px] font-bold text-white rounded transition-colors">
                  Add
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="p-4 text-xs text-neutral-600">Select conversation to view context.</div>
        )}

        {/* WhatsApp Client Message Simulator Widget */}
        <div className="p-4 bg-neutral-950">
          <div className="flex items-center gap-1 text-primary font-bold text-[11px] uppercase tracking-wider mb-3">
            <BellRing className="w-3.5 h-3.5" /> WhatsApp Client Simulator
          </div>
          <form onSubmit={handleTriggerSimulation} className="space-y-2.5">
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 uppercase">Sim Name / Phone</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  placeholder="Steve Rogers"
                  className="h-7 px-2 bg-neutral-900 border border-border rounded text-[10px] text-neutral-300"
                />
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  placeholder="+1 555-0143"
                  className="h-7 px-2 bg-neutral-900 border border-border rounded text-[10px] text-neutral-300 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 uppercase">Message content</label>
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Can I get pricing details?"
                className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-[10px] text-neutral-300"
              />
            </div>
            <button type="submit" className="w-full h-8 bg-whatsapp hover:bg-whatsapp/90 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors">
              Dispatch Simulated incoming Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
