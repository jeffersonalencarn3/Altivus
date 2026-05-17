/**
 * ActivityDeleteModal — confirmação de exclusão/arquivamento com auditoria
 */
import React, { useState } from 'react';
import { AlertTriangle, Trash2, Archive, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ActivityDeleteModal({ activity, mode = 'archive', onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const isDelete = mode === 'delete';

  const impactColor  = isDelete ? '#FC5252' : '#718096';
  const impactBg     = isDelete ? 'rgba(252,82,82,0.08)' : 'rgba(113,128,150,0.08)';
  const impactBorder = isDelete ? 'rgba(252,82,82,0.25)' : 'rgba(113,128,150,0.25)';

  const canConfirm = reason.trim().length >= 5 && confirmed;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'linear-gradient(145deg,rgba(10,18,36,0.99),rgba(6,10,22,1))',
          border: `1px solid ${impactBorder}`,
          boxShadow: '0 24px 80px rgba(0,0,0,0.85)',
        }}
      >
        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: impactBg, border: `1px solid ${impactBorder}` }}
          >
            {isDelete ? <Trash2 className="w-5 h-5" style={{ color: impactColor }} /> : <Archive className="w-5 h-5" style={{ color: impactColor }} />}
          </div>
          <div>
            <h3 className="text-white font-bold text-base">
              {isDelete ? 'Excluir atividade?' : 'Arquivar atividade?'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#718096' }}>
              Esta ação será registrada no histórico de auditoria.
            </p>
          </div>
        </div>

        {/* Activity info */}
        <div
          className="rounded-xl p-3 mb-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-bold text-white truncate">{activity.title}</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#4A5568' }}>
            Status atual: <span style={{ color: '#A0AEC0' }}>{activity.status}</span>
          </p>
        </div>

        {/* Impact warning */}
        <div
          className="rounded-xl p-3 mb-4 flex items-start gap-2"
          style={{ background: impactBg, border: `1px solid ${impactBorder}` }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: impactColor }} />
          <p className="text-xs" style={{ color: impactColor }}>
            {isDelete
              ? 'A atividade será marcada como excluída. Histórico, fotos e relatórios serão preservados.'
              : 'A atividade ficará oculta nos filtros padrão. Pode ser restaurada a qualquer momento.'}
          </p>
        </div>

        {/* Motivo */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>
            Motivo * (mínimo 5 caracteres)
          </label>
          <Input
            placeholder="Descreva o motivo..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>

        {/* Confirmação dupla */}
        <label className="flex items-center gap-2.5 cursor-pointer mb-5">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: impactColor }}
          />
          <span className="text-xs" style={{ color: '#A0AEC0' }}>
            Confirmo que entendo o impacto desta ação
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm(reason)}
            disabled={!canConfirm || loading}
            className="flex-1 gap-1.5"
            style={{
              background: canConfirm ? `linear-gradient(135deg, ${impactColor}cc, ${impactColor}88)` : undefined,
              opacity: canConfirm ? 1 : 0.4,
            }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isDelete ? <Trash2 className="w-4 h-4" /> : <Archive className="w-4 h-4" />)}
            {isDelete ? 'Excluir' : 'Arquivar'}
          </Button>
        </div>
      </div>
    </div>
  );
}