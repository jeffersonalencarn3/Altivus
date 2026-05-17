import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import MessageBubble from '@/components/agent/MessageBubble';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, Plus, Trash2, MessageSquare, Loader2 } from 'lucide-react';

const AGENT_NAME = 'maintenance_scheduler';

const QUICK_PROMPTS = [
  'Analise o cronograma atual e identifique conflitos',
  'Quais equipes estão sobrecarregadas?',
  'Quais atividades atrasadas precisam de atenção urgente?',
  'Sugira uma redistribuição otimizada das equipes',
  'Quais unidades têm mais atividades simultâneas?',
];

export default function MaintenanceAgent() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeConversation) return;
    const unsub = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [activeConversation?.id]);

  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const convs = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      setConversations(convs || []);
    } finally {
      setLoadingConvs(false);
    }
  };

  const createConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `Sessão ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` },
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
    setMessages([]);
  };

  const selectConversation = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConversation(full);
    setMessages(full.messages || []);
  };

  const deleteConversation = async (e, convId) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversation?.id === convId) {
      setActiveConversation(null);
      setMessages([]);
    }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    let conv = activeConversation;
    if (!conv) {
      conv = await base44.agents.createConversation({
        agent_name: AGENT_NAME,
        metadata: { name: `Sessão ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` },
      });
      setConversations(prev => [conv, ...prev]);
      setActiveConversation(conv);
    }

    try {
      await base44.agents.addMessage(conv, { role: 'user', content: msg });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* Sidebar */}
      <div
        className="w-64 flex flex-col rounded-2xl shrink-0"
        style={{
          background: 'linear-gradient(145deg, rgba(10,16,32,0.92), rgba(6,10,22,0.97))',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00D4FF22, #7B61FF22)', border: '1px solid rgba(0,212,255,0.25)' }}
            >
              <Bot className="w-4 h-4" style={{ color: '#00D4FF' }} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Agente IA</p>
              <p className="text-[10px]" style={{ color: '#00D4FF' }}>Manutenção</p>
            </div>
          </div>
          <Button onClick={createConversation} className="w-full" size="sm">
            <Plus className="w-3.5 h-3.5" />
            Nova Sessão
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#00D4FF' }} />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-xs py-6" style={{ color: '#A0AEC0' }}>Nenhuma sessão ainda</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group"
                style={{
                  background: activeConversation?.id === conv.id ? 'rgba(0,212,255,0.08)' : 'transparent',
                  border: activeConversation?.id === conv.id ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                }}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" style={{ color: '#A0AEC0' }} />
                <span className="text-xs truncate flex-1 text-white/70">
                  {conv.metadata?.name || 'Sessão'}
                </span>
                <Trash2
                  className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#ff4444' }}
                  onClick={(e) => deleteConversation(e, conv.id)}
                />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className="flex-1 flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(10,16,32,0.92), rgba(6,10,22,0.97))',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] shrink-0">
          <PageHeader
            title="Agente de Manutenção"
            subtitle="Análise inteligente de cronogramas, capacidade e disponibilidade"
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!activeConversation && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(123,97,255,0.15))', border: '1px solid rgba(0,212,255,0.25)', boxShadow: '0 0 32px rgba(0,212,255,0.1)' }}
              >
                <Bot className="w-8 h-8" style={{ color: '#00D4FF' }} />
              </div>
              <div className="text-center">
                <h3 className="text-white font-semibold text-lg mb-1">Como posso ajudar?</h3>
                <p className="text-sm" style={{ color: '#A0AEC0' }}>Analiso seu cronograma de manutenção em tempo real</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="px-4 py-3 rounded-xl text-left text-xs transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#A0AEC0',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.25)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#A0AEC0'; }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))
          )}
          {sending && messages.length > 0 && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3 justify-start">
              <div className="h-7 w-7 rounded-lg bg-slate-100/5 flex items-center justify-center mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06] shrink-0">
          <div className="flex gap-3 items-center">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre o cronograma de manutenção..."
              className="flex-1"
              disabled={sending}
            />
            <Button onClick={() => sendMessage()} disabled={!input.trim() || sending} size="icon">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] mt-2 text-center" style={{ color: '#A0AEC0' }}>
            O agente tem acesso às Atividades, Unidades, Equipes, Áreas e Contratos
          </p>
        </div>
      </div>
    </div>
  );
}