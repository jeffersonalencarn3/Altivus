/**
 * JoinWorkspace — /join/:token
 * ─────────────────────────────
 * Página de aceite de convite.
 * Fluxo:
 *  1. Valida o token buscando Invitation com status "sent"
 *  2. Se usuário já logado → cria WorkspaceMember direto
 *  3. Se não logado → redireciona ao login com ?next=/join/:token
 *  4. Após aceite → redireciona ao dashboard com workspace ativo
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROLE_LABELS = {
  workspace_admin: 'Admin do Workspace',
  supervisor:      'Supervisor',
  operacional:     'Operacional',
  visualizador:    'Visualizador',
};

export default function JoinWorkspace() {
  const { token } = useParams();

  const [phase, setPhase]       = useState('loading'); // loading | found | accepting | success | error | expired
  const [invitation, setInv]    = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser]         = useState(null);

  // ── 1. Busca convite pelo token ──────────────────────────────────────────
  useEffect(() => {
    if (!token) { setPhase('error'); setErrorMsg('Link inválido.'); return; }
    async function load() {
      try {
        // Busca convite pelo token
        const invs = await base44.entities.Invitation.filter({ token, status: 'sent' });
        if (!invs || invs.length === 0) {
          // Pode já ter sido aceito
          const accepted = await base44.entities.Invitation.filter({ token, status: 'accepted' });
          if (accepted.length > 0) {
            setPhase('error');
            setErrorMsg('Este convite já foi utilizado.');
          } else {
            setPhase('expired');
          }
          return;
        }
        const inv = invs[0];

        // Verifica expiração
        if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
          await base44.entities.Invitation.update(inv.id, { status: 'expired' });
          setPhase('expired');
          return;
        }

        setInv(inv);

        // Carrega workspace info
        try {
          const ws = await base44.entities.Workspace.get(inv.workspace_id);
          setWorkspace(ws);
        } catch {}

        // Verifica se usuário está logado
        try {
          const me = await base44.auth.me();
          setUser(me);
        } catch {}

        setPhase('found');
      } catch (err) {
        setPhase('error');
        setErrorMsg(err.message || 'Erro ao carregar convite.');
      }
    }
    load();
  }, [token]);

  // ── 2. Aceita o convite ──────────────────────────────────────────────────
  async function acceptInvite() {
    if (!invitation) return;
    setPhase('accepting');
    try {
      // Garante que o usuário está logado
      let me = user;
      if (!me) {
        // Redireciona ao login e volta aqui após
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      // Verifica se já é membro
      const existing = await base44.entities.WorkspaceMember.filter({
        workspace_id: invitation.workspace_id,
        user_email:   me.email,
      });

      if (existing.length === 0) {
        // Cria membership
        await base44.entities.WorkspaceMember.create({
          workspace_id: invitation.workspace_id,
          user_id:      me.id,
          user_email:   me.email,
          user_name:    me.full_name || me.email,
          role:         invitation.role,
          status:       'active',
          joined_at:    new Date().toISOString(),
          invited_by:   invitation.invited_by || invitation.created_by || '',
        });
      }

      // Marca convite como aceito
      await base44.entities.Invitation.update(invitation.id, {
        status:      'accepted',
        accepted_at: new Date().toISOString(),
      });

      // Salva workspace ativo no localStorage para o WorkspaceContext pegar
      try { localStorage.setItem('altivus_active_workspace', invitation.workspace_id); } catch {}

      // Atualiza workspace_id no perfil do usuário (compatibilidade)
      await base44.auth.updateMe({ workspace_id: invitation.workspace_id });

      setPhase('success');

      // Redireciona ao dashboard após 2s
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setPhase('error');
      setErrorMsg(err.message || 'Erro ao aceitar convite.');
    }
  }

  // ── 3. Se não logado, redireciona ao login ────────────────────────────────
  function goLogin() {
    base44.auth.redirectToLogin(window.location.href);
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050914' }}>
      {/* Background sutil */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(20,184,212,0.06) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', boxShadow: '0 0 24px rgba(20,184,212,0.35)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-black text-xl tracking-tight">ALTIVUS</span>
        </div>

        <div className="rounded-2xl p-8"
          style={{ background: 'linear-gradient(145deg,rgba(12,18,36,0.97),rgba(6,10,22,0.99))', border: '1px solid rgba(20,184,212,0.18)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>

          {/* Loading */}
          {phase === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: '#14B8D4' }} />
              <p className="text-white font-semibold">Validando convite...</p>
            </div>
          )}

          {/* Accepting */}
          {phase === 'accepting' && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: '#14B8D4' }} />
              <p className="text-white font-semibold">Configurando seu acesso...</p>
              <p className="text-xs mt-2" style={{ color: '#718096' }}>Criando sua membership no workspace</p>
            </div>
          )}

          {/* Success */}
          {phase === 'success' && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: '#00D99A' }} />
              <p className="text-white font-bold text-lg">Acesso concedido!</p>
              <p className="text-sm mt-2" style={{ color: '#A0AEC0' }}>
                Você agora é membro de <strong className="text-white">{workspace?.company_name || 'workspace'}</strong>.
              </p>
              <p className="text-xs mt-3" style={{ color: '#4A5568' }}>Redirecionando ao dashboard...</p>
              <div className="mt-4 w-8 h-8 mx-auto border-2 border-transparent border-t-[#14B8D4] rounded-full animate-spin" />
            </div>
          )}

          {/* Expired */}
          {phase === 'expired' && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#E87D00' }} />
              <p className="text-white font-bold">Convite expirado</p>
              <p className="text-sm mt-2" style={{ color: '#718096' }}>
                Este link de convite não é mais válido. Solicite um novo convite ao administrador do workspace.
              </p>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#FC5252' }} />
              <p className="text-white font-bold">Convite inválido</p>
              <p className="text-sm mt-2" style={{ color: '#718096' }}>{errorMsg}</p>
            </div>
          )}

          {/* Found — mostrar detalhes e botão de aceite */}
          {phase === 'found' && invitation && (
            <div>
              {/* Workspace info */}
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(20,184,212,0.12)', border: '1px solid rgba(20,184,212,0.25)' }}>
                  <Building2 className="w-7 h-7" style={{ color: '#14B8D4' }} />
                </div>
                <h2 className="text-white font-black text-xl">Convite para workspace</h2>
                <p className="text-sm mt-1" style={{ color: '#718096' }}>
                  Você foi convidado para acessar
                </p>
                <p className="text-white font-bold text-base mt-1">
                  {workspace?.company_name || 'Workspace'}
                </p>
              </div>

              {/* Detalhes do convite */}
              <div className="space-y-2 mb-6 rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {invitation.name && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#718096' }}>Convidado</span>
                    <span className="text-white font-semibold">{invitation.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#718096' }}>E-mail</span>
                  <span className="text-white font-mono text-xs">{invitation.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: '#718096' }}>Função</span>
                  <span className="font-bold text-xs px-2 py-0.5 rounded-md"
                    style={{ background: 'rgba(20,184,212,0.15)', color: '#14B8D4', border: '1px solid rgba(20,184,212,0.3)' }}>
                    {ROLE_LABELS[invitation.role] || invitation.role}
                  </span>
                </div>
                {invitation.role_title && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#718096' }}>Cargo</span>
                    <span className="text-white">{invitation.role_title}</span>
                  </div>
                )}
                {invitation.expires_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#718096' }}>Expira em</span>
                    <span style={{ color: '#E87D00' }} className="text-xs">
                      {new Date(invitation.expires_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Mensagem personalizada */}
              {invitation.message && (
                <div className="mb-6 p-3 rounded-xl text-sm italic"
                  style={{ background: 'rgba(109,86,232,0.08)', border: '1px solid rgba(109,86,232,0.18)', color: '#A0AEC0' }}>
                  "{invitation.message}"
                </div>
              )}

              {/* Estado do usuário */}
              {user ? (
                <div>
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-xl text-sm"
                    style={{ background: 'rgba(0,217,154,0.06)', border: '1px solid rgba(0,217,154,0.18)' }}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: '#00D99A' }} />
                    <span style={{ color: '#A0AEC0' }}>
                      Logado como <strong className="text-white">{user.full_name || user.email}</strong>
                    </span>
                  </div>
                  <Button className="w-full font-bold text-base h-11" onClick={acceptInvite}
                    style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', color: '#fff' }}>
                    Aceitar Convite e Entrar
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-center text-sm mb-4" style={{ color: '#718096' }}>
                    Faça login para aceitar o convite
                  </p>
                  <Button className="w-full font-bold text-base h-11" onClick={goLogin}
                    style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', color: '#fff' }}>
                    Fazer Login e Aceitar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
