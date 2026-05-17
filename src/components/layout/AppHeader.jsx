import React, { useState } from 'react';
import { Bell, Search, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

export default function AppHeader({ isMobile = false }) {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between gap-3 relative"
      style={{
        height: isMobile ? 56 : 52,
        padding: isMobile ? '0 16px' : '0 20px',
        background: 'linear-gradient(90deg, rgba(3,7,18,0.96) 0%, rgba(6,11,26,0.93) 100%)',
        borderBottom: '1px solid rgba(20,184,212,0.10)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.5), inset 0 -1px 0 rgba(20,184,212,0.06)',
      }}
    >
      {/* Mobile: Logo */}
      {isMobile ? (
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div style={{ filter: 'drop-shadow(0 0 6px rgba(20,184,212,0.7))', width: 28, height: 28 }}>
            <svg viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
              <path d="M20 2L38 34H2L20 2Z" stroke="#14B8D4" strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
              <path d="M20 10L32 32H8L20 10Z" stroke="#6D56E8" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.7"/>
              <line x1="11" y1="26" x2="29" y2="26" stroke="#14B8D4" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-black tracking-[0.1em] uppercase leading-none"
              style={{
                background: 'linear-gradient(90deg, #FFFFFF 20%, #14B8D4 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>ALTIVUS</p>
            <p className="text-[8px] font-semibold tracking-widest uppercase" style={{ color: 'rgba(20,184,212,0.6)', marginTop: 1 }}>
              Gestão em Altura
            </p>
          </div>
        </Link>
      ) : (
        /* Desktop: Search */
        <div
          className="flex items-center gap-2 px-3 h-8 rounded-xl transition-all duration-250"
          style={{
            background: searchFocused ? 'rgba(20,184,212,0.07)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${searchFocused ? 'rgba(20,184,212,0.30)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: searchFocused ? '0 0 14px rgba(20,184,212,0.14)' : 'none',
            width: searchFocused ? 280 : 220,
            transition: 'all 0.25s ease',
          }}
        >
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: searchFocused ? '#14B8D4' : '#6B7280' }} />
          <input
            placeholder="Buscar atividades, contratos..."
            className="bg-transparent border-none outline-none text-xs w-full"
            style={{ color: '#E2E8F0', caretColor: '#14B8D4' }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Live indicator — desktop only */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(0,217,154,0.06)', border: '1px solid rgba(0,217,154,0.18)' }}>
          <span className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#00D99A', boxShadow: '0 0 5px #00D99A', animation: 'neonPulse 2s ease-in-out infinite' }} />
          <span className="text-[10px] font-semibold" style={{ color: '#00D99A' }}>AO VIVO</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className="flex items-center justify-center rounded-xl transition-all duration-200"
          style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,212,0.08)'; e.currentTarget.style.borderColor = 'rgba(20,184,212,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" style={{ color: '#EAB308' }} />
            : <Moon className="w-4 h-4" style={{ color: '#6D56E8' }} />
          }
        </button>

        {/* Notifications */}
        <button
          className="relative flex items-center justify-center rounded-xl transition-all duration-200"
          style={{
            width: 34, height: 34,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,212,0.08)'; e.currentTarget.style.borderColor = 'rgba(20,184,212,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
        >
          <Bell className="w-4 h-4" style={{ color: '#A0AEC0' }} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: '#14B8D4', boxShadow: '0 0 5px #14B8D4' }} />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-2.5 h-8 rounded-xl transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(20,184,212,0.07)'; e.currentTarget.style.borderColor = 'rgba(20,184,212,0.20)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <div
              className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black"
              style={{ background: 'linear-gradient(135deg, #14B8D4, #6D56E8)', color: '#fff' }}
            >
              {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium hidden sm:block" style={{ color: '#E2E8F0' }}>
              {user?.full_name?.split(' ')[0] || 'Usuário'}
            </span>
            <ChevronDown className="w-3 h-3 hidden sm:block" style={{ color: '#6B7280' }} />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div
                className="absolute right-0 top-10 rounded-xl overflow-hidden min-w-[180px] z-50"
                style={{
                  background: 'rgba(6,10,22,0.99)',
                  border: '1px solid rgba(20,184,212,0.15)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(24px)',
                }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-bold text-white">{user?.full_name || 'Usuário'}</p>
                  <p className="text-[10px] mt-0.5 font-medium" style={{ color: '#14B8D4' }}>{user?.email}</p>
                </div>
                <button
                  className="w-full px-4 py-2.5 text-left text-xs font-medium transition-all duration-150"
                  style={{ color: '#FC8181' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,129,129,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => base44.auth.logout()}
                >
                  Sair da conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}