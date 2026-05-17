import React, { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import AppointmentList from '@/components/appointments/AppointmentList';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import AppointmentDetail from '@/components/appointments/AppointmentDetail';
import AppointmentApproval from '@/components/appointments/AppointmentApproval';
import AppointmentDashboard from '@/components/appointments/AppointmentDashboard';
import { Button } from '@/components/ui/button';
import { Plus, BarChart2, CheckCircle2, List } from 'lucide-react';

const TABS = [
  { id: 'list',      label: '📋 Apontamentos' },
  { id: 'approval',  label: '✅ Aprovações' },
  { id: 'dashboard', label: '📊 Inteligência' },
];

export default function FieldLog() {
  const [view, setView]         = useState('list');
  const [editing, setEditing]   = useState(null);
  const [detail, setDetail]     = useState(null);

  const isMain = view !== 'form';

  const handleNew  = () => { setEditing(null); setView('form'); };
  const handleEdit = (a)  => { setEditing(a);   setView('form'); };
  const handleBack = ()   => { setEditing(null); setDetail(null); setView('list'); };

  if (detail) return (
    <div>
      <PageHeader title="Registro de Campo" subtitle="Detalhes do Apontamento">
        <Button variant="outline" size="sm" onClick={() => setDetail(null)} className="gap-1.5">
          <List className="w-4 h-4" /> Voltar à lista
        </Button>
      </PageHeader>
      <AppointmentDetail appointment={detail} onBack={() => setDetail(null)} onEdit={() => { setEditing(detail); setDetail(null); setView('form'); }} />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Registro de Campo Inteligente"
        subtitle="Apontamento Diário por Colaborador — Evidências, Reporte e Aprovação"
      >
        {isMain && (
          <>
            <Button variant={view === 'approval' ? 'default' : 'outline'} size="sm" onClick={() => setView('approval')} className="gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Aprovações
            </Button>
            <Button variant={view === 'dashboard' ? 'default' : 'outline'} size="sm" onClick={() => setView(v => v === 'dashboard' ? 'list' : 'dashboard')} className="gap-1.5">
              <BarChart2 className="w-4 h-4" /> Inteligência
            </Button>
            <Button size="sm" onClick={handleNew} className="gap-1.5">
              <Plus className="w-4 h-4" /> Novo Apontamento
            </Button>
          </>
        )}
        {view === 'form' && (
          <Button variant="outline" size="sm" onClick={handleBack} className="gap-1.5">
            <List className="w-4 h-4" /> Ver Todos
          </Button>
        )}
      </PageHeader>

      {isMain && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={view === t.id
                ? { background: 'rgba(20,184,212,0.15)', border: '1px solid rgba(20,184,212,0.35)', color: '#14B8D4' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#718096' }}
            >{t.label}</button>
          ))}
        </div>
      )}

      {view === 'list'     && <AppointmentList onNew={handleNew} onEdit={handleEdit} onDetail={setDetail} />}
      {view === 'form'     && <AppointmentForm appointment={editing} onSaved={handleBack} onCancel={handleBack} />}
      {view === 'approval' && <AppointmentApproval />}
      {view === 'dashboard'&& <AppointmentDashboard />}
    </div>
  );
}