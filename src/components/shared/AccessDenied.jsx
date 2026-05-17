/**
 * AccessDenied — exibido quando o usuário não tem permissão para acessar uma rota/ação
 */
import React from 'react';
import { Lock } from 'lucide-react';

export default function AccessDenied({ message = 'Acesso restrito para seu nível de permissão.' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(252,82,82,0.08)', border: '1px solid rgba(252,82,82,0.20)' }}>
        <Lock className="w-6 h-6" style={{ color: '#FC5252' }} />
      </div>
      <h2 className="text-white font-bold text-lg mb-1">Acesso Negado</h2>
      <p className="text-sm max-w-xs" style={{ color: '#718096' }}>{message}</p>
    </div>
  );
}