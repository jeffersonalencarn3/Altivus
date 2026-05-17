import React, { useState } from 'react';
import { Brain, Send, Shield, AlertTriangle, CheckCircle2, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { differenceInDays } from 'date-fns';
import ReactMarkdown from 'react-markdown';

const QUICK_QUESTIONS = [
  { label: 'Checar vencimentos', prompt: 'Analisar certificações e equipamentos com vencimento próximo ou vencido' },
  { label: 'Rotina de inspeção', prompt: 'Qual a rotina de inspeção recomendada pela NR35 e IRATA para os equipamentos deste colaborador?' },
  { label: 'Exposição química', prompt: 'Quais os cuidados recomendados para equipamentos expostos a produtos químicos como Metasil e detergentes?' },
  { label: 'Checklist guiado', prompt: 'Gerar checklist completo de pré-uso para trabalho em altura conforme NR35 e IRATA' },
  { label: 'Armazenamento', prompt: 'Como armazenar corretamente cordas, cintos e EPIs de trabalho em altura?' },
  { label: 'Score operacional', prompt: 'Analisar score operacional e recomendar ações preventivas' },
];

export default function EmployeeAITab({ employee, equipments: equipmentsProp, inspections: inspectionsProp, checklists: _checklistsProp }) {
  const equipments = Array.isArray(equipmentsProp) ? equipmentsProp : [];
  const inspections = Array.isArray(inspectionsProp) ? inspectionsProp : [];
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(true);

  // Calcular insights automáticos
  const insights = [];

  // Certificações vencidas/vencendo
  (Array.isArray(employee.certifications) ? employee.certifications : []).forEach(cert => {
    if (!cert.expiry_date) return;
    const days = differenceInDays(new Date(cert.expiry_date), new Date());
    if (days < 0) insights.push({ type: 'danger', msg: `Certificação "${cert.name || cert.type}" está vencida há ${Math.abs(days)} dias.`, action: 'Renovar urgente' });
    else if (days <= 30) insights.push({ type: 'warning', msg: `Certificação "${cert.name || cert.type}" vence em ${days} dias.`, action: 'Agendar renovação' });
  });

  // Equipamentos com status crítico
  equipments.forEach(eq => {
    if (eq.status === 'revisao_n3') insights.push({ type: 'warning', msg: `Equipamento ${eq.tag} (${eq.name}) está aguardando Revisão N3.`, action: 'Contatar Supervisor N3' });
    if (eq.status === 'bloqueado') insights.push({ type: 'danger', msg: `Equipamento ${eq.tag} (${eq.name}) está bloqueado.`, action: 'Verificar com N3' });
    if (eq.expiry_date) {
      const days = differenceInDays(new Date(eq.expiry_date), new Date());
      if (days < 0) insights.push({ type: 'danger', msg: `Equipamento ${eq.tag} vencido há ${Math.abs(days)} dias.`, action: 'Inspeção N3 obrigatória' });
      else if (days <= 30) insights.push({ type: 'warning', msg: `Equipamento ${eq.tag} vence em ${days} dias.`, action: 'Agendar inspeção' });
    }
    if (eq.next_inspection_date) {
      const days = differenceInDays(new Date(eq.next_inspection_date), new Date());
      if (days <= 0) insights.push({ type: 'info', msg: `Inspeção periódica de ${eq.tag} está pendente.`, action: 'Agendar inspeção' });
    }
    if ((eq.chemical_exposure_count || 0) >= 5) insights.push({ type: 'warning', msg: `Equipamento ${eq.tag} com ${eq.chemical_exposure_count} exposições químicas. Score: ${eq.operational_score}.`, action: 'Monitoramento preventivo' });
  });

  const buildContext = () => {
    const certSummary = (Array.isArray(employee.certifications) ? employee.certifications : []).map(c =>
      `${c.type}: ${c.name}, validade ${c.expiry_date || 'indefinida'}, emissor ${c.issuer || 'não informado'}`
    ).join('\n');

    const eqSummary = equipments.map(eq =>
      `${eq.tag} (${eq.name}): status=${eq.status}, score=${eq.operational_score}, exposições químicas=${eq.chemical_exposure_count || 0}, última inspeção=${eq.last_inspection_date || 'nunca'}`
    ).join('\n');

    const inspSummary = inspections.slice(0, 10).map(i =>
      `Inspeção ${i.type} em ${i.date}: resultado=${i.result}, químico=${i.chemical_exposure ? i.chemical_products : 'não'}`
    ).join('\n');

    return `
COLABORADOR: ${employee.name}
FUNÇÃO: ${employee.role || 'não definida'}
NR35: ${employee.nr35_level || 'não certificado'}
IRATA: ${employee.irata_level ? `Nível ${employee.irata_level}` : 'não certificado'}
SCORE OPERACIONAL: ${employee.operational_score ?? 100}

CERTIFICAÇÕES:
${certSummary || 'Nenhuma certificação cadastrada'}

EQUIPAMENTOS (${equipments.length}):
${eqSummary || 'Nenhum equipamento cadastrado'}

ÚLTIMAS INSPEÇÕES:
${inspSummary || 'Nenhuma inspeção registrada'}

ALERTAS GERADOS: ${insights.length} alerta(s)
    `.trim();
  };

  const sendMessage = async (promptOverride = null) => {
    const text = promptOverride || question.trim();
    if (!text) return;
    setLoading(true);
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    try {
      const context = buildContext();
      const result = await base44.integrations.Core.InvokeLLM({
        model: 'claude_sonnet_4_6',
        prompt: `Você é o ALTIVUS AI — Especialista em Inspeção de Equipamentos de Acesso por Cordas.

Base técnica: NR35, IRATA, boas práticas internacionais, equipamentos Safetec.

REGRAS OBRIGATÓRIAS:
1. NUNCA use termos como "Equipamento condenado", "Descarte obrigatório" ou "Retire imediatamente" sem validação humana
2. SEMPRE recomende avaliação do Supervisor N3 para situações críticas
3. Use linguagem técnica e objetiva: "Recomenda-se avaliação do Supervisor N3", "Monitorar condição em próximas inspeções"
4. Alerte sem alarmar. Oriente sem decidir.
5. Responda em português brasileiro, de forma clara e estruturada
6. Quando sugerir ações, classifique por prioridade: IMEDIATA, CURTO PRAZO, PREVENTIVA

DADOS DO COLABORADOR:
${context}

PERGUNTA: ${text}`,
      });
      const aiMsg = { role: 'assistant', content: typeof result === 'string' ? result : JSON.stringify(result) };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erro ao consultar IA: ${e.message}` }]);
    }
    setLoading(false);
  };

  const INSIGHT_CFG = {
    danger: { color: '#FC5252', bg: 'rgba(252,82,82,0.08)', border: 'rgba(252,82,82,0.25)', icon: AlertTriangle },
    warning: { color: '#E87D00', bg: 'rgba(232,125,0,0.08)', border: 'rgba(232,125,0,0.25)', icon: Clock },
    info: { color: '#14B8D4', bg: 'rgba(20,184,212,0.08)', border: 'rgba(20,184,212,0.25)', icon: CheckCircle2 },
  };

  return (
    <div className="space-y-4">
      {/* Header IA */}
      <div className="rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg, rgba(109,86,232,0.08), rgba(20,184,212,0.04))', border: '1px solid rgba(109,86,232,0.2)' }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(109,86,232,0.3), rgba(20,184,212,0.2))', border: '1px solid rgba(109,86,232,0.4)' }}>
            <Brain className="w-5 h-5" style={{ color: '#6D56E8' }} />
          </div>
          <div>
            <p className="text-sm font-black text-white">ALTIVUS AI — Safety Specialist</p>
            <p className="text-[10px]" style={{ color: '#A0AEC0' }}>Especialista em NR35, IRATA e Equipamentos de Acesso por Cordas</p>
          </div>
        </div>
        <div className="rounded-xl p-2.5"
          style={{ background: 'rgba(109,86,232,0.06)', border: '1px solid rgba(109,86,232,0.12)' }}>
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#6D56E8' }} />
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <strong style={{ color: '#6D56E8' }}>Aviso Legal:</strong> A IA auxilia tecnicamente e não substitui inspeção formal, fabricante, Supervisor N3 ou responsável técnico. Somente profissionais habilitados podem reprovar, condenar ou bloquear equipamentos.
            </p>
          </div>
        </div>
      </div>

      {/* Insights automáticos */}
      {insights.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(6,10,22,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <button className="w-full flex items-center justify-between p-4"
            onClick={() => setShowInsights(!showInsights)}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: '#E87D00' }} />
              <span className="text-sm font-bold text-white">Safety Insights Automáticos</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(252,82,82,0.12)', color: '#FC5252' }}>{insights.length}</span>
            </div>
            {showInsights ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>
          {showInsights && (
            <div className="px-4 pb-4 space-y-2">
              {insights.map((ins, i) => {
                const cfg = INSIGHT_CFG[ins.type] || INSIGHT_CFG.info;
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: cfg.color }} />
                    <div className="flex-1">
                      <p className="text-xs text-white/80">{ins.msg}</p>
                      <p className="text-[10px] mt-0.5 font-semibold" style={{ color: cfg.color }}>→ {ins.action}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Perguntas rápidas */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#718096' }}>Perguntas Rápidas</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map(q => (
            <button key={q.label} onClick={() => sendMessage(q.prompt)} disabled={loading}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
              style={{ background: 'rgba(109,86,232,0.10)', border: '1px solid rgba(109,86,232,0.25)', color: '#6D56E8' }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto rounded-2xl p-4"
          style={{ background: 'rgba(6,10,22,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3`}
                style={msg.role === 'user'
                  ? { background: 'rgba(109,86,232,0.15)', border: '1px solid rgba(109,86,232,0.25)', color: '#FFFFFF' }
                  : { background: 'rgba(20,184,212,0.05)', border: '1px solid rgba(20,184,212,0.15)', color: '#E2E8F0' }
                }>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown className="text-xs prose prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-xs">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl flex items-center gap-2"
                style={{ background: 'rgba(20,184,212,0.05)', border: '1px solid rgba(20,184,212,0.15)' }}>
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#14B8D4' }} />
                <span className="text-xs" style={{ color: '#14B8D4' }}>Analisando dados...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="Pergunte sobre inspeções, equipamentos, NR35, IRATA..."
          disabled={loading}
          className="flex-1"
        />
        <Button onClick={() => sendMessage()} disabled={loading || !question.trim()} className="gap-1.5 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      <p className="text-[10px] text-center" style={{ color: '#4A5568' }}>
        Este modelo usa créditos de IA avançada (Claude Sonnet) para respostas técnicas especializadas.
      </p>
    </div>
  );
}
