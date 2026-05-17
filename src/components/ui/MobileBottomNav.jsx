import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Calendar, FileText, BookOpenCheck } from 'lucide-react';

const MOBILE_NAV = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, color: '#14B8D4' },
  { label: 'Cronograma', path: '/schedule', icon: Calendar, color: '#6D56E8' },
  { label: 'Atividades', path: '/activities', icon: ClipboardList, color: '#14B8D4' },
  { label: 'Field Log', path: '/fieldlog', icon: BookOpenCheck, color: '#00D99A' },
  { label: 'Relatórios', path: '/reports', icon: FileText, color: '#00D99A' },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 md:hidden"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'linear-gradient(180deg, rgba(4,8,22,0.95) 0%, rgba(2,5,14,0.99) 100%)',
        borderTop: '1px solid rgba(20,184,212,0.12)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
      }}
    >
      {MOBILE_NAV.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-xl transition-all duration-200 relative"
            style={{ minHeight: 52 }}
          >
            {/* Active glow bg */}
            {isActive && (
              <div
                className="absolute inset-x-2 inset-y-1 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${item.color}12, ${item.color}06)`,
                  border: `1px solid ${item.color}22`,
                }}
              />
            )}
            <item.icon
              className="w-5 h-5 relative z-10 transition-all duration-200"
              style={{
                color: isActive ? item.color : '#4A5568',
                filter: isActive ? `drop-shadow(0 0 6px ${item.color}90)` : 'none',
              }}
            />
            <span
              className="text-[9px] font-semibold relative z-10 tracking-wide"
              style={{ color: isActive ? item.color : '#4A5568' }}
            >
              {item.label}
            </span>
            {isActive && (
              <div
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}