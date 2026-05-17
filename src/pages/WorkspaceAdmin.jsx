/**
 * WorkspaceAdmin — Gestão de Membros e Convites do Workspace
 * ────────────────────────────────────────────────────────────
 * Nova arquitetura multi-tenant:
 *  - Lista WorkspaceMember (não todos os users da plataforma)
 *  - Convite com token único → link /join/:token
 *  - Roles: workspace_admin | supervisor | operacional | visualizador
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useWorkspace } from '@/lib/useWorkspace';
import { usePermissions } from '@/lib/usePermissions';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, Mail, CheckCircle2, Clock, XCircle, Lock,
  Send, UserPlus, Loader2, Shield, Eye, Wrench, Crown,
  UserX, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Configurações de roles ────────────────────────────────────────────────
const ROLE_OPTS = [
  { v: 'workspace_admin', l: 'Admin do Workspace', d: 'Gerencia tudo no workspace', icon: Crown,   c: '#14B8D4' },
  { v: 'supervisor',      l: 'Supervisor',          d: 'Atividades, aprovações, relatórios',  icon: Shield,  c: '#6D56E8' },
  { v: 'operacional',     l: 'Operacional',         d: 'Apontamentos, fotos, check-in',        icon: Wrench,  c: '#E87D00' },
  { v: 'visualizador',    l: 'Visualizador',        d: 'Somente leitura',                      icon: Eye,     c: '#718096' },
];

const ROLE_CFG = Object.fromEntries(ROLE_OPTS.map(r => [r.v, { l: r.l, c: r.c, icon: r.icon }]));

const INV_STATUS = {
  sent:      { l: 'Enviado',   c: '#14B8D4', icon: Send },
  accepted:  { l: 'Aceito',    c: '#00D99A', icon: CheckCircle2 },
  expired:   { l: 'Expirado',  c: '#718096', icon: Clock },
  cancelled: { l: 'Cancelado', c: '#DC3737', icon: XCircle },
};

function generateToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// ── RoleBadge ────────────────────────────────────────────────────────────
function RoleBadge({ role, small }) {
  const rc = ROLE_CFG[role] || ROLE_CFG.operacional;
  const Icon = rc.icon;
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-md ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}
      style={{ background: `${rc.c}14`, color: rc.c, border: `1px solid ${rc.c}30` }}>
      <Icon className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {rc.l}
    </span>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function WorkspaceAdmin() {
  const { user } = useAuth();
  const { workspaceId, currentWorkspace } = useWorkspace();
  const qc = useQueryClient();
  const { canManageWorkspace } = usePermissions();

  const [tab, setTab]             = useState('members');
  const [showInvite, setShowInvite] = useState(false);
  const [invSent, setInvSent]     = useState(false);
  const [invLink, setInvLink]     = useState('');
  const [invForm, setInvForm]     = useState({ name: '', email: '', role: 'operacional', role_title: '', message: '' });

  // Verifica permissão
  const canManage = canManageWorkspace;

  // ── Queries ────────────────────────────────────────────────────────────
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['workspaceMembers', workspaceId],
    queryFn:  () => base44.entities.WorkspaceMember.filter({ workspace_id: workspaceId }, '-joined_at', 100),
    enabled:  !!workspaceId,
  });

  const { data: invitations = [], isLoading: loadingInvs } = useQuery({
    queryKey: ['invitations', workspaceId],
    queryFn:  () => base44.entities.Invitation.filter({ workspace_id: workspaceId }, '-sent_at', 100),
    enabled:  !!workspaceId,
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const inviteMut = useMutation({
    mutationFn: async () => {
      if (!invForm.email?.trim()) throw new Error('E-mail obrigatório');

      const token     = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Cria registro do convite com token
      const inv = await base44.entities.Invitation.create({
        workspace_id: workspaceId,
        email:        invForm.email.trim(),
        name:         invForm.name.trim(),
        role:         invForm.role,
        role_title:   invForm.role_title.trim(),
        message:      invForm.message.trim(),
        token,
        status:       'sent',
        sent_at:      new Date().toISOString(),
        expires_at:   expiresAt.toISOString(),
        invited_by:   user?.email || '',
      });

      const joinLink = `${window.location.origin}/join/${token}`;

      // Envia e-mail com link de aceite
      const roleLabel  = ROLE_CFG[invForm.role]?.l || invForm.role;
      const company    = currentWorkspace?.company_name || 'ALTIVUS';
      const greeting   = invForm.name?.trim() ? `Olá, ${invForm.name.trim()}!` : 'Olá!';

      await base44.integrations.Core.SendEmail({
        to:      invForm.email.trim(),
        subject: `Convite para ${company} — ALTIVUS`,
        body: `
<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #050914; color: #fff; border-radius: 16px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #14B8D4, #6D56E8); padding: 32px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">ALTIVUS</h1>
    <p style="margin: 8px 0 0; opacity: 0.85; font-size: 14px;">Plataforma de Gestão Operacional</p>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 16px; margin-bottom: 8px;">${greeting}</p>
    <p style="color: #A0AEC0; margin-bottom: 24px;">
      <strong style="color: #fff;">${user?.full_name || user?.email || 'Um administrador'}</strong> 
      convidou você para acessar o workspace <strong style="color: #14B8D4;">${company}</strong>.
    </p>
    <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1px;">Seus acessos</p>
      <p style="margin: 4px 0; font-size: 14px;"><strong>Função:</strong> ${roleLabel}</p>
      ${invForm.role_title ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Cargo:</strong> ${invForm.role_title}</p>` : ''}
    </div>
    ${invForm.message ? `<div style="background: rgba(109,86,232,0.1); border-left: 3px solid #6D56E8; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-style: italic; color: #A0AEC0;">"${invForm.message}"</div>` : ''}
    <a href="${joinLink}" 
       style="display: block; text-align: center; background: linear-gradient(135deg, #14B8D4, #6D56E8); color: #fff; font-weight: 700; font-size: 15px; padding: 14px 24px; border-radius: 12px; text-decoration: none; margin-bottom: 16px;">
      ✓ Aceitar Convite
    </a>
    <p style="font-size: 11px; color: #4A5568; text-align: center;">
      Ou copie este link: <code style="color: #718096;">${joinLink}</code>
    </p>
    <p style="font-size: 11px; color: #4A5568; text-align: center; margin-top: 16px;">
      Este convite expira em ${expiresAt.toLocaleDateString('pt-BR')}.
    </p>
  </div>
</div>
        `.trim(),
      });

      return { inv, joinLink };
    },
    onSuccess: ({ joinLink }) => {
      qc.invalidateQueries({ queryKey: ['invitations', workspaceId] });
      setInvLink(joinLink);
      setInvSent(true);
      setInvForm({ name: '', email: '', role: 'operacional', role_title: '', message: '' });
    },
    onError: (err) => {
      toast.error(err?.message || 'Erro ao enviar convite.');
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: ({ id, role }) => base44.entities.WorkspaceMember.update(id, { role }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['workspaceMembers', workspaceId] }); toast.success('Função atualizada'); },
  });

  const removeMember = useMutation({
    mutationFn: (id) => base44.entities.WorkspaceMember.update(id, { status: 'inactive' }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['workspaceMembers', workspaceId] }); toast.success('Membro removido'); },
  });

  const cancelInv = useMutation({
    mutationFn: (id) => base44.entities.Invitation.update(id, { status: 'cancelled' }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['invitations', workspaceId] }),
  });

  const resendInv = useMutation({
    mutationFn: async (inv) => {
      const roleLabel = ROLE_CFG[inv.role]?.l || inv.role;
      const company   = currentWorkspace?.company_name || 'ALTIVUS';
      const joinLink  = `${window.location.origin}/join/${inv.token}`;
      await base44.integrations.Core.SendEmail({
        to:      inv.email,
        subject: `Convite para ${company} — ALTIVUS`,
        body:    `Seu link de acesso: <a href="${joinLink}">${joinLink}</a><br>Função: ${roleLabel}. Expira em: ${inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('pt-BR') : '—'}`,
      });
      return true;
    },
    onSuccess: () => toast.success('Convite reenviado!'),
    onError:   () => toast.error('Erro ao reenviar'),
  });

  if (!canManage) return (
    <div className="flex items-center justify-center h-64 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}>
      <div className="text-center">
        <Lock className="w-10 h-10 mx-auto mb-3" style={{ color: '#4A5568' }} />
        <p className="text-white/50 text-sm">Acesso restrito ao admin do workspace.</p>
      </div>
    </div>
  );

  const activeMembers   = members.filter(m => m.status === 'active');
  const pendingInvites  = invitations.filter(i => i.status === 'sent');

  return (
    <div>
      <PageHeader title="Membros do Workspace" subtitle={`Gestão de Acesso — ${currentWorkspace?.company_name || ''}`}>
        <Button size="sm" onClick={() => { setShowInvite(true); setInvSent(false); setInvLink(''); }} className="gap-1.5">
          <UserPlus className="w-4 h-4" /> Convidar Membro
        </Button>
      </PageHeader>

      {/* Workspace banner */}
      {currentWorkspace && (
        <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(20,184,212,0.06)', border: '1px solid rgba(20,184,212,0.18)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-white font-bold">{currentWorkspace.company_name}</p>
              <p className="text-xs" style={{ color: '#718096' }}>
                {activeMembers.length} membro(s) ativo(s) · {pendingInvites.length} convite(s) pendente(s)
              </p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-xl font-semibold"
              style={{ background: 'rgba(0,217,154,0.10)', border: '1px solid rgba(0,217,154,0.25)', color: '#00D99A' }}>
              {currentWorkspace.account_status === 'trial' ? '🔬 Período de Teste' : currentWorkspace.account_status}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { id: 'members',     l: `👥 Membros (${activeMembers.length})` },
          { id: 'invitations', l: `✉️ Convites (${pendingInvites.length})` },
          { id: 'permissions', l: '🔐 Permissões' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={tab === t.id
              ? { background: 'rgba(20,184,212,0.15)', border: '1px solid rgba(20,184,212,0.35)', color: '#14B8D4' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#718096' }
            }>{t.l}</button>
        ))}
      </div>

      {/* ── TAB: MEMBROS ── */}
      {tab === 'members' && (
        <div className="space-y-2">
          {loadingMembers ? (
            <div className="py-8 text-center" style={{ color: '#4A5568' }}>
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: '#14B8D4' }} />
              <p className="text-sm">Carregando membros...</p>
            </div>
          ) : activeMembers.length === 0 ? (
            <div className="py-12 text-center rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}>
              <Users className="w-10 h-10 mx-auto mb-3" style={{ color: '#4A5568' }} />
              <p className="text-white/50 text-sm">Nenhum membro ainda</p>
              <p className="text-xs mt-1" style={{ color: '#4A5568' }}>Convide pessoas para o workspace</p>
            </div>
          ) : (
            activeMembers.map(m => {
              const isMe = m.user_email === user?.email;
              return (
                <div key={m.id} className="flex items-center justify-between rounded-2xl p-4 gap-3 flex-wrap"
                  style={{ background: 'linear-gradient(145deg,rgba(12,18,36,0.90),rgba(6,10,22,0.96))', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                      style={{ background: `${ROLE_CFG[m.role]?.c || '#718096'}18`, border: `1px solid ${ROLE_CFG[m.role]?.c || '#718096'}35`, color: ROLE_CFG[m.role]?.c || '#718096' }}>
                      {(m.user_name || m.user_email || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{m.user_name || m.user_email}</p>
                        {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(20,184,212,0.12)', color: '#14B8D4' }}>você</span>}
                      </div>
                      <p className="text-xs" style={{ color: '#718096' }}>
                        {m.user_email}
                        {m.last_seen_at && ` · Visto ${format(new Date(m.last_seen_at), "dd/MM 'às' HH:mm", { locale: ptBR })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RoleBadge role={m.role} small />
                    {!isMe && (
                      <>
                        <select className="h-7 rounded-lg px-2 text-[11px]"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#A0AEC0' }}
                          value={m.role}
                          onChange={e => updateMemberRole.mutate({ id: m.id, role: e.target.value })}>
                          {ROLE_OPTS.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                        </select>
                        <button onClick={() => { if (confirm(`Remover ${m.user_name || m.user_email} do workspace?`)) removeMember.mutate(m.id); }}
                          className="p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                          style={{ color: '#FC5252' }} title="Remover acesso">
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB: CONVITES ── */}
      {tab === 'invitations' && (
        <div className="space-y-2">
          {loadingInvs ? (
            <div className="py-8 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin" style={{ color: '#14B8D4' }} /></div>
          ) : invitations.length === 0 ? (
            <div className="py-12 text-center rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}>
              <Mail className="w-10 h-10 mx-auto mb-3" style={{ color: '#4A5568' }} />
              <p className="text-white/50 text-sm">Nenhum convite enviado</p>
            </div>
          ) : (
            invitations.map(inv => {
              const st   = INV_STATUS[inv.status] || INV_STATUS.sent;
              const Icon = st.icon;
              const joinLink = inv.token ? `${window.location.origin}/join/${inv.token}` : null;
              return (
                <div key={inv.id} className="rounded-2xl p-4"
                  style={{ background: 'linear-gradient(145deg,rgba(12,18,36,0.90),rgba(6,10,22,0.96))', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-white">{inv.name || inv.email}</span>
                        <RoleBadge role={inv.role} small />
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1"
                          style={{ background: `${st.c}14`, color: st.c }}>
                          <Icon className="w-3 h-3" />{st.l}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: '#718096' }}>
                        {inv.email}
                        {inv.sent_at && ` · Enviado ${format(new Date(inv.sent_at), 'dd/MM/yyyy HH:mm')}`}
                        {inv.expires_at && ` · Expira ${format(new Date(inv.expires_at), 'dd/MM/yyyy')}`}
                      </p>
                      {joinLink && inv.status === 'sent' && (
                        <div className="mt-2 flex items-center gap-2">
                          <code className="text-[10px] px-2 py-1 rounded"
                            style={{ background: 'rgba(255,255,255,0.05)', color: '#718096', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {joinLink}
                          </code>
                          <button onClick={() => { navigator.clipboard.writeText(joinLink); toast.success('Link copiado!'); }}
                            className="text-[10px] px-2 py-1 rounded transition-all"
                            style={{ background: 'rgba(20,184,212,0.10)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.25)' }}>
                            Copiar
                          </button>
                        </div>
                      )}
                    </div>
                    {inv.status === 'sent' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => resendInv.mutate(inv)}
                          disabled={resendInv.isPending}
                          className="gap-1 h-7 text-xs">
                          <RefreshCw className="w-3 h-3" /> Reenviar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => cancelInv.mutate(inv.id)}
                          className="text-red-400 hover:text-red-300 gap-1 h-7 text-xs">
                          <XCircle className="w-3 h-3" /> Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TAB: PERMISSÕES ── */}
      {tab === 'permissions' && (
        <div className="space-y-3">
          {ROLE_OPTS.map(r => {
            const perms = {
              workspace_admin: ['Tudo', 'Convidar membros', 'Remover acesso', 'Baixar PDFs', 'Aprovar apontamentos', 'Editar cadastros', 'Gerenciar workspace'],
              supervisor:      ['Criar atividades', 'Aprovar apontamentos', 'Gerar relatórios', 'Ver produtividade', 'Baixar PDFs', 'Ver equipes'],
              operacional:     ['Apontamentos', 'Upload de fotos', 'Preencher reporte', 'Assinar digitalmente', 'Check-in/out'],
              visualizador:    ['Visualizar relatórios', 'Ver atividades', 'Ver produtividade', 'Ver histórico'],
            };
            return (
              <div key={r.v} className="rounded-2xl p-4"
                style={{ background: 'linear-gradient(145deg,rgba(12,18,36,0.90),rgba(6,10,22,0.96))', border: `1px solid ${r.c}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <RoleBadge role={r.v} />
                </div>
                <p className="text-sm mb-2" style={{ color: '#A0AEC0' }}>{r.d}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(perms[r.v] || []).map(p => (
                    <span key={p} className="text-[10px] px-2 py-0.5 rounded"
                      style={{ background: `${r.c}10`, color: r.c }}>{p}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: CONVIDAR MEMBRO ── */}
      {showInvite && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.98),rgba(6,10,22,0.99))', border: '1px solid rgba(20,184,212,0.22)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" style={{ color: '#14B8D4' }} />
                <h3 className="text-white font-bold">Convidar Membro</h3>
              </div>
              <button onClick={() => { if (!inviteMut.isPending) { setShowInvite(false); setInvSent(false); } }}
                className="text-[#718096] hover:text-white text-xl leading-none">×</button>
            </div>

            {invSent ? (
              /* Sucesso */
              <div className="text-center py-6">
                <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: '#00D99A' }} />
                <p className="text-white font-bold text-lg">Convite enviado!</p>
                <p className="text-sm mt-2 mb-4" style={{ color: '#718096' }}>
                  Um e-mail com o link de aceite foi enviado.
                </p>
                {invLink && (
                  <div className="p-3 rounded-xl mb-4"
                    style={{ background: 'rgba(20,184,212,0.06)', border: '1px solid rgba(20,184,212,0.18)' }}>
                    <p className="text-[11px] mb-2" style={{ color: '#718096' }}>Link de aceite (compartilhe se necessário):</p>
                    <code className="text-xs break-all" style={{ color: '#14B8D4' }}>{invLink}</code>
                    <button onClick={() => { navigator.clipboard.writeText(invLink); toast.success('Copiado!'); }}
                      className="mt-2 block w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgba(20,184,212,0.15)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.3)' }}>
                      Copiar Link
                    </button>
                  </div>
                )}
                <Button className="w-full" onClick={() => { setShowInvite(false); setInvSent(false); }}>
                  Fechar
                </Button>
              </div>
            ) : (
              /* Formulário */
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Nome</label>
                  <Input placeholder="Nome do colaborador" value={invForm.name}
                    onChange={e => setInvForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>E-mail *</label>
                  <Input type="email" placeholder="colaborador@empresa.com" value={invForm.email}
                    onChange={e => setInvForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Cargo / Função</label>
                  <Input placeholder="Ex: Supervisor de Campo" value={invForm.role_title}
                    onChange={e => setInvForm(f => ({ ...f, role_title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Nível de Acesso</label>
                  <div className="space-y-1.5">
                    {ROLE_OPTS.map(r => {
                      const Icon = r.icon;
                      return (
                        <label key={r.v} onClick={() => setInvForm(f => ({ ...f, role: r.v }))}
                          className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl transition-all"
                          style={{
                            background: invForm.role === r.v ? `${r.c}08` : 'transparent',
                            border: `1px solid ${invForm.role === r.v ? r.c + '30' : 'rgba(255,255,255,0.07)'}`,
                          }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: invForm.role === r.v ? `${r.c}22` : 'rgba(255,255,255,0.05)', border: `2px solid ${invForm.role === r.v ? r.c : 'rgba(255,255,255,0.15)'}` }}>
                            {invForm.role === r.v && <div className="w-2 h-2 rounded-full" style={{ background: r.c }} />}
                          </div>
                          <Icon className="w-4 h-4 shrink-0" style={{ color: invForm.role === r.v ? r.c : '#4A5568' }} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: invForm.role === r.v ? r.c : '#A0AEC0' }}>{r.l}</p>
                            <p className="text-[10px]" style={{ color: '#4A5568' }}>{r.d}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Mensagem (opcional)</label>
                  <textarea className="w-full rounded-xl px-3 py-2 text-sm resize-none" rows={2}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
                    placeholder="Mensagem personalizada..."
                    value={invForm.message} onChange={e => setInvForm(f => ({ ...f, message: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" onClick={() => { if (!inviteMut.isPending) setShowInvite(false); }} className="flex-1" disabled={inviteMut.isPending}>
                    Cancelar
                  </Button>
                  <Button className="flex-1 gap-1.5" onClick={() => inviteMut.mutate()}
                    disabled={!invForm.email?.trim() || inviteMut.isPending}
                    style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', color: '#fff', fontWeight: 700 }}>
                    {inviteMut.isPending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                      : <><Send className="w-4 h-4" /> Enviar Convite</>
                    }
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
