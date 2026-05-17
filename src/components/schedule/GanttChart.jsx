import React, { useMemo, useRef, useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import {
  format, differenceInDays, addDays,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  eachDayOfInterval, eachWeekOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG = {
  not_started: { color: '#6b7280', bg: '#6b728022', label: 'Não Iniciado' },
  in_progress:  { color: '#3b82f6', bg: '#3b82f622', label: 'Em Andamento' },
  delayed:      { color: '#ef4444', bg: '#ef444422', label: 'Atrasado'     },
  completed:    { color: '#22c55e', bg: '#22c55e22', label: 'Concluído'    },
};

const COL_MIN_PX = 38; // px mínimo por coluna

function parseD(d) { return new Date(d + 'T00:00:00'); }
function fmtDate(d) { return format(d, 'dd/MM', { locale: ptBR }); }

export default function GanttChart({ activities, teams, areas, view, onEditActivity, onDatesChange }) {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(null); // { id, type:'move'|'resize', startX, origStart, origEnd }
  const [ghostDates, setGhostDates] = useState({}); // { [id]: { start_date, end_date } }

  const { timeRange, columns } = useMemo(() => {
    const today = new Date();
    if (activities.length === 0) {
      const start = view === 'week' ? startOfWeek(today, { weekStartsOn: 1 }) : startOfMonth(today);
      const end   = view === 'week' ? endOfWeek(today, { weekStartsOn: 1 })   : endOfMonth(today);
      const cols  = view === 'week' ? eachDayOfInterval({ start, end }) : eachWeekOfInterval({ start, end });
      return { timeRange: { start, end }, columns: cols };
    }

    const dates = activities
      .flatMap(a => [a.start_date, a.end_date].filter(Boolean))
      .map(parseD);
    const raw_min = new Date(Math.min(...dates));
    const raw_max = new Date(Math.max(...dates));

    // pad a little
    const minDate = addDays(raw_min, -3);
    const maxDate = addDays(raw_max, 3);

    const start = view === 'week'
      ? startOfWeek(minDate, { weekStartsOn: 1 })
      : startOfMonth(minDate);
    const end = view === 'week'
      ? endOfWeek(maxDate, { weekStartsOn: 1 })
      : endOfMonth(maxDate);

    const cols = view === 'week'
      ? eachDayOfInterval({ start, end })
      : view === 'month'
        ? eachWeekOfInterval({ start, end })
        : eachDayOfInterval({ start, end });

    return { timeRange: { start, end }, columns: cols };
  }, [activities, view]);

  const totalDays = differenceInDays(timeRange.end, timeRange.start) || 1;

  // Convert pixel delta to days based on container width
  const pxToDays = useCallback((px) => {
    if (!containerRef.current) return 0;
    const timelineW = containerRef.current.getBoundingClientRect().width - 288; // minus label col
    return Math.round((px / timelineW) * totalDays);
  }, [totalDays]);

  const getBarStyle = useCallback((startDate, endDate) => {
    if (!startDate || !endDate) return { left: '0%', width: '0%' };
    const startOffset = Math.max(0, differenceInDays(parseD(startDate), timeRange.start));
    const duration    = Math.max(1, differenceInDays(parseD(endDate), parseD(startDate)) + 1);
    const left  = (startOffset / totalDays) * 100;
    const width = (duration  / totalDays) * 100;
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  }, [timeRange, totalDays]);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e, activity, type) => {
    e.preventDefault();
    setDragging({
      id: activity.id,
      type,
      startX: e.clientX,
      origStart: activity.start_date,
      origEnd:   activity.end_date,
    });

    const onMove = (ev) => {
      const delta = pxToDays(ev.clientX - e.clientX);
      setGhostDates(prev => {
        const orig = { start_date: activity.start_date, end_date: activity.end_date };
        if (type === 'move') {
          return {
            ...prev,
            [activity.id]: {
              start_date: format(addDays(parseD(orig.start_date), delta), 'yyyy-MM-dd'),
              end_date:   format(addDays(parseD(orig.end_date),   delta), 'yyyy-MM-dd'),
            },
          };
        } else { // resize (right edge)
          const newEnd = format(addDays(parseD(orig.end_date), delta), 'yyyy-MM-dd');
          if (newEnd >= orig.start_date) {
            return { ...prev, [activity.id]: { start_date: orig.start_date, end_date: newEnd } };
          }
          return prev;
        }
      });
    };

    const onUp = () => {
      setGhostDates(prev => {
        const updated = prev[activity.id];
        if (updated && onDatesChange) {
          onDatesChange(activity.id, updated.start_date, updated.end_date);
        }
        const next = { ...prev };
        delete next[activity.id];
        return next;
      });
      setDragging(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pxToDays, onDatesChange]);

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Card className="border-border/50 overflow-hidden select-none">
      {activities.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          Nenhuma atividade encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto" ref={containerRef}>
          <div style={{ minWidth: `${288 + columns.length * COL_MIN_PX}px` }}>

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex border-b border-border sticky top-0 bg-card z-10">
              <div className="w-72 shrink-0 px-3 py-2 border-r border-border flex items-center">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Atividade</span>
              </div>
              <div className="flex-1 flex">
                {columns.map((col, i) => {
                  const isToday = format(col, 'yyyy-MM-dd') === today;
                  return (
                    <div key={i} className={`flex-1 py-2 text-center border-r border-border/30 ${isToday ? 'bg-primary/10' : ''}`} style={{ minWidth: COL_MIN_PX }}>
                      <span className={`text-[10px] font-medium ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                        {view === 'week'
                          ? format(col, 'EEE\ndd', { locale: ptBR })
                          : format(col, 'dd/MM', { locale: ptBR })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Legend ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-4 px-3 py-1.5 border-b border-border/30 bg-muted/20">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: v.color }} />
                  <span className="text-[10px] text-muted-foreground">{v.label}</span>
                </div>
              ))}
            </div>

            {/* ── Rows ────────────────────────────────────────────────── */}
            {activities.map((activity) => {
              const ghost = ghostDates[activity.id];
              const sd = ghost?.start_date || activity.start_date;
              const ed = ghost?.end_date   || activity.end_date;
              const barStyle = getBarStyle(sd, ed);
              const cfg = STATUS_CONFIG[activity.status] || STATUS_CONFIG.not_started;
              const prog = activity.progress || 0;
              const isDragging = dragging?.id === activity.id;

              return (
                <div key={activity.id} className={`flex border-b border-border/20 group transition-colors ${isDragging ? 'bg-muted/40' : 'hover:bg-muted/20'}`} style={{ minHeight: 52 }}>

                  {/* Label col */}
                  <div className="w-72 shrink-0 px-3 py-2 border-r border-border flex flex-col justify-center gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                      <p className="text-xs font-medium text-foreground truncate flex-1">{activity.title}</p>
                      {onEditActivity && (
                        <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0" onClick={() => onEditActivity(activity)}>
                          <Pencil className="w-2.5 h-2.5" />
                        </Button>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {teams.find(t => t.id === activity.team_id)?.name || '-'} · {areas.find(a => a.id === activity.area_id)?.name || '-'}
                    </div>
                    {/* Progress bar in label */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, backgroundColor: cfg.color }} />
                      </div>
                      <span className="text-[10px] font-semibold shrink-0" style={{ color: cfg.color }}>{prog}%</span>
                    </div>
                  </div>

                  {/* Timeline col */}
                  <div className="flex-1 relative">
                    {/* Today line */}
                    {(() => {
                      const todayOffset = differenceInDays(new Date(), timeRange.start);
                      const todayPct = (todayOffset / totalDays) * 100;
                      if (todayPct < 0 || todayPct > 100) return null;
                      return <div className="absolute inset-y-0 w-px bg-primary/40 z-10 pointer-events-none" style={{ left: `${todayPct}%` }} />;
                    })()}

                    {/* Gantt bar */}
                    {sd && ed && (
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 h-8 rounded flex items-center overflow-hidden z-20 ${isDragging ? 'opacity-80 ring-2 ring-primary/50' : 'cursor-grab active:cursor-grabbing'}`}
                        style={{
                          ...barStyle,
                          backgroundColor: cfg.bg,
                          border: `1.5px solid ${cfg.color}`,
                        }}
                        onMouseDown={(e) => onMouseDown(e, { ...activity, start_date: activity.start_date, end_date: activity.end_date }, 'move')}
                      >
                        {/* Progress fill inside bar */}
                        <div
                          className="absolute inset-y-0 left-0 opacity-40 rounded-l pointer-events-none"
                          style={{ width: `${prog}%`, backgroundColor: cfg.color }}
                        />

                        {/* Label inside bar */}
                        <div className="relative z-10 px-2 flex items-center justify-between w-full min-w-0">
                          <span className="text-[10px] font-semibold truncate" style={{ color: cfg.color }}>
                            {sd ? fmtDate(parseD(sd)) : ''} → {ed ? fmtDate(parseD(ed)) : ''}
                          </span>
                          <span className="text-[10px] font-bold ml-1 shrink-0" style={{ color: cfg.color }}>{prog}%</span>
                        </div>

                        {/* Resize handle (right edge) */}
                        <div
                          className="absolute right-0 top-0 h-full w-2.5 cursor-ew-resize z-30 flex items-center justify-center"
                          style={{ backgroundColor: cfg.color + '33' }}
                          onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, { ...activity, start_date: activity.start_date, end_date: activity.end_date }, 'resize'); }}
                        >
                          <div className="w-0.5 h-4 rounded-full" style={{ backgroundColor: cfg.color }} />
                        </div>
                      </div>
                    )}

                    {/* No dates placeholder */}
                    {(!sd || !ed) && (
                      <div className="absolute inset-0 flex items-center px-3">
                        <span className="text-[10px] text-muted-foreground/50 italic">sem datas</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}