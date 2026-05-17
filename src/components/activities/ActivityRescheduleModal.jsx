/**
 * ActivityRescheduleModal — reprogramar datas + equipe + justificativa
 */
import React, { useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ActivityRescheduleModal({ activity, teams = [], onConfirm, onCancel, loading }) {
  const [form, setForm] = useState({
    start_date: activity.start_date || '',
    end_date:   activity.end_date   || '',
    team_id:    activity.team_id    || '',
    reason:     '',
  });

  const canConfirm = form.reason.trim().length >= 5 && form.start_date;

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
          border: '1px solid rgba(232,125,0,0.25)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.85)',
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(232,125,0,0.10)', border: '1px solid rgba(232,125,0,0.25)' }}
          >
            <Calendar className="w-5 h-5" style={{ color: '#E87D00' }} />
          </div>
          <div>
            <h3 className="text-white font-bold">Reprogramar Atividade</h3>
            <p className="text-xs" style={{ color: '#718096' }}>{activity.title}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Data Início *</label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Data Fim</label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Equipe</label>
            <Select value={form.team_id} onValueChange={v => setForm(f => ({ ...f, team_id: v }))}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Manter equipe atual" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={activity.team_id || ''}>Manter atual</SelectItem>
                {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>
              Justificativa * (mínimo 5 caracteres)
            </label>
            <textarea
              className="w-full rounded-xl px-3 py-2 text-sm resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', minHeight: 72 }}
              placeholder="Motivo da reprogramação..."
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>Cancelar</Button>
          <Button
            onClick={() => onConfirm(form)}
            disabled={!canConfirm || loading}
            className="flex-1 gap-1.5"
            style={{ background: canConfirm ? 'linear-gradient(135deg,#E87D00cc,#E87D0088)' : undefined, opacity: canConfirm ? 1 : 0.4 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            Reprogramar
          </Button>
        </div>
      </div>
    </div>
  );
}