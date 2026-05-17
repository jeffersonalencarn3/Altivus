import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Building2, Users, ClipboardList, TrendingUp, Eye, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Cronograma', path: '/schedule', icon: Calendar },
  { label: 'Contratos', path: '/contracts', icon: Building2 },
  { label: 'Equipes', path: '/teams', icon: Users },
  { label: 'Atividades', path: '/activities', icon: ClipboardList },
  { label: 'Produtividade', path: '/productivity', icon: TrendingUp },
  { label: 'Relatórios', path: '/director', icon: Eye },
  { label: 'Cadastros', path: '/registers', icon: Settings },
];

export default function NavBar() {
  const location = useLocation();

  return (
    <nav
      className="flex items-center gap-0.5 px-3 h-10 overflow-x-auto"
      style={{
        background: 'linear-gradient(90deg, rgba(3,6,16,0.90) 0%, rgba(5,9,22,0.86) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(20,184,212,0.05)',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        overscrollBehaviorX: 'contain',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg shrink-0 text-[11px] font-semibold transition-all duration-200 relative select-none"
            style={isActive ? {
              background: 'linear-gradient(135deg, rgba(20,184,212,0.14), rgba(109,86,232,0.09))',
              border: '1px solid rgba(20,184,212,0.25)',
              color: '#14B8D4',
              boxShadow: '0 0 10px rgba(20,184,212,0.15), inset 0 1px 0 rgba(20,184,212,0.12)',
            } : {
              border: '1px solid transparent',
              color: '#5A6878',
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.color = '#E2E8F0';
                e.currentTarget.style.background = 'rgba(255,255,255,0.055)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35), 0 0 8px rgba(20,184,212,0.07)';
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.color = '#718096';
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <item.icon className="w-3.5 h-3.5 shrink-0" style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(20,184,212,0.6))' } : {}} />
            <span>{item.label}</span>
            {isActive && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, #14B8D4, transparent)' }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}