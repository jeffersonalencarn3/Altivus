import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle } from 'lucide-react';

const BG_IMAGE = 'https://media.base44.com/images/public/69c51d6a9454393456c760a3/056a6bfac_38roVt0wSuaex6WViRmLOA_2k.webp';

export default function UserNotRegisteredError() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease' }}
    >
      {/* BG */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})`, filter: 'blur(2px) brightness(0.5)' }}
      />
      <div className="absolute inset-0" style={{ background: 'rgba(2,5,16,0.72)' }} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(20,184,212,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,212,0.03) 1px,transparent 1px)`,
          backgroundSize: '52px 52px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center px-4 w-full max-w-md">
        {/* Logo */}
        <div className="mb-6" style={{ filter: 'drop-shadow(0 0 12px rgba(20,184,212,0.7))' }}>
          <svg viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg" width="52" height="47">
            <path d="M20 2L38 34H2L20 2Z" stroke="#14B8D4" strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
            <path d="M20 10L32 32H8L20 10Z" stroke="#6D56E8" strokeWidth="1.4" fill="none" strokeLinejoin="round" opacity="0.8"/>
            <line x1="11" y1="26" x2="29" y2="26" stroke="#14B8D4" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <h1
          className="text-3xl font-black tracking-widest uppercase mb-1"
          style={{ background: 'linear-gradient(135deg,#FFFFFF 20%,#14B8D4 70%,#6D56E8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.18em' }}
        >
          ALTIVUS
        </h1>
        <p className="text-xs font-semibold uppercase tracking-widest mb-8" style={{ color: 'rgba(160,174,192,0.60)', letterSpacing: '0.18em' }}>
          Gestão Técnica em Altura
        </p>

        {/* Card */}
        <div
          className="w-full rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(6,10,24,0.78)',
            backdropFilter: 'blur(22px)',
            WebkitBackdropFilter: 'blur(22px)',
            border: '1px solid rgba(232,125,0,0.28)',
            boxShadow: '0 0 32px rgba(232,125,0,0.08), 0 20px 60px rgba(0,0,0,0.65)',
          }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(232,125,0,0.12)', border: '1px solid rgba(232,125,0,0.30)' }}>
            <AlertTriangle className="w-6 h-6" style={{ color: '#E87D00' }} />
          </div>

          <h2 className="text-white font-bold text-lg mb-2">Acesso Restrito</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(160,174,192,0.70)' }}>
            Você não está registrado nesta plataforma. Entre em contato com o administrador para solicitar acesso.
          </p>

          <div className="rounded-xl p-4 mb-6 text-left space-y-1.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              'Verifique se está logado com a conta correta',
              'Solicite acesso ao administrador do workspace',
              'Tente sair e entrar novamente',
            ].map((t, i) => (
              <p key={i} className="text-xs flex items-start gap-2" style={{ color: 'rgba(160,174,192,0.60)' }}>
                <span style={{ color: '#14B8D4' }}>›</span> {t}
              </p>
            ))}
          </div>

          <button
            onClick={() => base44.auth.logout()}
            className="w-full h-10 rounded-xl font-bold text-sm transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#A0AEC0',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.11)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#A0AEC0'; }}
          >
            Sair e Trocar de Conta
          </button>
        </div>
      </div>
    </div>
  );
}