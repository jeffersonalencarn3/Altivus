/**
 * Painel de Saúde Operacional Enterprise
 * KPIs de equipamentos, inspeções pendentes, exposição química
 */
import React, { useMemo } from 'react';
import { useAllEquipments, useInspections, useEmployees } from '@/lib/useAppData';
import { differenceInDays } from 'date-fns';
import { Shield, Package, AlertTriangle, FlaskConical, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OperationalHealthPanel() {
  const { data: equipments = [] } = useAllEquipments();
  const { data: _inspections = [] } = useInspections();
  const { data: employees = [] } = useEmployees();

  const metrics = useMemo(() => {
    const blocked = equipments.filter(e => e.status === 'bloqueado').length;
    const revisaoN3 = equipments.filter(e => e.status === 'revisao_n3').length;
    const expiring = equipments.filter(e => {
      if (!e.expiry_date) return false;
      const d = differenceInDays(new Date(e.expiry_date), new Date());
      return d >= 0 && d <= 30;
    }).length;
    const expired = equipments.filter(e => {
      if (!e.expiry_date) return false;
      return differenceInDays(new Date(e.expiry_date), new Date()) < 0;
    }).length;

    const inspPending = equipments.filter(e => {
      if (!e.next_inspection_date) return false;
      return differenceInDays(new Date(e.next_inspection_date), new Date()) <= 0;
    }).length;

    const chemicalExposures = equipments.reduce((s, e) => s + (e.chemical_exposure_count || 0), 0);
    const highRiskEq = equipments.filter(e => (e.chemical_exposure_count || 0) >= 5).length;

    // Colaboradores com certs vencidas
    const empCertExpired = employees.filter(emp => {
      const certs = emp.certifications;
      if (!Array.isArray(certs)) return false;
      return certs.some(c => c.expiry_date && new Date(c.expiry_date) < new Date());
    }).length;

    const avgScore = equipments.length > 0
      ? Math.round(equipments.reduce((s, e) => s + (e.operational_score ?? 100), 0) / equipments.length)
      : 100;

    return { blocked, revisaoN3, expiring, expired, inspPending, chemicalExposures, highRiskEq, empCertExpired, avgScore };
  }, [equipments, employees]);

  const totalAlerts = metrics.blocked + metrics.revisaoN3 + metrics.expired + metrics.inspPending + metrics.empCertExpired;

  if (equipments.length === 0 && employees.length === 0) return null;

  const cards = [
    {
      label: 'Score Médio Equipamentos', value: `${metrics.avgScore}`, suffix: '/100',
      color: metrics.avgScore >= 80 ? '#00D99A' : metrics.avgScore >= 60 ? '#E87D00' : '#FC5252',
      icon: Package, sub: `${equipments.length} equipamentos`
    },
    {
      label: 'Inspeções Pendentes', value: metrics.inspPending, color: metrics.inspPending > 0 ? '#E87D00' : '#00D99A',
      icon: Clock, sub: 'vencidas ou no prazo',
      urgent: metrics.inspPending > 0,
    },
    {
      label: 'Equipamentos Críticos', value: metrics.blocked + metrics.revisaoN3, color: (metrics.blocked + metrics.revisaoN3) > 0 ? '#FC5252' : '#00D99A',
      icon: Shield, sub: `${metrics.blocked} bloqueados · ${metrics.revisaoN3} Rev. N3`,
      urgent: metrics.blocked > 0,
    },
    {
      label: 'Exposição Química', value: metrics.chemicalExposures, color: metrics.chemicalExposures > 0 ? '#E87D00' : '#4A5568',
      icon: FlaskConical, sub: `${metrics.highRiskEq} equip. alta exposição`,
    },
    {
      label: 'Certs. Vencidas', value: metrics.empCertExpired, color: metrics.empCertExpired > 0 ? '#FC5252' : '#00D99A',
      icon: AlertTriangle, sub: 'colaboradores',
      urgent: metrics.empCertExpired > 0,
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(10,16,32,0.96), rgba(6,10,22,0.98))',
        border: `1px solid ${totalAlerts > 0 ? 'rgba(252,82,82,0.2)' : 'rgba(0,217,154,0.15)'}`,
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full"
            style={{ background: totalAlerts > 0 ? '#FC5252' : '#00D99A', boxShadow: `0 0 8px ${totalAlerts > 0 ? '#FC5252' : '#00D99A'}60` }} />
          <span className="text-sm font-bold text-white">Saúde Operacional Enterprise</span>
          {totalAlerts > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(252,82,82,0.12)', color: '#FC5252', border: '1px solid rgba(252,82,82,0.3)' }}>
              {totalAlerts} alerta{totalAlerts > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Link to="/teams" className="flex items-center gap-1 text-[11px] font-semibold hover:opacity-70 transition-opacity"
          style={{ color: '#14B8D4' }}>
          Ver equipes <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Cards grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl p-3 relative overflow-hidden"
              style={{
                background: card.urgent ? `${card.color}08` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${card.urgent ? card.color + '30' : 'rgba(255,255,255,0.06)'}`,
              }}>
              {card.urgent && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: card.color }} />
              )}
              <Icon className="w-4 h-4 mb-1.5" style={{ color: card.color }} />
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-black" style={{ color: card.color }}>{card.value}</span>
                {card.suffix && <span className="text-xs" style={{ color: card.color + '80' }}>{card.suffix}</span>}
              </div>
              <p className="text-[10px] font-bold mt-0.5 text-white/70 leading-tight">{card.label}</p>
              <p className="text-[9px] mt-0.5" style={{ color: '#4A5568' }}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Alert banner */}
      {(metrics.blocked > 0 || metrics.expired > 0) && (
        <div className="mx-4 mb-4 rounded-xl p-3 flex items-center gap-2"
          style={{ background: 'rgba(252,82,82,0.08)', border: '1px solid rgba(252,82,82,0.2)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#FC5252' }} />
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {metrics.blocked > 0 && <span className="font-bold text-red-400">{metrics.blocked} equipamento(s) bloqueado(s)</span>}
            {metrics.blocked > 0 && metrics.expired > 0 && ' · '}
            {metrics.expired > 0 && <span>{metrics.expired} equipamento(s) com validade vencida</span>}
            {' — Recomenda-se avaliação do Supervisor N3.'}
          </p>
        </div>
      )}

      {/* Legal notice */}
      <div className="px-5 pb-3.5 flex items-center gap-1.5">
        <Shield className="w-3 h-3 shrink-0" style={{ color: '#4A5568' }} />
        <p className="text-[9px]" style={{ color: '#4A5568' }}>
          A IA auxilia tecnicamente e não substitui inspeção formal, fabricante, Supervisor N3 ou responsável técnico.
        </p>
      </div>
    </div>
  );
}
