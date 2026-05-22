"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Plus, 
  Save, 
  Play, 
  Layers, 
  Trash2, 
  HelpCircle,
  Clock,
  Sparkles,
  Link,
  MessageSquare,
  Compass,
  FileCheck
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function VisualWorkflows() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [activeWf, setActiveWf] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWfName, setNewWfName] = useState('');
  const [newWfTrigger, setNewWfTrigger] = useState('INCOMING_MESSAGE');

  // Test simulation states
  const [isTesting, setIsTesting] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);

  useEffect(() => {
    loadWorkflows();
  }, []);

  useEffect(() => {
    if (activeWf) {
      setNodes(activeWf.nodes || []);
      setEdges(activeWf.edges || []);
      setSelectedNode(null);
      setTestLogs([]);
    }
  }, [activeWf]);

  const loadWorkflows = async () => {
    try {
      const data = await apiRequest('/workflows');
      setWorkflows(data);
      if (data.length > 0 && !activeWf) {
        setActiveWf(data[0]);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) return;

    try {
      const res = await apiRequest('/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name: newWfName,
          triggerType: newWfTrigger,
        }),
      });

      setNewWfName('');
      setShowCreateModal(false);
      loadWorkflows();
      setActiveWf(res);
    } catch (err) {}
  };

  const handleSaveGraph = async () => {
    if (!activeWf) return;

    try {
      const res = await apiRequest(`/workflows/${activeWf.id}/graph`, {
        method: 'POST',
        body: JSON.stringify({
          nodes: nodes.map(n => ({
            ...n,
            config: n.config || {}
          })),
          edges,
          isActive: activeWf.isActive
        }),
      });
      alert('Workflow graph saved successfully!');
      loadWorkflows();
    } catch (err) {
      alert('Failed to save workflow graph.');
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    if (!activeWf) return;
    setActiveWf((prev: any) => ({ ...prev, isActive }));
  };

  const handleAddActionNode = (type: 'ACTION_SEND' | 'ACTION_AI' | 'ACTION_DELAY' | 'ACTION_WEBHOOK') => {
    if (!activeWf) return;

    const labels = {
      ACTION_SEND: 'Send Msg',
      ACTION_AI: 'AI Prompt Reply',
      ACTION_DELAY: 'Delay Gate',
      ACTION_WEBHOOK: 'Post Callback'
    };

    const id = `node-${Date.now()}`;
    const newNode = {
      id,
      type,
      label: labels[type],
      positionX: 150 + nodes.length * 80,
      positionY: 200 + (nodes.length % 2 === 0 ? 50 : -50),
      config: type === 'ACTION_SEND' ? { messageText: 'Hi {{name}}, thanks for your inquiry!' } :
              type === 'ACTION_AI' ? { promptText: 'Introduce growth plans features' } :
              type === 'ACTION_DELAY' ? { delaySeconds: 5 } :
              { url: 'https://n8n.mycompany.com/webhook/receive' }
    };

    // Automatically connect from the last node
    const lastNode = nodes[nodes.length - 1];
    let newEdge = null;
    if (lastNode) {
      newEdge = {
        id: `edge-${Date.now()}`,
        sourceNodeId: lastNode.id,
        targetNodeId: id
      };
    }

    setNodes(prev => [...prev, newNode]);
    if (newEdge) {
      setEdges(prev => [...prev, newEdge]);
    }
  };

  const handleUpdateNodeConfig = (key: string, val: any) => {
    if (!selectedNode) return;
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNode.id) {
        const updatedConfig = { ...n.config, [key]: val };
        const updated = { ...n, config: updatedConfig };
        setSelectedNode(updated);
        return updated;
      }
      return n;
    }));
  };

  const handleRemoveNode = (nodeId: string) => {
    if (nodeId === 'n-trig') return; // Cannot delete trigger
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId));
    setSelectedNode(null);
  };

  // Run mock workflow test simulation in real time
  const handleTestFlow = async () => {
    if (nodes.length === 0) return;
    setIsTesting(true);
    setTestLogs(['Initializing flow test console...']);

    const runLogs = [
      'Trigger matched: Incoming message from Steve Rogers (+1 555-0143)',
      'Traversing node: [TRIGGER] Incoming Message - Status: OK',
    ];

    for (const node of nodes.slice(1)) {
      await new Promise(r => setTimeout(r, 1200));
      if (node.type === 'ACTION_SEND') {
        runLogs.push(`Traversing node: [ACTION_SEND] ${node.label} -> Dispatched simulated WhatsApp: "${node.config?.messageText || ''}"`);
      } else if (node.type === 'ACTION_AI') {
        runLogs.push(`Traversing node: [ACTION_AI] ${node.label} -> Dispatched prompt to Gemini-1.5-Flash`);
        await new Promise(r => setTimeout(r, 1000));
        runLogs.push(`AI Response output: "Hey Steve! We would be happy to schedules a demo about Veloce Pro..."`);
      } else if (node.type === 'ACTION_DELAY') {
        runLogs.push(`Traversing node: [ACTION_DELAY] Sleeping for ${node.config?.delaySeconds || 5} seconds...`);
      } else if (node.type === 'ACTION_WEBHOOK') {
        runLogs.push(`Traversing node: [ACTION_WEBHOOK] Trigger callback URL: ${node.config?.url || ''}`);
        runLogs.push('Webhook response status: 200 OK');
      }
      setTestLogs([...runLogs]);
    }

    await new Promise(r => setTimeout(r, 800));
    runLogs.push('Workflow run finished successfully. Status: COMPLETED');
    setTestLogs([...runLogs]);
    setIsTesting(false);
  };

  return (
    <div className="h-[calc(100vh-10rem)] border border-border rounded-2xl bg-neutral-950 overflow-hidden grid grid-cols-12 text-left select-none">
      {/* 1. Left List panel */}
      <div className="col-span-3 border-r border-border flex flex-col bg-neutral-950">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-bold text-sm text-white uppercase tracking-wider">Pipelines</span>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-1 rounded bg-neutral-900 border border-border hover:bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {loading ? (
            <div className="p-4 text-xs text-neutral-500">Syncing workflows...</div>
          ) : workflows.length === 0 ? (
            <div className="p-6 text-xs text-neutral-500 text-center">No pipelines found</div>
          ) : (
            workflows.map((wf) => {
              const isSelected = activeWf?.id === wf.id;
              return (
                <button
                  key={wf.id}
                  onClick={() => setActiveWf(wf)}
                  className={`w-full p-4 text-left hover:bg-neutral-900 transition-colors flex flex-col gap-1.5 ${
                    isSelected ? 'bg-neutral-900 border-l-2 border-primary' : ''
                  }`}
                >
                  <span className="font-bold text-xs text-white truncate">{wf.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-500 font-mono">Trigger: {wf.triggerType}</span>
                    <span className={`w-2 h-2 rounded-full ${wf.isActive ? 'bg-whatsapp' : 'bg-neutral-600'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Middle Editor Canvas */}
      <div className="col-span-6 bg-neutral-950 flex flex-col border-r border-border justify-between relative">
        {activeWf ? (
          <>
            {/* Header toolbar */}
            <div className="h-14 border-b border-border px-6 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-white">{activeWf.name}</span>
                {/* Active switch */}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className={`w-2 h-2 rounded-full ${activeWf.isActive ? 'bg-whatsapp animate-pulse' : 'bg-neutral-600'}`} />
                  <input 
                    type="checkbox"
                    checked={activeWf.isActive}
                    onChange={(e) => handleToggleActive(e.target.checked)}
                    className="w-8 h-4 rounded-full bg-neutral-900 border border-border appearance-none checked:bg-primary relative before:absolute before:top-0.5 before:left-0.5 before:w-2.5 before:h-2.5 before:bg-white before:rounded-full before:transition-transform checked:before:translate-x-4 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleTestFlow}
                  disabled={isTesting}
                  className="h-8 px-3 bg-neutral-900 border border-border hover:bg-neutral-800 text-[11px] font-bold text-white rounded flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Run Test Flow
                </button>
                <button
                  onClick={handleSaveGraph}
                  className="h-8 px-3 bg-primary hover:bg-primary/90 text-[11px] font-bold text-white rounded flex items-center gap-1 shadow-md transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Save Pipeline
                </button>
              </div>
            </div>

            {/* Visual Canvas design panel */}
            <div className="flex-1 bg-neutral-950 grid-bg relative overflow-auto p-8 flex items-center justify-start gap-12 min-h-[300px]">
              {nodes.map((node, i) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div key={node.id} className="flex items-center gap-8 shrink-0">
                    <div 
                      onClick={() => {
                        // Cast config if string
                        const parsedNode = {
                          ...node,
                          config: typeof node.config === 'string' ? JSON.parse(node.config) : node.config
                        };
                        setSelectedNode(parsedNode);
                      }}
                      className={`w-36 p-3 rounded-xl border bg-neutral-950 text-center cursor-pointer shadow-md hover:scale-[1.02] transition-all ${
                        isSelected 
                          ? 'border-primary shadow-primary/10 bg-neutral-900 ring-2 ring-primary/20' 
                          : 'border-border hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">
                        {node.type.replace('ACTION_', '')}
                      </div>
                      <div className="font-bold text-xs text-white truncate mt-1.5">{node.label}</div>
                      {node.type === 'ACTION_DELAY' && (
                        <div className="text-[10px] text-primary/80 mt-1 font-mono">{node.config?.delaySeconds || 5}s delay</div>
                      )}
                    </div>

                    {/* Edge Connector arrow (draw arrow if not last node) */}
                    {i < nodes.length - 1 && (
                      <div className="flex flex-col items-center gap-1 text-neutral-600 font-mono text-[9px]">
                        <span className="w-6 h-0.5 bg-neutral-800" />
                        <span>NEXT</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {nodes.length === 0 && (
                <div className="text-xs text-neutral-500 text-center w-full">Graph is empty. Create nodes.</div>
              )}
            </div>

            {/* Test Simulation logs overlay drawer */}
            {testLogs.length > 0 && (
              <div className="bg-neutral-950 border-t border-border p-4 h-48 overflow-y-auto font-mono text-[11px] text-left text-neutral-300">
                <div className="flex justify-between items-center pb-2 border-b border-border/40 mb-2">
                  <span className="font-bold text-primary flex items-center gap-1"><FileCheck className="w-3.5 h-3.5" /> Output Execution Logs</span>
                  <button onClick={() => setTestLogs([])} className="text-[10px] text-neutral-500 hover:text-white">Clear Console</button>
                </div>
                <div className="space-y-1.5">
                  {testLogs.map((log, index) => (
                    <div key={index} className={log.includes('finished') ? 'text-whatsapp font-bold' : log.includes('Response') ? 'text-primary' : ''}>
                      &gt; {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Compass className="w-12 h-12 text-neutral-600 mb-2.5" />
            <div className="font-bold text-sm text-neutral-300">No Pipeline Selected</div>
            <p className="text-xs text-neutral-500 max-w-xs mt-1">Select an active pipeline or click + to configure new trigger-action automation trees.</p>
          </div>
        )}
      </div>

      {/* 3. Right Node variables Parameter Panel */}
      <div className="col-span-3 bg-neutral-950 flex flex-col divide-y divide-border">
        <div className="p-4 border-b border-border font-bold text-xs text-white uppercase tracking-wider">
          Config Parameters
        </div>

        {selectedNode ? (
          <div className="p-4 space-y-4 text-left">
            <div>
              <div className="text-[10px] font-mono text-neutral-500 uppercase">Node ID</div>
              <div className="text-xs font-semibold text-white mt-0.5">{selectedNode.id}</div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Display Label</label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => {
                  const val = e.target.value;
                  setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, label: val } : n));
                  setSelectedNode((prev: any) => ({ ...prev, label: val }));
                }}
                className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none"
              />
            </div>

            {/* Dynamic settings based on node action type */}
            {selectedNode.type === 'ACTION_SEND' && (
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">WhatsApp Message Template</label>
                <textarea
                  value={selectedNode.config?.messageText || ''}
                  onChange={(e) => handleUpdateNodeConfig('messageText', e.target.value)}
                  placeholder="Hey {{name}}, what works best for you?"
                  className="w-full h-24 p-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none resize-none"
                />
              </div>
            )}

            {selectedNode.type === 'ACTION_AI' && (
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">AI Instruction System Prompt</label>
                <textarea
                  value={selectedNode.config?.promptText || ''}
                  onChange={(e) => handleUpdateNodeConfig('promptText', e.target.value)}
                  placeholder="Explain Veloce pricing plans detail."
                  className="w-full h-24 p-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none resize-none"
                />
              </div>
            )}

            {selectedNode.type === 'ACTION_DELAY' && (
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Delay Duration (Seconds)</label>
                <input
                  type="number"
                  min="1"
                  value={selectedNode.config?.delaySeconds || 5}
                  onChange={(e) => handleUpdateNodeConfig('delaySeconds', Number(e.target.value))}
                  className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none"
                />
              </div>
            )}

            {selectedNode.type === 'ACTION_WEBHOOK' && (
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Trigger Webhook URL</label>
                <input
                  type="text"
                  value={selectedNode.config?.url || ''}
                  onChange={(e) => handleUpdateNodeConfig('url', e.target.value)}
                  placeholder="https://n8n.mycompany.com/webhook"
                  className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none font-mono"
                />
              </div>
            )}

            <button
              onClick={() => handleRemoveNode(selectedNode.id)}
              disabled={selectedNode.id === 'n-trig'}
              className="w-full h-8 border border-red-500/20 hover:bg-red-500/5 text-red-400 font-bold text-[10px] uppercase rounded flex items-center justify-center gap-1 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Node Card
            </button>
          </div>
        ) : (
          <div className="p-4 text-xs text-neutral-600 text-center">Select node to customize triggers or parameters.</div>
        )}

        {/* Toolbar to append actions */}
        {activeWf && (
          <div className="p-4 text-left space-y-2">
            <div className="text-[10px] font-bold text-neutral-400 uppercase mb-2">Append Logic blocks</div>
            <button
              onClick={() => handleAddActionNode('ACTION_SEND')}
              className="w-full h-8 bg-neutral-900 hover:bg-neutral-800 border border-border rounded text-xs text-neutral-300 font-medium flex items-center justify-start gap-2 px-3 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" /> Send Text Message
            </button>
            <button
              onClick={() => handleAddActionNode('ACTION_AI')}
              className="w-full h-8 bg-neutral-900 hover:bg-neutral-800 border border-border rounded text-xs text-neutral-300 font-medium flex items-center justify-start gap-2 px-3 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-whatsapp" /> AI Smart Generator
            </button>
            <button
              onClick={() => handleAddActionNode('ACTION_DELAY')}
              className="w-full h-8 bg-neutral-900 hover:bg-neutral-800 border border-border rounded text-xs text-neutral-300 font-medium flex items-center justify-start gap-2 px-3 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-sky-400" /> Timeout Delay Gate
            </button>
            <button
              onClick={() => handleAddActionNode('ACTION_WEBHOOK')}
              className="w-full h-8 bg-neutral-900 hover:bg-neutral-800 border border-border rounded text-xs text-neutral-300 font-medium flex items-center justify-start gap-2 px-3 transition-colors"
            >
              <Link className="w-3.5 h-3.5 text-violet-400" /> n8n Webhook Sync
            </button>
          </div>
        )}
      </div>

      {/* MODAL dialog: Create Workflow */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="w-full max-w-sm bg-neutral-950 border border-border rounded-xl p-6 text-left shadow-2xl relative">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider mb-4">Create New Pipeline</h3>
            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Pipeline Name</label>
                <input
                  type="text"
                  required
                  value={newWfName}
                  onChange={(e) => setNewWfName(e.target.value)}
                  placeholder="Welcome Message responder"
                  className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-xs text-neutral-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase mb-1">Trigger Event Node</label>
                <select
                  value={newWfTrigger}
                  onChange={(e) => setNewWfTrigger(e.target.value)}
                  className="w-full h-8 px-2 bg-neutral-900 border border-border rounded text-xs text-neutral-300 focus:outline-none"
                >
                  <option value="INCOMING_MESSAGE">Incoming message received</option>
                  <option value="TAG_ADDED">Tag added to contact</option>
                  <option value="STAGE_CHANGED">CRM pipeline stage changed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="h-8 px-4 border border-border text-neutral-400 text-xs font-semibold rounded hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
