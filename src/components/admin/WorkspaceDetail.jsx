import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Lock } from 'lucide-react';
import { format } from 'date-fns';

const SCORE_LABEL = (s) => s <= 30 ? { l: 'Baixo uso', c: '#DC3737' } : s <= 60 ? { l: 'Uso moderado', c: '#E87D00' } : s <= 80 ? { l: 'Bom uso', c: '#14B8D4' } : { l: 'Alto potencial', c: '#00D99A' };

function Metric({ label, value, color = '#14B8D4' }) {
  return (
    <div className="text-center rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-xl font-black" style={{ color }}>{value ?? '—'}</div>
      <div className="text-[10px] mt-0.5" style={{ color: '#718096' }}>{label}</div>
    </div>
  );
}

export default function WorkspaceDetail({ workspace: ws, onBack: _onBack, onUpdate }) {
  const [form, setForm] = useState({
    trial_start: ws.trial_start || '',
    trial_end: ws.trial_end || '',
    user_limit: ws.user_limit || 10,
    collaborator_limit: ws.collaborator_limit || 50,
    activity_limit: ws.activity_limit || 100,
    report_limit: ws.report_limit || 50,
    account_status: ws.account_status || 'trial',
    adoption_score: ws.adoption_score || 0,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate(ws.id, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const score = form.adoption_score;
  const sc = SCORE_LABEL(score);

  const scoreSections = [
    { label: 'Login frequente', weight: 20 },
    { label: 'Usuários ativos', weight: 15 },
    { label: 'Registro de campo usado', weight: 20 },
    { label: 'Relatórios gerados', weight: 15 },
    { label: 'Atividades cadastradas', weight: 10 },
    { label: 'Fotos antes/depois', weight: 10 },
    { label: 'Aprovações realizadas', weight: 10 },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.94),rgba(6,10,22,0.97))', border: '1px solid rgba(20,184,212,0.15)' }}>
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-xl font-black text-white">{ws.company_name}</h2>
            <p className="text-sm mt-0.5" style={{ color: '#718096' }}>
              {ws.responsible_name} · {ws.responsible_email} · {ws.role_title || '—'}
            </p>
          </div>
          <div className="text-center rounded-xl px-4 py-2" style={{ background: `${sc.c}14`, border: `1px solid ${sc.c}35` }}>
            <div className="text-2xl font-black" style={{ color: sc.c }}>{score}</div>
            <div className="text-[10px] font-bold" style={{ color: sc.c }}>Score de Adoção</div>
            <div className="text-[10px]" style={{ color: '#718096' }}>{sc.l}</div>
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] mb-1" style={{ color: '#718096' }}>
            <span>Baixo uso (0)</span><span>Alto potencial (100)</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: `linear-gradient(90deg, #DC3737, #E87D00, #14B8D4, #00D99A)` }} />
          </div>
          <div className="flex justify-between text-[9px] mt-1" style={{ color: '#4A5568' }}>
            <span>0-30</span><span>31-60</span><span>61-80</span><span>81-100</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Segmento" value={ws.segment || '—'} />
          <Metric label="Colaboradores" value={ws.estimated_workers || 0} color="#6D56E8" />
          <Metric label="Criado em" value={ws.created_date ? format(new Date(ws.created_date), 'dd/MM/yy') : '—'} color="#718096" />
          <Metric label="Último acesso" value={ws.last_login ? format(new Date(ws.last_login), 'dd/MM/yy') : '—'} color="#E87D00" />
        </div>
      </div>

      {/* License control */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.92),rgba(6,10,22,0.97))', border: '1px solid rgba(109,86,232,0.18)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4" style={{ color: '#6D56E8' }} />
          <p className="text-sm font-bold text-white">Controle Manual de Licença</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Status da Conta</label>
            <select className="w-full h-9 rounded-xl px-3 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
              value={form.account_status} onChange={e => setForm(f => ({ ...f, account_status: e.target.value }))}>
              {[['trial','Teste Ativo'],['awaiting_approval','Ag. Aprovação'],['active','Ativo'],['blocked','Bloqueado'],['expired','Expirado'],['lead','Lead'],['pilot','Piloto'],['paid','Cliente Pago']].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Score de Adoção</label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={100} value={form.adoption_score} onChange={e => setForm(f => ({ ...f, adoption_score: Number(e.target.value) }))} className="flex-1" />
              <span className="text-xs font-bold w-12 text-right" style={{ color: sc.c }}>{score}/100</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Início do Teste</label>
            <Input type="date" value={form.trial_start} onChange={e => setForm(f => ({ ...f, trial_start: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Fim do Teste</label>
            <Input type="date" value={form.trial_end} onChange={e => setForm(f => ({ ...f, trial_end: e.target.value }))} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Limite de Usuários</label>
            <Input type="number" min={1} value={form.user_limit} onChange={e => setForm(f => ({ ...f, user_limit: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Limite de Colaboradores</label>
            <Input type="number" min={1} value={form.collaborator_limit} onChange={e => setForm(f => ({ ...f, collaborator_limit: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Limite de Atividades</label>
            <Input type="number" min={1} value={form.activity_limit} onChange={e => setForm(f => ({ ...f, activity_limit: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>Limite de Relatórios PDF</label>
            <Input type="number" min={1} value={form.report_limit} onChange={e => setForm(f => ({ ...f, report_limit: Number(e.target.value) }))} />
          </div>
        </div>

        <Button className="w-full mt-4 gap-2" onClick={handleSave}
          style={saved ? { background: 'rgba(0,217,154,0.20)', color: '#00D99A', border: '1px solid rgba(0,217,154,0.40)' } : {}}>
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Score breakdown */}
      <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(145deg,rgba(10,18,36,0.92),rgba(6,10,22,0.97))', border: '1px solid rgba(20,184,212,0.12)' }}>
        <p className="text-sm font-bold text-white mb-3">📊 Score de Adoção ALTIVUS — Composição</p>
        <div className="space-y-2">
          {scoreSections.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#A0AEC0' }}>{s.label}</span>
              <span className="font-bold" style={{ color: '#6D56E8' }}>peso {s.weight}%</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: 'rgba(20,184,212,0.06)', border: '1px solid rgba(20,184,212,0.18)' }}>
          <p style={{ color: '#14B8D4' }}>Classifição: <strong>0-30 Baixo · 31-60 Moderado · 61-80 Bom · 81-100 Alto Potencial</strong></p>
        </div>
      </div>
    </div>
  );
}
