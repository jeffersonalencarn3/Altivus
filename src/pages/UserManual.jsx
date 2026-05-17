import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, LayoutDashboard, CalendarDays, FileText, Users, Activity, BarChart2, Eye, BookOpenCheck, Package, Bot, Settings, UserPlus, Building2, Shield, CheckCircle2, Play, Zap, MapPin, Camera, ClipboardCheck, TrendingUp, AlertTriangle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ── Slides da apresentação ─────────────────────────────── */
const slides = [
  // 0 — Capa
  {
    type: 'cover',
    title: 'ALTIVUS',
    subtitle: 'Plataforma de Gestão de Operações em Altura',
    tagline: 'Guia Completo da Plataforma',
    version: 'v2.0 — 2026',
    gradient: 'from-[#050914] via-[#0a1628] to-[#050914]',
    accent: '#14B8D4',
  },

  // 1 — Visão Geral
  {
    type: 'overview',
    badge: 'Visão Geral',
    title: 'Tudo que você precisa para gerenciar sua operação',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard Executivo', color: '#14B8D4' },
      { icon: CalendarDays, label: 'Cronograma Gantt', color: '#6D56E8' },
      { icon: BookOpenCheck, label: 'Diário de Campo', color: '#00D99A' },
      { icon: Activity, label: 'Atividades & Check-in/out', color: '#E87D00' },
      { icon: Users, label: 'Equipes & Colaboradores', color: '#14B8D4' },
      { icon: Package, label: 'Materiais & Estoque', color: '#6D56E8' },
      { icon: Bot, label: 'Agente IA', color: '#00D99A' },
      { icon: BarChart2, label: 'Produtividade & Analytics', color: '#E87D00' },
    ],
  },

  // 2 — Dashboard
  {
    type: 'feature',
    badge: 'Módulo 1',
    icon: LayoutDashboard,
    iconColor: '#14B8D4',
    title: 'Dashboard',
    subtitle: 'Visão executiva da operação em tempo real',
    bullets: [
      { icon: TrendingUp, text: 'KPIs em tempo real: progresso global, atividades em andamento, taxa de atraso e horas trabalhadas vs. previstas' },
      { icon: BarChart2, text: 'Gráficos de produtividade por equipe, distribuição de status e progresso por área' },
      { icon: AlertTriangle, text: 'Painel de alertas: atividades atrasadas, vencimentos próximos e anomalias operacionais' },
      { icon: Settings, text: 'Filtros globais por período, equipe, contrato e área — segmentam todos os dados simultaneamente' },
    ],
    tip: 'Use os filtros globais para comparar desempenho entre contratos ou períodos específicos.',
    color: '#14B8D4',
  },

  // 3 — Cronograma
  {
    type: 'feature',
    badge: 'Módulo 2',
    icon: CalendarDays,
    iconColor: '#6D56E8',
    title: 'Cronograma',
    subtitle: 'Planejamento visual em formato Gantt',
    bullets: [
      { icon: CalendarDays, text: 'Visualizações alternáveis: Semana, Mês e Timeline — ajuste a escala conforme a necessidade' },
      { icon: Activity, text: 'Barras coloridas por status: cinza = não iniciado, azul = andamento, vermelho = atrasado, verde = concluído' },
      { icon: CheckCircle2, text: 'Crie e edite atividades diretamente no Gantt clicando no ícone de lápis sobre cada linha' },
      { icon: Settings, text: 'Filtro por status e calculadora de planejamento integrada (descidas × tempo por descida)' },
    ],
    tip: 'O Gantt atualiza automaticamente quando sessões de check-in/out são registradas.',
    color: '#6D56E8',
  },

  // 4 — Atividades
  {
    type: 'feature',
    badge: 'Módulo 3',
    icon: Activity,
    iconColor: '#E87D00',
    title: 'Atividades',
    subtitle: 'Gestão completa do ciclo operacional',
    bullets: [
      { icon: Play, text: 'Check-in: inicie a sessão do dia com checklist NR-35, mapa visual e geolocalização' },
      { icon: Camera, text: 'Check-out: registre área executada, status de conclusão (100%/parcial/não executado), fotos e materiais usados' },
      { icon: MapPin, text: 'Mapa visual: desenhe e anote a área planejada no check-in e a área executada no check-out' },
      { icon: TrendingUp, text: 'Progresso calculado automaticamente conforme descidas realizadas vs. planejadas' },
    ],
    tip: 'O status de execução no check-out (parcial ou não executado) exige justificativa obrigatória.',
    color: '#E87D00',
  },

  // 5 — Field Log
  {
    type: 'feature',
    badge: 'Módulo 4',
    icon: BookOpenCheck,
    iconColor: '#00D99A',
    title: 'Diário de Campo',
    subtitle: 'Apontamento diário completo com 4 etapas',
    steps: [
      { num: '1', title: 'Início da Jornada', desc: 'Contrato, equipe, horário e checklist NR-35 obrigatório' },
      { num: '2', title: 'Atividades', desc: 'Sub-atividades, percentual, fotos e equipamentos utilizados' },
      { num: '3', title: 'Relatório', desc: 'O que foi feito, impedimentos, clima e observações técnicas' },
      { num: '4', title: 'Encerramento', desc: 'Descidas, consumíveis, assinatura e fechamento do dia' },
    ],
    extras: [
      'Aprovação por supervisores com trail de auditoria completo',
      'Baixa automática de estoque ao aprovar o diário',
      'Alertas de estoque crítico integrados',
    ],
    color: '#00D99A',
  },

  // 6 — Equipes
  {
    type: 'feature',
    badge: 'Módulo 5',
    icon: Users,
    iconColor: '#14B8D4',
    title: 'Equipes & Colaboradores',
    subtitle: 'Gestão completa de pessoas e recursos humanos',
    bullets: [
      { icon: Users, text: 'Cadastre equipes com nome, líder, especialidade, cor identificadora e status (ativa/inativa)' },
      { icon: Star, text: 'Perfil completo do colaborador: CPF, RG, nascimento, tipo sanguíneo, contato de emergência' },
      { icon: ClipboardCheck, text: 'Certificações rastreadas: NR-35, IRATA, ANEAC, resgate, primeiros auxilios e mais — com validade e alerta de vencimento' },
      { icon: TrendingUp, text: 'Score operacional (0-100), total de descidas e horas históricas por colaborador' },
    ],
    tip: 'Acesse o perfil individual de cada colaborador para ver histórico de inspeções, equipamentos e checklists.',
    color: '#14B8D4',
  },

  // 7 — Materiais
  {
    type: 'feature',
    badge: 'Módulo 6',
    icon: Package,
    iconColor: '#6D56E8',
    title: 'Materiais & Estoque',
    subtitle: 'Controle de EPIs, ferramentas e consumíveis',
    bullets: [
      { icon: Package, text: 'Três categorias: EPI (equipamentos de proteção), Ferramenta e Consumível' },
      { icon: AlertTriangle, text: 'Alertas automáticos de estoque crítico quando abaixo do threshold mínimo configurado' },
      { icon: CheckCircle2, text: 'Baixa automática de consumíveis ao aprovar diários de campo' },
      { icon: BarChart2, text: 'Gráficos de consumo por tipo, histórico de movimentações e projeções de reposição' },
    ],
    tip: 'Configure o limite mínimo de estoque para receber alertas antes de chegar ao zero.',
    color: '#6D56E8',
  },

  // 8 — Produtividade
  {
    type: 'feature',
    badge: 'Módulo 7',
    icon: BarChart2,
    iconColor: '#E87D00',
    title: 'Produtividade & Analytics',
    subtitle: 'Análise de desempenho e eficiência operacional',
    bullets: [
      { icon: TrendingUp, text: 'KPIs globais: horas trabalhadas, descidas totais, eficiência média e tempo por descida' },
      { icon: Star, text: 'Ranking de equipes por eficiência — badge "Alta Performance" para equipes ≥ 80%' },
      { icon: BarChart2, text: 'Gráficos comparativos: descidas realizadas vs. planejadas por equipe e por período' },
      { icon: Eye, text: 'Visão Diretoria: KPIs executivos, alertas de risco e tendência mensal em gráfico de linha' },
    ],
    tip: 'A Visão Diretoria mostra projeção de conclusão com base no ritmo atual da operação.',
    color: '#E87D00',
  },

  // 9 — Agente IA
  {
    type: 'feature',
    badge: 'Módulo 8',
    icon: Bot,
    iconColor: '#00D99A',
    title: 'Agente IA',
    subtitle: 'Assistente inteligente para consultas operacionais',
    bullets: [
      { icon: Bot, text: 'Converse em linguagem natural sobre atividades, contratos, equipes e produtividade' },
      { icon: Zap, text: 'Respostas instantâneas com acesso direto ao banco de dados da operação' },
      { icon: CheckCircle2, text: 'Histórico de conversas salvo — retome análises anteriores quando precisar' },
      { icon: Star, text: 'Exemplos: "Quais atividades estão atrasadas?" ou "Qual a produtividade da Equipe A?"' },
    ],
    tip: 'O Agente IA pode identificar padrões e sugerir ações preventivas com base nos dados históricos.',
    color: '#00D99A',
  },

  // 10 — Contratos e Cadastros
  {
    type: 'split',
    badge: 'Módulo 9',
    title: 'Contratos & Cadastros',
    left: {
      icon: FileText,
      color: '#E87D00',
      title: 'Contratos',
      items: [
        'Cadastre com empresa, valor, SLA e datas',
        'Status: ativo, concluído, suspenso, cancelado',
        'Vinculado automaticamente a atividades e diários',
      ],
    },
    right: {
      icon: Settings,
      color: '#6D56E8',
      title: 'Cadastros Base',
      items: [
        'Unidades (obras) vinculadas a contratos',
        'Áreas com nível de risco e descidas previstas',
        'Tipos de serviço com tempo médio por descida',
      ],
    },
  },

  // 11 — Admin
  {
    type: 'feature',
    badge: 'Módulo 10',
    icon: UserPlus,
    iconColor: '#14B8D4',
    title: 'Admin do Workspace',
    subtitle: 'Gestão de usuários e permissões',
    bullets: [
      { icon: UserPlus, text: 'Convide colaboradores por e-mail com prazo de 7 dias — convite enviado automaticamente' },
      { icon: Shield, text: '4 perfis: Administrador · Supervisor · Operacional · Viewer' },
      { icon: CheckCircle2, text: 'Altere o perfil de qualquer usuário diretamente na lista de membros' },
      { icon: Building2, text: 'Acompanhe o status da conta (trial/ativo), data de expiração e alertas de vencimento' },
    ],
    tip: 'Apenas Administradores podem convidar novos usuários e alterar perfis de outros membros.',
    color: '#14B8D4',
  },

  // 12 — Final
  {
    type: 'final',
    title: 'Pronto para operar!',
    subtitle: 'Você conhece todas as funcionalidades da plataforma ALTIVUS.',
    items: [
      'Dúvidas? Fale com o suporte ALTIVUS',
      'Atualizações são automáticas — sem reinstalação',
      'Seus dados são sincronizados em tempo real',
    ],
    gradient: 'from-[#050914] via-[#0a1628] to-[#050914]',
    accent: '#14B8D4',
  },
];

/* ── Componentes de slide ────────────────────────────────── */

function SlideCover({ slide }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16 relative overflow-hidden">
      {/* BG rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full border border-white/5 absolute" />
        <div className="w-[450px] h-[450px] rounded-full border border-white/5 absolute" />
        <div className="w-[300px] h-[300px] rounded-full border border-[#14B8D4]/10 absolute" />
      </div>
      {/* Logo mark */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', boxShadow: '0 0 60px rgba(20,184,212,0.4)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-2"
          style={{ background: 'linear-gradient(135deg,#FFFFFF,#14B8D4,#6D56E8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {slide.title}
        </h1>
        <p className="text-lg text-white/60 font-light">{slide.subtitle}</p>
      </div>
      <div className="mt-6 px-5 py-2 rounded-full text-sm font-semibold"
        style={{ background: 'rgba(20,184,212,0.1)', border: '1px solid rgba(20,184,212,0.3)', color: '#14B8D4' }}>
        {slide.tagline}
      </div>
      <p className="text-xs text-white/20 mt-8">{slide.version}</p>
    </div>
  );
}

function SlideOverview({ slide }) {
  return (
    <div className="flex flex-col h-full px-8 py-10">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ background: 'rgba(20,184,212,0.1)', border: '1px solid rgba(20,184,212,0.3)', color: '#14B8D4' }}>
          {slide.badge}
        </span>
        <h2 className="text-2xl font-black text-white mt-3">{slide.title}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 content-center">
        {slide.items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex flex-col items-center gap-3 p-5 rounded-2xl text-center"
              style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${item.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <p className="text-xs font-semibold text-white/80 leading-tight">{item.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlideFeature({ slide }) {
  const Icon = slide.icon;
  return (
    <div className="flex flex-col h-full px-8 py-10">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${slide.iconColor}15`, border: `1px solid ${slide.iconColor}30` }}>
          <Icon className="w-6 h-6" style={{ color: slide.iconColor }} />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: `${slide.color}15`, color: slide.color }}>
            {slide.badge}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">{slide.title}</h2>
          <p className="text-sm text-white/50 mt-0.5">{slide.subtitle}</p>
        </div>
      </div>

      {/* Bullets */}
      {slide.bullets && (
        <div className="space-y-3 flex-1">
          {slide.bullets.map((b, i) => {
            const BIcon = b.icon;
            return (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${slide.color}15` }}>
                  <BIcon className="w-3.5 h-3.5" style={{ color: slide.color }} />
                </div>
                <p className="text-sm text-white/75 leading-relaxed">{b.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Steps (Field Log) */}
      {slide.steps && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {slide.steps.map((s, i) => (
            <div key={i} className="p-4 rounded-xl"
              style={{ background: `${slide.color}08`, border: `1px solid ${slide.color}20` }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: slide.color, color: '#020B14' }}>{s.num}</span>
                <p className="text-sm font-bold text-white">{s.title}</p>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      )}
      {slide.extras && (
        <div className="space-y-1.5 mb-4">
          {slide.extras.map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: slide.color }} />
              <p className="text-xs text-white/60">{e}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      {slide.tip && (
        <div className="mt-auto pt-4">
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl"
            style={{ background: `${slide.color}08`, border: `1px solid ${slide.color}20` }}>
            <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: slide.color }} />
            <p className="text-xs" style={{ color: slide.color }}>
              <span className="font-bold">Dica: </span>{slide.tip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SlideSplit({ slide }) {
  return (
    <div className="flex flex-col h-full px-8 py-10">
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ background: 'rgba(20,184,212,0.1)', border: '1px solid rgba(20,184,212,0.3)', color: '#14B8D4' }}>
          {slide.badge}
        </span>
        <h2 className="text-2xl font-black text-white mt-3">{slide.title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {[slide.left, slide.right].map((half, i) => {
          const HIcon = half.icon;
          return (
            <div key={i} className="rounded-2xl p-6"
              style={{ background: `${half.color}06`, border: `1px solid ${half.color}20` }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${half.color}15` }}>
                  <HIcon className="w-5 h-5" style={{ color: half.color }} />
                </div>
                <h3 className="font-bold text-white">{half.title}</h3>
              </div>
              <div className="space-y-3">
                {half.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: half.color }} />
                    <p className="text-sm text-white/65">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlideFinal({ slide }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full border border-white/5 absolute" />
        <div className="w-[350px] h-[350px] rounded-full border border-[#00D99A]/10 absolute" />
      </div>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
        style={{ background: 'linear-gradient(135deg,#00D99A,#14B8D4)', boxShadow: '0 0 40px rgba(0,217,154,0.3)' }}>
        <CheckCircle2 className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-4xl font-black text-white mb-3">{slide.title}</h2>
      <p className="text-white/50 mb-8 max-w-md">{slide.subtitle}</p>
      <div className="space-y-2 text-left max-w-xs w-full">
        {slide.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(0,217,154,0.06)', border: '1px solid rgba(0,217,154,0.15)' }}>
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#00D99A' }} />
            <p className="text-sm text-white/70">{item}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/20 mt-10">ALTIVUS · Plataforma de Gestão de Operações em Altura</p>
    </div>
  );
}

/* ── Gerador de PDF via print ────────────────────────────── */
function downloadAsPDF() {
  window.print();
}

/* ── Apresentação principal ─────────────────────────────── */
export default function UserManual() {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  const prev = () => setCurrent(i => Math.max(0, i - 1));
  const next = () => setCurrent(i => Math.min(total - 1, i + 1));

  const slide = slides[current];

  const renderSlide = () => {
    switch (slide.type) {
      case 'cover': return <SlideCover slide={slide} />;
      case 'overview': return <SlideOverview slide={slide} />;
      case 'feature': return <SlideFeature slide={slide} />;
      case 'split': return <SlideSplit slide={slide} />;
      case 'final': return <SlideFinal slide={slide} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-[600px]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-black text-sm tracking-tight text-white">ALTIVUS</span>
          <span className="text-white/30 text-sm">/</span>
          <span className="text-sm text-white/50">Manual da Plataforma</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30">{current + 1} / {total}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadAsPDF}
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Slide container */}
      <div
        className="relative flex-1 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(10,16,32,0.97) 0%, rgba(6,10,22,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.04)',
        }}
      >
        {/* Slide content */}
        <div className="h-full overflow-y-auto">
          {renderSlide()}
        </div>

        {/* Nav arrows */}
        <button
          onClick={prev}
          disabled={current === 0}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={next}
          disabled={current === total - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
          style={{ background: 'rgba(20,184,212,0.15)', border: '1px solid rgba(20,184,212,0.30)' }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: '#14B8D4' }} />
        </button>
      </div>

      {/* Dot navigation */}
      <div className="flex items-center justify-center gap-1.5 mt-4 flex-wrap px-2">
        {slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? '24px' : '7px',
              height: '7px',
              background: i === current ? '#14B8D4' : 'rgba(255,255,255,0.15)',
              boxShadow: i === current ? '0 0 8px rgba(20,184,212,0.5)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-white/15 mt-2">
        Use as setas ← → ou clique nos pontos para navegar
      </p>

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #root { display: block !important; }
          #root > * { display: none !important; }
          .print-slide { display: block !important; }
        }
      `}</style>
    </div>
  );
}
