import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export default function ExecutionTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setElapsed(diff > 0 ? diff : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = n => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
      style={{ background: 'rgba(20,184,212,0.08)', border: '1px solid rgba(20,184,212,0.22)' }}>
      <Clock className="w-3.5 h-3.5 animate-pulse" style={{ color: '#14B8D4' }} />
      <span className="font-mono text-sm font-bold" style={{ color: '#14B8D4' }}>
        {pad(h)}:{pad(m)}:{pad(s)}
      </span>
      <span className="text-[10px]" style={{ color: '#718096' }}>em execução</span>
    </div>
  );
}