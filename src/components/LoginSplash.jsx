import React, { useEffect, useState } from 'react';
import { Shield, TrendingUp, ClipboardList, Camera, BarChart2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const BG_IMAGE = 'https://media.base44.com/images/public/69c51d6a9454393456c760a3/056a6bfac_38roVt0wSuaex6WViRmLOA_2k.webp';

const PILLARS = [
  { icon: Shield,        label: 'Segurança'   },
  { icon: TrendingUp,    label: 'Performance' },
  { icon: ClipboardList, label: 'Controle'    },
  { icon: Camera,        label: 'Evidências'  },
  { icon: BarChart2,     label: 'Análise'     },
];

export default function LoginSplash() {
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse]     = useState(false);
  const { navigateToLogin } = useAuth();

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setInterval(() => setPulse(p => !p), 2200);
    return () => clearInterval(t);
  }, []);

  const handleLogin = () => {
    navigateToLogin();
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.9s ease' }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BG_IMAGE})`, filter: 'blur(2px) brightness(0.6)' }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(2,5,16,0.68)' }} />

      {/* Neon glow orb pulsing */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: pulse
            ? 'radial-gradient(ellipse 55% 38% at 50% 42%, rgba(20,184,212,0.09) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 55% 38% at 50% 42%, rgba(20,184,212,0.04) 0%, transparent 70%)',
          transition: 'background 2.2s ease',
        }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(20,184,212,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20,184,212,0.035) 1px, transparent 1px)
          `,
          backgroundSize: '52px 52px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full px-4">

        {/* Logo + Wordmark */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 mb-5 flex items-center justify-center"
            style={{
              filter: pulse
                ? 'drop-shadow(0 0 20px rgba(20,184,212,0.95))'
                : 'drop-shadow(0 0 10px rgba(20,184,212,0.55))',
              transition: 'filter 2.2s ease',
            }}
          >
            <svg viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="58">
              <path d="M20 2L38 34H2L20 2Z" stroke="#14B8D4" strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
              <path d="M20 10L32 32H8L20 10Z" stroke="#6D56E8" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.8"/>
              <line x1="11" y1="26" x2="29" y2="26" stroke="#14B8D4" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <h1
            className="text-5xl sm:text-6xl font-black uppercase leading-none mb-3"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 20%, #14B8D4 65%, #6D56E8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.18em',
              filter: pulse
                ? 'drop-shadow(0 0 16px rgba(20,184,212,0.65))'
                : 'drop-shadow(0 0 6px rgba(20,184,212,0.28))',
              transition: 'filter 2.2s ease',
            }}
          >
            ALTIVUS
          </h1>

          <p
            className="text-xs sm:text-sm font-semibold uppercase text-center"
            style={{ color: 'rgba(160,174,192,0.80)', letterSpacing: '0.20em' }}
          >
            Plataforma de Gestão Técnica em Altura
          </p>
        </div>

        {/* Login card */}
        <div
          className="w-full max-w-sm rounded-2xl p-8"
          style={{
            background: 'rgba(6,10,24,0.76)',
            backdropFilter: 'blur(22px) saturate(140%)',
            WebkitBackdropFilter: 'blur(22px) saturate(140%)',
            border: '1px solid rgba(20,184,212,0.22)',
            boxShadow: [
              '0 0 40px rgba(20,184,212,0.10)',
              '0 24px 64px rgba(0,0,0,0.70)',
              'inset 0 1px 0 rgba(20,184,212,0.14)',
            ].join(','),
          }}
        >
          <p
            className="text-center text-[10px] font-bold uppercase tracking-widest mb-6"
            style={{ color: 'rgba(160,174,192,0.50)' }}
          >
            Acesse sua conta
          </p>

          {/* CTA único */}
          <p className="text-center text-xs mb-6" style={{ color: 'rgba(160,174,192,0.60)' }}>
            Acesse com sua conta corporativa para continuar.
          </p>

          <button
            onClick={handleLogin}
            className="w-full h-11 rounded-xl font-black text-sm tracking-widest uppercase transition-all duration-200 select-none"
            style={{
              background: 'linear-gradient(135deg, #14B8D4 0%, #0FA8C2 50%, #6D56E8 100%)',
              color: '#020B14',
              boxShadow: '0 0 16px rgba(20,184,212,0.38), 0 4px 16px rgba(0,0,0,0.50)',
              letterSpacing: '0.08em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 28px rgba(20,184,212,0.65), 0 6px 22px rgba(0,0,0,0.55)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 0 16px rgba(20,184,212,0.38), 0 4px 16px rgba(0,0,0,0.50)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Entrar na Plataforma
          </button>
        </div>

        {/* Pillar icons */}
        <div className="flex items-center gap-5 sm:gap-8 mt-10 flex-wrap justify-center">
          {PILLARS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(20,184,212,0.08)', border: '1px solid rgba(20,184,212,0.20)' }}
              >
                <Icon className="w-4 h-4" style={{ color: '#14B8D4' }} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(160,174,192,0.42)' }}>{label}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[10px] font-medium tracking-wider" style={{ color: 'rgba(160,174,192,0.22)' }}>
          © 2026 ALTIVUS · Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}