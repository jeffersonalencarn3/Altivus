import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/useWorkspace';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { Input } from '@/components/ui/input';
import { MapPin, Clock, Sun, Cloud, Wind, CloudRain, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';

const WEATHER_OPTIONS = [
  { value: 'sunny',     label: 'Ensolarado',  icon: Sun,          color: '#FBBF24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.28)'  },
  { value: 'cloudy',    label: 'Nublado',     icon: Cloud,        color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.28)' },
  { value: 'windy',     label: 'Ventoso',     icon: Wind,         color: '#60A5FA', bg: 'rgba(96,165,250,0.10)',  border: 'rgba(96,165,250,0.28)'  },
  { value: 'rain',      label: 'Chuva',       icon: CloudRain,    color: '#38BDF8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.28)'  },
  { value: 'high_risk', label: 'Alto Risco',  icon: AlertTriangle,color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.35)' },
];

const SAFETY_CHECKS = [
  { key: 'nr35_completed',   label: 'Checklist NR-35 concluído',     icon: '📋' },
  { key: 'anchor_verified',  label: 'Pontos de ancoragem verificados', icon: '⚓' },
  { key: 'ppe_inspected',    label: 'EPIs inspecionados e aprovados',  icon: '🦺' },
];

export default function StepWorkdayStart({ form, patch }) {
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();
  const enabled = !!workspaceId;
  const { data: contracts = [] } = useQuery({ queryKey: ['contracts', workspaceId], queryFn: () => db.Contract.list(), enabled });
  const { data: teams = [] } = useQuery({ queryKey: ['teams', workspaceId], queryFn: () => db.Team.list(), enabled });
  const { data: activities = [] } = useQuery({ queryKey: ['activities', workspaceId], queryFn: () => db.Activity.list(), enabled });

  // Auto timestamp on mount if empty
  useEffect(() => {
    if (!form.start_time) {
      const now = new Date();
      patch({ start_time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}` });
    }
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      patch({ geolocation: `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}` });
    });
  };

  const safetyDone = SAFETY_CHECKS.every(c => form[c.key]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🌅</span>
        <div>
          <h2 className="text-white font-bold text-lg">Início do Dia de Campo</h2>
          <p className="text-xs" style={{ color: '#718096' }}>Registre as condições iniciais antes de começar</p>
        </div>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#A0AEC0' }}>Data</label>
          <Input type="date" value={form.date} onChange={e => patch({ date: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#A0AEC0' }}>Horário de Início</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#14B8D4' }} />
            <Input type="time" value={form.start_time} onChange={e => patch({ start_time: e.target.value })} className="pl-9" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#A0AEC0' }}>Contrato</label>
          <select
            className="w-full h-9 rounded-xl px-3 text-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#FFFFFF' }}
            value={form.contract_id}
            onChange={e => patch({ contract_id: e.target.value })}
          >
            <option value="">Selecionar contrato...</option>
            {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#A0AEC0' }}>Equipe</label>
          <select
            className="w-full h-9 rounded-xl px-3 text-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#FFFFFF' }}
            value={form.team_id}
            onChange={e => patch({ team_id: e.target.value })}
          >
            <option value="">Selecionar equipe...</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#A0AEC0' }}>Atividade Principal</label>
          <select
            className="w-full h-9 rounded-xl px-3 text-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#FFFFFF' }}
            value={form.activity_id}
            onChange={e => patch({ activity_id: e.target.value })}
          >
            <option value="">Selecionar atividade...</option>
            {activities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#A0AEC0' }}>Seção / Localização</label>
          <Input placeholder="Ex: Fachada Norte – 8º andar" value={form.location} onChange={e => patch({ location: e.target.value })} />
        </div>
      </div>

      {/* Geolocation */}
      <div
        className="flex items-center justify-between p-3 rounded-xl"
        style={{ background: 'rgba(20,184,212,0.06)', border: '1px solid rgba(20,184,212,0.14)' }}
      >
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4" style={{ color: '#14B8D4' }} />
          <span style={{ color: '#A0AEC0' }}>
            {form.geolocation ? `📍 ${form.geolocation}` : 'Geolocalização não capturada'}
          </span>
        </div>
        <button
          onClick={getLocation}
          className="text-xs font-semibold px-3 py-1 rounded-lg transition-all duration-150"
          style={{ background: 'rgba(20,184,212,0.12)', border: '1px solid rgba(20,184,212,0.25)', color: '#14B8D4' }}
        >
          Capturar GPS
        </button>
      </div>

      {/* Weather */}
      <div>
        <label className="block text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: '#A0AEC0' }}>Condição Climática</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {WEATHER_OPTIONS.map(w => {
            const selected = form.weather === w.value;
            return (
              <button
                key={w.value}
                onClick={() => patch({ weather: w.value, weather_impact: w.value === 'rain' || w.value === 'high_risk' })}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200"
                style={{
                  background: selected ? w.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected ? w.border : 'rgba(255,255,255,0.07)'}`,
                  transform: selected ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: selected ? `0 0 12px ${w.bg}` : 'none',
                }}
              >
                <w.icon className="w-5 h-5" style={{ color: selected ? w.color : '#4A5568' }} />
                <span className="text-[11px] font-semibold" style={{ color: selected ? w.color : '#4A5568' }}>{w.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Safety checks */}
      <div
        className="rounded-xl p-4"
        style={{
          background: safetyDone ? 'rgba(0,217,154,0.05)' : 'rgba(232,125,0,0.05)',
          border: `1px solid ${safetyDone ? 'rgba(0,217,154,0.18)' : 'rgba(232,125,0,0.18)'}`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4" style={{ color: safetyDone ? '#00D99A' : '#E87D00' }} />
          <span className="text-sm font-bold" style={{ color: safetyDone ? '#00D99A' : '#E87D00' }}>
            Confirmação de Segurança Obrigatória
          </span>
        </div>
        <div className="space-y-2">
          {SAFETY_CHECKS.map(c => (
            <label key={c.key} className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => patch({ [c.key]: !form[c.key] })}
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                style={{
                  background: form[c.key] ? 'rgba(0,217,154,0.20)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${form[c.key] ? 'rgba(0,217,154,0.50)' : 'rgba(255,255,255,0.12)'}`,
                  cursor: 'pointer',
                }}
              >
                {form[c.key] && <CheckCircle2 className="w-4 h-4" style={{ color: '#00D99A' }} />}
              </div>
              <span className="text-sm" style={{ color: form[c.key] ? '#E2E8F0' : '#718096' }}>
                {c.icon} {c.label}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => patch({ supervisor_confirmed: !form.supervisor_confirmed })}
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
              style={{
                background: form.supervisor_confirmed ? 'rgba(20,184,212,0.20)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${form.supervisor_confirmed ? 'rgba(20,184,212,0.50)' : 'rgba(255,255,255,0.12)'}`,
                cursor: 'pointer',
              }}
            >
              {form.supervisor_confirmed && <CheckCircle2 className="w-4 h-4" style={{ color: '#14B8D4' }} />}
            </div>
            <span className="text-sm font-semibold" style={{ color: form.supervisor_confirmed ? '#14B8D4' : '#718096' }}>
              ✅ Supervisor confirma condições seguras para início
            </span>
          </label>
        </div>
      </div>

      {/* Supervisor email */}
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#A0AEC0' }}>Supervisor Responsável (email)</label>
        <Input placeholder="supervisor@empresa.com" value={form.supervisor_id} onChange={e => patch({ supervisor_id: e.target.value })} />
      </div>
    </div>
  );
}
