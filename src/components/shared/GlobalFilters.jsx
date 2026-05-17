import React, { memo, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Filter, X } from 'lucide-react';

function GlobalFilters({ filters, onChange, teams = [], contracts = [], areas = [], serviceTypes: _serviceTypes = [] }) {
  const updateFilter = useCallback((key, value) => {
    onChange({ ...filters, [key]: value });
  }, [filters, onChange]);

  const clearFilters = useCallback(() => {
    onChange({ period_start: '', period_end: '', team_id: 'all', contract_id: 'all', area_id: 'all', service_type_id: 'all' });
  }, [onChange]);

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all');

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-2xl mb-5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center gap-1.5 mr-1">
        <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: '#00D4FF' }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Filtros</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Input
          type="date"
          value={filters.period_start || ''}
          onChange={(e) => updateFilter('period_start', e.target.value)}
          className="w-36 h-8 text-xs"
        />
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>→</span>
        <Input
          type="date"
          value={filters.period_end || ''}
          onChange={(e) => updateFilter('period_end', e.target.value)}
          className="w-36 h-8 text-xs"
        />
      </div>

      {teams.length > 0 && (
        <Select value={filters.team_id || 'all'} onValueChange={(v) => updateFilter('team_id', v)}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Todas Equipes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Equipes</SelectItem>
            {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {contracts.length > 0 && (
        <Select value={filters.contract_id || 'all'} onValueChange={(v) => updateFilter('contract_id', v)}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Todos Contratos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Contratos</SelectItem>
            {contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {areas.length > 0 && (
        <Select value={filters.area_id || 'all'} onValueChange={(v) => updateFilter('area_id', v)}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Todas Áreas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Áreas</SelectItem>
            {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ml-auto"
          style={{ color: '#FF4444', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.18)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.08)'; }}
        >
          <X className="w-3 h-3" /> Limpar filtros
        </button>
      )}
    </div>
  );
}

export default memo(GlobalFilters);
