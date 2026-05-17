import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Building2, Users, ClipboardList, 
  TrendingUp, Eye, ChevronLeft, ChevronRight, Settings,
  BookOpen, Package, Bot, LogOut, Wrench, FileText
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissions } from '@/lib/usePermissions';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

const navGroups = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/', color: '#00D4FF' },
      { label: 'Cronograma', icon: Calendar, path: '/schedule', color: '#7B61FF' },
      { label: 'Atividades', icon: ClipboardList, path: '/activities', color: '#00D4FF' },
    ]
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Contratos', icon: Building2, path: '/contracts', color: '#00FFB2' },
      { label: 'Equipes', icon: Users, path: '/teams', color: '#FF8A00' },
      { label: 'Materiais', icon: Package, path: '/materials', color: '#00D4FF' },
    ]
  },
  {
    label: 'Análise',
    items: [
      { label: 'Produtividade', icon: TrendingUp, path: '/productivity', color: '#7B61FF' },
      { label: 'Visão Diretor', icon: Eye, path: '/director', color: '#00FFB2' },
      { label: 'Relatórios', icon: FileText, path: '/reports', color: '#00D99A' },
      { label: 'Agente IA', icon: Bot, path: '/agent', color: '#00FFB2' },
    ]
  },
  {
    label: 'Config.',
    items: [
      { label: 'Cadastros', icon: Settings, path: '/registers', color: '#FF8A00' },
      { label: 'Admin Workspace', icon: Settings, path: '/workspace-admin', color: '#14B8D4' },
      { label: 'Admin Master', icon: Eye, path: '/admin-master', color: '#6D56E8' },
      { label: 'Reparo Master', icon: Wrench, path: '/master-repair', color: '#E87D00' },
      { label: 'Manual', icon: BookOpen, path: '/manual', color: '#7B61FF' },
    ]
  },
];

const ROLE_LABEL = { admin: 'Administrador', supervisor: 'Supervisor', operacional: 'Operacional' };
const ROLE_COLOR = { admin: '#00D4FF', supervisor: '#FF8A00', operacional: '#7B61FF' };

function NavItem({ item, isActive, collapsed }) {
  const link = (
    <Link
      to={item.path}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 relative overflow-hidden ${collapsed ? 'justify-center' : ''}`}
      style={isActive ? {
        background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
        border: `1px solid ${item.color}35`,
        boxShadow: `0 0 16px ${item.color}20, inset 0 1px 0 ${item.color}15`,
        color: item.color,
      } : {
        border: '1px solid transparent',
        color: '#A0AEC0',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.color = '#FFFFFF';
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
          e.currentTarget.style.transform = 'translateX(2px)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.color = '#A0AEC0';
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.transform = 'translateX(0)';
        }
      }}
    >
      <item.icon
        className="w-[17px] h-[17px] shrink-0 transition-all duration-200"
        style={isActive ? { color: item.color, filter: `drop-shadow(0 0 5px ${item.color})` } : {}}
      />
      {!collapsed && <span className="truncate text-[13px]">{item.label}</span>}
      {isActive && !collapsed && (
        <div
          className="absolute right-2.5 w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}
        />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent
          side="right"
          style={{ background: 'rgba(10,16,32,0.98)', border: '1px solid rgba(0,212,255,0.2)', color: '#fff', fontSize: '12px' }}
        >
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }
  return link;
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { hiddenRoutes, role } = usePermissions();
  const { user } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const isVisible = (path) => !hiddenRoutes.includes(path);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}
        style={{
          background: 'linear-gradient(180deg, rgba(3,6,16,0.88) 0%, rgba(5,9,22,0.92) 100%)',
          borderRight: '1px solid rgba(20,184,212,0.12)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.8), inset -1px 0 0 rgba(20,184,212,0.06)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        }}
      >
        {/* Logo ALTIVUS */}
        <div
          className="flex items-center gap-3 px-4 h-16 shrink-0"
          style={{ borderBottom: '1px solid rgba(20,184,212,0.10)' }}
        >
          {/* ALTIVUS "A" mark */}
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              width: collapsed ? 36 : 34,
              height: collapsed ? 36 : 34,
              filter: 'drop-shadow(0 0 8px rgba(20,184,212,0.65))',
            }}
          >
            <svg viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              {/* Outer A */}
              <path d="M20 2L38 34H2L20 2Z" stroke="#14B8D4" strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
              {/* Inner A accent */}
              <path d="M20 10L32 32H8L20 10Z" stroke="#6D56E8" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.7"/>
              {/* Crossbar */}
              <line x1="11" y1="26" x2="29" y2="26" stroke="#14B8D4" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p
                className="text-[15px] font-black tracking-[0.12em] leading-tight uppercase"
                style={{
                  background: 'linear-gradient(90deg, #FFFFFF 30%, #14B8D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: 'none',
                  letterSpacing: '0.12em',
                }}
              >
                ALTIVUS
              </p>
              <p className="text-[9px] font-semibold mt-0.5 tracking-widest uppercase truncate" style={{ color: 'rgba(20,184,212,0.7)' }}>
                Gestão Técnica em Altura
              </p>
            </div>
          )}
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navGroups.map((group, gi) => {
            const visibleItems = group.items.filter(item => isVisible(item.path));
            if (visibleItems.length === 0) return null;
            return (
              <div key={gi}>
                {!collapsed && (
                  <p
                    className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.12em]"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {group.label}
                  </p>
                )}
                {collapsed && gi > 0 && (
                  <div className="my-2 mx-3 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                )}
                <div className="space-y-0.5">
                  {visibleItems.map(item => (
                    <NavItem
                      key={item.path}
                      item={item}
                      isActive={location.pathname === item.path}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="shrink-0 px-2 pb-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-2 px-3 py-2 mt-2 mb-1 rounded-lg text-xs transition-all duration-200 ${collapsed ? 'justify-center' : 'justify-between'}`}
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#00D4FF'; e.currentTarget.style.background = 'rgba(0,212,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent'; }}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <><span className="text-[11px]">Recolher barra</span><ChevronLeft className="w-3.5 h-3.5" /></>
            }
          </button>

          {user && (
            collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto cursor-default text-xs font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${ROLE_COLOR[role] || '#00D4FF'}25, ${ROLE_COLOR[role] || '#00D4FF'}10)`,
                      border: `1px solid ${ROLE_COLOR[role] || '#00D4FF'}35`,
                      color: ROLE_COLOR[role] || '#00D4FF',
                    }}
                  >
                    {(user.full_name || user.email || '?')[0].toUpperCase()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" style={{ background: 'rgba(10,16,32,0.98)', border: '1px solid rgba(0,212,255,0.2)', color: '#fff', fontSize: '12px' }}>
                  {user.full_name || user.email}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${ROLE_COLOR[role] || '#00D4FF'}30, ${ROLE_COLOR[role] || '#00D4FF'}12)`,
                    border: `1px solid ${ROLE_COLOR[role] || '#00D4FF'}40`,
                    color: ROLE_COLOR[role] || '#00D4FF',
                  }}
                >
                  {(user.full_name || user.email || '?')[0].toUpperCase()}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-[12px] font-semibold text-white truncate leading-tight">{user.full_name || user.email}</p>
                  <p className="text-[10px] font-medium mt-0.5 truncate leading-tight" style={{ color: ROLE_COLOR[role] || '#00D4FF' }}>
                    {ROLE_LABEL[role] || role}
                  </p>
                </div>
                <button
                  onClick={() => base44.auth.logout()}
                  className="shrink-0 p-1 rounded-lg transition-all duration-200"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#FF4444'; e.currentTarget.style.background = 'rgba(255,68,68,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                  title="Sair"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}