import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar.jsx';
import AppHeader from '@/components/layout/AppHeader.jsx';
import NavBar from '@/components/layout/NavBar.jsx';
import RecentActivitiesPanel from '@/components/layout/RecentActivitiesPanel.jsx';
import TrialBanner from '@/components/layout/TrialBanner.jsx';
import MobileBottomNav from '@/components/ui/MobileBottomNav.jsx';
import { useWorkspace } from '@/lib/useWorkspace';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspaceRealtime } from '@/lib/useWorkspaceRealtime';
import { useAuth } from '@/lib/AuthContext';
import { operationalLogService } from '@/services/operationalLogService';
import { AlertTriangle, Clock, Mail } from 'lucide-react';

const MemoSidebar         = memo(Sidebar);
const MemoAppHeader       = memo(AppHeader);
const MemoNavBar          = memo(NavBar);
const MemoTrialBanner     = memo(TrialBanner);
const MemoRecentPanel     = memo(RecentActivitiesPanel);
const MemoMobileBottomNav = memo(MobileBottomNav);

function WorkspaceLoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: '#050914' }}>
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', boxShadow: '0 0 20px rgba(20,184,212,0.4)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-black text-xl tracking-tight">ALTIVUS</span>
        </div>
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-white/5" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#14B8D4] animate-spin" />
        </div>
        <p className="text-xs font-medium" style={{ color: '#4A5568' }}>Carregando workspace...</p>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute â€” bloqueia rota se a permissÃ£o for falsa
 */
export function WorkspaceAccountGate({ workspace, children }) {
  const trialEnd = workspace?.trial_end ? new Date(workspace.trial_end) : null;
  const isExpired = workspace?.account_status === 'expired' || (trialEnd && trialEnd <= new Date());
  const isBlocked = workspace?.account_status === 'blocked';
  if (!isBlocked && !isExpired) return children;

  const Icon = isBlocked ? AlertTriangle : Clock;
  const color = isBlocked ? '#DC3737' : '#718096';
  const title = isBlocked ? 'Acesso bloqueado' : 'PerÃ­odo de teste encerrado';
  const message = isBlocked
    ? 'Seu workspace foi temporariamente bloqueado. Entre em contato com a equipe ALTIVUS para reativar o acesso.'
    : 'Para continuar usando a ALTIVUS e manter seus dados ativos, fale com nossa equipe.';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full rounded-2xl p-6 text-center"
        style={{ background: `${color}14`, border: `1px solid ${color}45` }}>
        <Icon className="w-10 h-10 mx-auto mb-3" style={{ color }} />
        <p className="text-white font-bold mb-1">{title}</p>
        <p className="text-sm mb-4" style={{ color: '#A0AEC0' }}>{message}</p>
        <a href="mailto:contato@altivus.com.br" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{ background: `${color}26`, border: `1px solid ${color}55`, color }}>
          <Mail className="w-4 h-4" /> Solicitar renovaÃ§Ã£o de acesso
        </a>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { isLoading, workspaceId, currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const db = useWorkspaceEntities();
  const navigate = useNavigate();
  const accountLogKeyRef = useRef('');
  useWorkspaceRealtime();

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('altivus_sidebar_collapsed') === 'true'; } catch { return false; }
  });
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    let timer;
    const check = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIsMobile(window.innerWidth < 768), 100);
    };
    window.addEventListener('resize', check, { passive: true });
    return () => { window.removeEventListener('resize', check); clearTimeout(timer); };
  }, []);

  // ApÃ³s carregar: se sem workspace, vai para setup
  useEffect(() => {
    if (isLoading || !user) return;
    if (!workspaceId) {
      navigate('/workspace-setup', { replace: true });
    }
  }, [isLoading, workspaceId, user, navigate]);

  useEffect(() => {
    if (!workspaceId || !currentWorkspace || !user) return;
    const trialEnd = currentWorkspace.trial_end ? new Date(currentWorkspace.trial_end) : null;
    const status = currentWorkspace.account_status === 'blocked'
      ? 'blocked'
      : (currentWorkspace.account_status === 'expired' || (trialEnd && trialEnd <= new Date()) ? 'expired' : '');

    if (!status) {
      accountLogKeyRef.current = '';
      return;
    }

    const key = `${workspaceId}:${status}`;
    if (accountLogKeyRef.current === key) return;
    accountLogKeyRef.current = key;
    operationalLogService.recordWorkspaceAccessRestriction(db, {
      workspace: currentWorkspace,
      user,
      status,
    });
  }, [currentWorkspace, db, user, workspaceId]);

  const handleSetCollapsed = useCallback((val) => {
    setCollapsed(val);
    try { localStorage.setItem('altivus_sidebar_collapsed', String(val)); } catch {}
  }, []);

  const sidebarW = isMobile ? 0 : (collapsed ? 64 : 240);

  if (isLoading) return <WorkspaceLoadingScreen />;
  if (!workspaceId) return <WorkspaceLoadingScreen />;

  return (
    <div className="min-h-screen" style={{ background: 'transparent' }}>
      {!isMobile && <MemoSidebar collapsed={collapsed} setCollapsed={handleSetCollapsed} />}

      <div className="flex flex-col min-h-screen relative z-10"
        style={{ marginLeft: sidebarW, transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <MemoAppHeader isMobile={isMobile} />
        {!isMobile && <MemoNavBar />}
        <MemoTrialBanner />
        <main className="flex-1 overflow-x-hidden">
          <div className={isMobile ? 'p-4' : 'p-4 md:p-5 lg:p-6 max-w-[1440px] mx-auto'}
            style={isMobile ? { paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' } : {}}>
            <ErrorBoundary>
              <WorkspaceAccountGate workspace={currentWorkspace}>
                <Outlet />
              </WorkspaceAccountGate>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {!isMobile && <MemoRecentPanel />}
      {isMobile && <MemoMobileBottomNav />}
    </div>
  );
}
