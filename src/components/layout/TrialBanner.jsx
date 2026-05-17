import React from 'react';
import { useWorkspace } from '@/lib/useWorkspace';
import { AlertTriangle, Clock, Mail } from 'lucide-react';

export default function TrialBanner() {
  const { currentWorkspace: ws } = useWorkspace();
  if (!ws) return null;

  const trialEnd = ws.trial_end ? new Date(ws.trial_end) : null;
  const daysLeft = trialEnd ? Math.ceil((trialEnd - new Date()) / 86400000) : null;

  if (ws.account_status === 'blocked') return (
    <div className="mx-4 mt-3 rounded-2xl p-5 text-center"
      style={{ background: 'rgba(220,55,55,0.08)', border: '1px solid rgba(220,55,55,0.30)' }}>
      <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: '#DC3737' }} />
      <p className="text-white font-bold mb-1">Acesso bloqueado</p>
      <p className="text-sm mb-3" style={{ color: '#718096' }}>Seu acesso foi temporariamente bloqueado. Entre em contato com a equipe ALTIVUS.</p>
      <a href="mailto:contato@altivus.com.br" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        style={{ background: 'rgba(220,55,55,0.20)', border: '1px solid rgba(220,55,55,0.40)', color: '#DC3737' }}>
        <Mail className="w-4 h-4" /> Solicitar renovação de acesso
      </a>
    </div>
  );

  if (ws.account_status === 'expired' || (daysLeft !== null && daysLeft <= 0)) return (
    <div className="mx-4 mt-3 rounded-2xl p-5 text-center"
      style={{ background: 'rgba(113,128,150,0.08)', border: '1px solid rgba(113,128,150,0.25)' }}>
      <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#718096' }} />
      <p className="text-white font-bold mb-1">Período de teste encerrado</p>
      <p className="text-sm mb-3" style={{ color: '#718096' }}>Para continuar usando a ALTIVUS e manter seus dados ativos, fale com nossa equipe.</p>
      <a href="mailto:contato@altivus.com.br" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
        style={{ background: 'rgba(20,184,212,0.15)', border: '1px solid rgba(20,184,212,0.35)', color: '#14B8D4' }}>
        <Mail className="w-4 h-4" /> Solicitar renovação de acesso
      </a>
    </div>
  );

  if (daysLeft !== null && daysLeft <= 7 && daysLeft > 0) return (
    <div className="mx-4 mt-3 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap"
      style={{ background: 'rgba(232,125,0,0.08)', border: '1px solid rgba(232,125,0,0.25)' }}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#E87D00' }} />
        <p className="text-xs font-semibold" style={{ color: '#E87D00' }}>
          Seu acesso de teste termina em <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong>. Entre em contato com a ALTIVUS para continuar.
        </p>
      </div>
      <a href="mailto:contato@altivus.com.br" className="text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0"
        style={{ background: 'rgba(232,125,0,0.20)', border: '1px solid rgba(232,125,0,0.40)', color: '#E87D00' }}>
        Renovar
      </a>
    </div>
  );

  return null;
}
