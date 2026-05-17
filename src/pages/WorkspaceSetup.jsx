import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Building2, User, Phone, Mail, ChevronRight, AlertTriangle } from 'lucide-react';

const SEGMENTS = [
  { v: 'trabalho_altura', l: 'Trabalho em Altura' },
  { v: 'construcao_civil', l: 'Construção Civil' },
  { v: 'industria', l: 'Indústria' },
  { v: 'mineracao', l: 'Mineração' },
  { v: 'energia', l: 'Energia / Utilities' },
  { v: 'manutencao_industrial', l: 'Manutenção Industrial' },
  { v: 'outro', l: 'Outro' },
];

export default function WorkspaceSetup() {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    company_name: '', cnpj: '', segment: '', responsible_name: '',
    responsible_email: '', phone: '', role_title: '',
    estimated_workers: '', terms: false, privacy: false,
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const patch = u => setForm(f => ({ ...f, ...u }));

  const createMut = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const trialEnd = new Date(today);
      trialEnd.setDate(today.getDate() + 30);

      const ws = await base44.entities.Workspace.create({
        company_name: form.company_name,
        cnpj: form.cnpj,
        segment: form.segment,
        responsible_name: form.responsible_name,
        responsible_email: form.responsible_email,
        phone: form.phone,
        role_title: form.role_title,
        estimated_workers: Number(form.estimated_workers) || 0,
        account_status: 'trial',
        commercial_status: 'new_signup',
        trial_start: today.toISOString().split('T')[0],
        trial_end: trialEnd.toISOString().split('T')[0],
        adoption_score: 0,
      });

      // Salva workspace_id no perfil do usuário logado
      await base44.auth.updateMe({ workspace_id: ws.id });

      // Cria WorkspaceMember para o owner (workspace_admin)
      const me = await base44.auth.me();
      await base44.entities.WorkspaceMember.create({
        workspace_id: ws.id,
        user_id:      me.id,
        user_email:   me.email,
        user_name:    me.full_name || form.responsible_name,
        role:         'workspace_admin',
        status:       'active',
        joined_at:    new Date().toISOString(),
        invited_by:   'system',
      });

      // Salva workspace ativo no localStorage
      try { localStorage.setItem('altivus_active_workspace', ws.id); } catch {}

      // Send welcome email
      await base44.integrations.Core.SendEmail({
        to: form.responsible_email,
        subject: 'Seu workspace ALTIVUS foi criado ✅',
        body: `Olá, ${form.responsible_name}!\n\nSeu workspace na ALTIVUS foi criado com sucesso.\n\nEmpresa: ${form.company_name}\nStatus: Teste Ativo (30 dias)\nData: ${today.toLocaleDateString('pt-BR')}\n\nAcesse sua conta e configure:\n1. Colaboradores\n2. Equipes\n3. Contratos\n4. Atividades\n\nEquipe ALTIVUS`,
      });

      return ws;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workspaces'] }); setDone(true); },
    onError: e => setError(e.message),
  });

  const canSubmit = form.company_name && form.responsible_name && form.responsible_email && form.terms && form.privacy;

  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, rgba(5,9,20,0.98), rgba(8,14,30,0.99))' }}>
      <div className="max-w-md w-full text-center rounded-3xl p-10" style={{ background: 'rgba(10,18,36,0.95)', border: '1px solid rgba(0,217,154,0.30)', boxShadow: '0 0 60px rgba(0,217,154,0.10)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(0,217,154,0.15)', border: '2px solid rgba(0,217,154,0.45)', boxShadow: '0 0 30px rgba(0,217,154,0.20)' }}>
          <CheckCircle2 className="w-10 h-10" style={{ color: '#00D99A' }} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Workspace criado!</h2>
        <p className="text-sm mb-1" style={{ color: '#718096' }}>Empresa: <strong className="text-white">{form.company_name}</strong></p>
        <p className="text-sm mb-6" style={{ color: '#718096' }}>Período de teste: <strong style={{ color: '#00D99A' }}>30 dias</strong></p>
        <p className="text-xs mb-8" style={{ color: '#4A5568' }}>Enviamos as instruções de acesso para <strong className="text-white">{form.responsible_email}</strong></p>
        <Button className="w-full" onClick={() => window.location.href = '/'}>
          Acessar Plataforma →
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, rgba(5,9,20,0.98), rgba(8,14,30,0.99))' }}>
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(20,184,212,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,212,0.015) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <svg viewBox="0 0 40 36" fill="none" width="36" height="36">
              <path d="M20 2L38 34H2L20 2Z" stroke="#14B8D4" strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
              <path d="M20 10L32 32H8L20 10Z" stroke="#6D56E8" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.7"/>
              <line x1="11" y1="26" x2="29" y2="26" stroke="#14B8D4" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-2xl font-black tracking-widest text-white">ALTIVUS</span>
          </div>
          <p className="text-sm" style={{ color: '#14B8D4' }}>Criar Workspace de Gestão em Altura</p>
        </div>

        <div className="rounded-3xl p-7" style={{ background: 'rgba(10,18,36,0.95)', border: '1px solid rgba(20,184,212,0.18)', boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(20,184,212,0.06)' }}>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {['Empresa', 'Responsável', 'Confirmação'].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: step >= i ? 'rgba(20,184,212,0.20)' : 'rgba(255,255,255,0.05)', border: `1px solid ${step >= i ? 'rgba(20,184,212,0.50)' : 'rgba(255,255,255,0.10)'}`, color: step >= i ? '#14B8D4' : '#4A5568' }}>
                    {step > i ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-semibold hidden sm:inline" style={{ color: step >= i ? '#14B8D4' : '#4A5568' }}>{s}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px" style={{ background: step > i ? 'rgba(20,184,212,0.40)' : 'rgba(255,255,255,0.07)' }} />}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: 'rgba(220,55,55,0.10)', border: '1px solid rgba(220,55,55,0.30)', color: '#DC3737' }}>
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* Step 0: Company */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><Building2 className="w-5 h-5" style={{ color: '#14B8D4' }} /> Dados da Empresa</h3>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Nome da Empresa *</label>
                <Input placeholder="Empresa de Trabalho em Altura Ltda" value={form.company_name} onChange={e => patch({ company_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>CNPJ (opcional)</label>
                <Input placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => patch({ cnpj: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Segmento de Atuação</label>
                <select className="w-full h-9 rounded-xl px-3 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: form.segment ? '#fff' : '#718096' }}
                  value={form.segment} onChange={e => patch({ segment: e.target.value })}>
                  <option value="">Selecionar...</option>
                  {SEGMENTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Colaboradores estimados</label>
                <Input type="number" min={1} placeholder="Ex: 20" value={form.estimated_workers} onChange={e => patch({ estimated_workers: e.target.value })} />
              </div>
              <Button className="w-full gap-2" onClick={() => setStep(1)} disabled={!form.company_name}>
                Próximo <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Responsible */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><User className="w-5 h-5" style={{ color: '#14B8D4' }} /> Dados do Responsável</h3>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Nome Completo *</label>
                <Input placeholder="João Silva" value={form.responsible_name} onChange={e => patch({ responsible_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>E-mail Profissional *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#718096' }} />
                  <Input type="email" placeholder="joao@empresa.com.br" className="pl-9" value={form.responsible_email} onChange={e => patch({ responsible_email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Cargo / Função</label>
                <Input placeholder="Supervisor de Segurança, Gestor Operacional..." value={form.role_title} onChange={e => patch({ role_title: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#718096' }} />
                  <Input placeholder="(11) 99999-0000" className="pl-9" value={form.phone} onChange={e => patch({ phone: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">← Voltar</Button>
                <Button className="flex-1 gap-2" onClick={() => setStep(2)} disabled={!form.responsible_name || !form.responsible_email}>
                  Próximo <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-lg">✅ Confirmação</h3>
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(20,184,212,0.06)', border: '1px solid rgba(20,184,212,0.18)' }}>
                {[
                  { l: 'Empresa', v: form.company_name },
                  { l: 'Responsável', v: form.responsible_name },
                  { l: 'E-mail', v: form.responsible_email },
                  { l: 'Cargo', v: form.role_title },
                  { l: 'Segmento', v: SEGMENTS.find(s => s.v === form.segment)?.l || '—' },
                  { l: 'Período de teste', v: '30 dias gratuitos' },
                ].map(f => (
                  <div key={f.l} className="flex justify-between text-sm">
                    <span style={{ color: '#718096' }}>{f.l}</span>
                    <span className="font-semibold text-white text-right max-w-48 truncate">{f.v || '—'}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {[
                  { key: 'terms', label: 'Aceito os Termos de Uso da ALTIVUS' },
                  { key: 'privacy', label: 'Aceito a Política de Privacidade' },
                ].map(t => (
                  <label key={t.key} className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => patch({ [t.key]: !form[t.key] })}
                      className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ background: form[t.key] ? 'rgba(20,184,212,0.22)' : 'rgba(255,255,255,0.05)', border: `1px solid ${form[t.key] ? 'rgba(20,184,212,0.55)' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer' }}>
                      {form[t.key] && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#14B8D4' }} />}
                    </div>
                    <span className="text-xs" style={{ color: '#A0AEC0' }}>{t.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">← Voltar</Button>
                <Button className="flex-1 gap-2" onClick={() => createMut.mutate()} disabled={!canSubmit || createMut.isPending}
                  style={{ background: 'linear-gradient(135deg,#00D99A,#14B8D4)', color: '#020B0F', fontWeight: 700 }}>
                  {createMut.isPending ? 'Criando...' : '🚀 Criar Workspace'}
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: '#4A5568' }}>
          Já tem conta? <a href="/" className="text-[#14B8D4] hover:underline">Fazer login</a>
        </p>
      </div>
    </div>
  );
}