import React from 'react';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG = {
  // Activity statuses
  not_started:  { label: 'Não Iniciado', color: 'rgba(255,255,255,0.5)',  bg: 'rgba(255,255,255,0.07)',  border: 'rgba(255,255,255,0.12)' },
  in_progress:  { label: 'Em Andamento', color: '#00D4FF',                bg: 'rgba(0,212,255,0.08)',    border: 'rgba(0,212,255,0.25)' },
  delayed:      { label: 'Atrasado',     color: '#FF4444',                bg: 'rgba(255,68,68,0.08)',    border: 'rgba(255,68,68,0.25)' },
  completed:    { label: 'Concluído',    color: '#00FFB2',                bg: 'rgba(0,255,178,0.08)',    border: 'rgba(0,255,178,0.25)' },
  // Contract statuses
  active:       { label: 'Ativo',        color: '#00FFB2',                bg: 'rgba(0,255,178,0.08)',    border: 'rgba(0,255,178,0.25)' },
  suspended:    { label: 'Suspenso',     color: '#FF8A00',                bg: 'rgba(255,138,0,0.08)',    border: 'rgba(255,138,0,0.25)' },
  cancelled:    { label: 'Cancelado',    color: '#FF4444',                bg: 'rgba(255,68,68,0.08)',    border: 'rgba(255,68,68,0.25)' },
  // Priority
  low:          { label: 'Baixa',        color: 'rgba(255,255,255,0.5)',  bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  medium:       { label: 'Média',        color: '#00D4FF',                bg: 'rgba(0,212,255,0.08)',   border: 'rgba(0,212,255,0.2)' },
  high:         { label: 'Alta',         color: '#FF8A00',                bg: 'rgba(255,138,0,0.08)',   border: 'rgba(255,138,0,0.2)' },
  critical:     { label: 'Crítico',      color: '#FF4444',                bg: 'rgba(255,68,68,0.08)',   border: 'rgba(255,68,68,0.2)' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wide"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}