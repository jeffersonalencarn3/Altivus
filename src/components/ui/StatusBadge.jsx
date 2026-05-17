import React from 'react';

const STATUS_CONFIG = {
  // Activity statuses
  not_started:  { label: 'Não iniciado', color: '#718096', dot: true },
  in_progress:  { label: 'Em andamento', color: '#14B8D4', dot: true, pulse: true },
  delayed:      { label: 'Atrasado',     color: '#FC5252', dot: true, pulse: true },
  completed:    { label: 'Concluído',    color: '#00D99A', dot: true },
  // Contract statuses
  active:       { label: 'Ativo',        color: '#00D99A', dot: true },
  suspended:    { label: 'Suspenso',     color: '#E87D00', dot: true },
  cancelled:    { label: 'Cancelado',    color: '#FC5252', dot: true },
  // Session statuses
  em_execucao:  { label: 'Em execução',  color: '#00D99A', dot: true, pulse: true },
  finalizado:   { label: 'Finalizado',   color: '#718096', dot: true },
  // Approval
  pending:      { label: 'Pendente',     color: '#E87D00', dot: true },
  approved:     { label: 'Aprovado',     color: '#00D99A', dot: true },
  rejected:     { label: 'Reprovado',    color: '#FC5252', dot: true },
  // Priority
  low:          { label: 'Baixa',        color: '#718096' },
  medium:       { label: 'Média',        color: '#14B8D4' },
  high:         { label: 'Alta',         color: '#E87D00' },
  critical:     { label: 'Crítica',      color: '#FC5252', pulse: true },
};

export default function StatusBadge({ status, customLabel, customColor, size = 'sm', showDot = true }) {
  const config = STATUS_CONFIG[status] || { label: status || '—', color: '#718096' };
  const color = customColor || config.color;
  const label = customLabel || config.label;
  const pulse = config.pulse;

  const px = size === 'xs' ? '6px 8px' : size === 'sm' ? '4px 10px' : '6px 14px';
  const fontSize = size === 'xs' ? 9 : size === 'sm' ? 10 : 11;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider"
      style={{
        padding: px,
        fontSize,
        background: `${color}12`,
        border: `1px solid ${color}30`,
        color,
        letterSpacing: '0.05em',
      }}
    >
      {showDot && config.dot && (
        <span
          className="rounded-full shrink-0"
          style={{
            width: 5, height: 5,
            background: color,
            boxShadow: `0 0 4px ${color}`,
            animation: pulse ? 'neonPulse 1.6s ease-in-out infinite' : 'none',
          }}
        />
      )}
      {label}
    </span>
  );
}