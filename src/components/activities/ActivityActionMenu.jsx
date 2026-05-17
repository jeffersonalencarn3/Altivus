/**
 * ActivityActionMenu — menu ⋮ com RBAC real
 * Ações: editar, duplicar, reprogramar, arquivar, excluir
 */
import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit2, Copy, Calendar, Archive, Trash2, RotateCcw } from 'lucide-react';
import { usePermissions } from '@/lib/usePermissions';

export default function ActivityActionMenu({ activity, onEdit, onDuplicate, onReschedule, onArchive, onDelete, onRestore }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { canEditActivity, canDeleteActivity, canCreateActivity } = usePermissions();

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isArchived = activity.status === 'archived';

  // Nenhuma ação disponível para visualizador
  const hasAnyAction = canEditActivity || canDeleteActivity || canCreateActivity;
  if (!hasAnyAction) return null;

  const items = [
    canEditActivity && !isArchived && {
      icon: Edit2, label: 'Editar', color: '#14B8D4',
      action: () => { setOpen(false); onEdit?.(activity); }
    },
    canCreateActivity && !isArchived && {
      icon: Copy, label: 'Duplicar', color: '#6D56E8',
      action: () => { setOpen(false); onDuplicate?.(activity); }
    },
    canEditActivity && !isArchived && {
      icon: Calendar, label: 'Reprogramar', color: '#E87D00',
      action: () => { setOpen(false); onReschedule?.(activity); }
    },
    canDeleteActivity && !isArchived && {
      icon: Archive, label: 'Arquivar', color: '#718096',
      action: () => { setOpen(false); onArchive?.(activity); }
    },
    isArchived && canDeleteActivity && {
      icon: RotateCcw, label: 'Restaurar', color: '#00D99A',
      action: () => { setOpen(false); onRestore?.(activity); }
    },
    canDeleteActivity && {
      icon: Trash2, label: 'Excluir', color: '#FC5252',
      action: () => { setOpen(false); onDelete?.(activity); },
      danger: true,
    },
  ].filter(Boolean);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200"
        style={{
          background: open ? 'rgba(20,184,212,0.12)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(20,184,212,0.3)' : 'rgba(255,255,255,0.08)'}`,
          color: open ? '#14B8D4' : '#718096',
        }}
        title="Ações"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-[200] min-w-[160px] rounded-xl overflow-hidden"
          style={{
            background: 'rgba(8,14,28,0.98)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-all duration-150 text-left"
              style={{ color: item.color }}
              onMouseEnter={e => { e.currentTarget.style.background = `${item.color}10`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}