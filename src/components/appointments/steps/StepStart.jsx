import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/useWorkspace';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, User } from 'lucide-react';

export default function StepStart({ form, patch, isLocked }) {
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const enabled = !!workspaceId;
  const { data: contracts = [] }  = useQuery({ queryKey: ['contracts', workspaceId],  queryFn: () => db.Contract.list(), enabled });
  const { data: activities = [] } = useQuery({ queryKey: ['activities', workspaceId], queryFn: () => db.Activity.list(), enabled });
  const { data: employees = [] }  = useQuery({ queryKey: ['employees', workspaceId],  queryFn: () => db.Employee.list(), enabled });
  const { data: areas = [] }      = useQuery({ queryKey: ['areas', workspaceId],      queryFn: () => db.Area.list(), enabled });

  useEffect(() => {
    if (!form.start_time) {
      const n = new Date();
      patch({ start_time: `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}` });
    }
  }, []);

  const selectEmployee = (empId) => {
    const emp = employees.find(e => e.id === empId);
    patch({ employee_id: empId, employee_name: emp?.name || '', employee_role: emp?.role || '', team_id: emp?.team_id || '' });
  };

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#A0AEC0' }}>{label}</label>
      {children}
    </div>
  );

  const Select = ({ value, onChange, children, placeholder }) => (
    <select value={value} onChange={e => onChange(e.target.value)} disabled={isLocked}
      className="w-full h-9 rounded-xl px-3 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: value ? '#fff' : '#718096' }}>
      <option value="">{placeholder}</option>
      {children}
    </select>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🌅</span>
        <div>
          <h2 className="text-white font-bold text-lg">Início do Apontamento</h2>
          <p className="text-xs" style={{ color: '#718096' }}>Identificação do colaborador e configuração inicial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Data">
          <Input type="date" value={form.date} onChange={e => patch({ date: e.target.value })} disabled={isLocked} />
        </Field>
        <Field label="Horário de Início">
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#14B8D4' }} />
            <Input type="time" value={form.start_time} onChange={e => patch({ start_time: e.target.value })} className="pl-9" disabled={isLocked} />
          </div>
        </Field>

        <Field label="Colaborador *">
          <Select value={form.employee_id} onChange={selectEmployee} placeholder="Selecionar colaborador...">
            {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
          </Select>
        </Field>
        <Field label="Função">
          <Input value={form.employee_role} onChange={e => patch({ employee_role: e.target.value })} placeholder="Função automática" disabled={isLocked} />
        </Field>

        <Field label="Contrato *">
          <Select value={form.contract_id} onChange={v => patch({ contract_id: v })} placeholder="Selecionar contrato...">
            {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Atividade">
          <Select value={form.activity_id} onChange={v => patch({ activity_id: v })} placeholder="Selecionar atividade...">
            {activities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </Select>
        </Field>

        <Field label="Área">
          <Select value={form.area_id} onChange={v => patch({ area_id: v })} placeholder="Selecionar área...">
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        <Field label="Local / Seção">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#718096' }} />
            <Input placeholder="Ex: Fachada Norte — 8º andar" value={form.location} onChange={e => patch({ location: e.target.value })} className="pl-9" disabled={isLocked} />
          </div>
        </Field>
      </div>

      <Field label="Condição Inicial do Local">
        <textarea className="w-full rounded-xl px-3 py-2 text-sm resize-none" rows={2}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
          placeholder="Descreva o estado inicial do local antes da atividade..."
          value={form.initial_condition} onChange={e => patch({ initial_condition: e.target.value })} disabled={isLocked} />
      </Field>

      <Field label="Observação Inicial">
        <textarea className="w-full rounded-xl px-3 py-2 text-sm resize-none" rows={2}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff' }}
          placeholder="Riscos identificados, condições especiais..."
          value={form.initial_observation} onChange={e => patch({ initial_observation: e.target.value })} disabled={isLocked} />
      </Field>

      {form.employee_id && (
        <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(20,184,212,0.06)', border: '1px solid rgba(20,184,212,0.18)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,212,0.15)', border: '1px solid rgba(20,184,212,0.30)' }}>
            <User className="w-4 h-4" style={{ color: '#14B8D4' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{form.employee_name}</p>
            <p className="text-xs" style={{ color: '#14B8D4' }}>{form.employee_role}</p>
          </div>
        </div>
      )}
    </div>
  );
}
