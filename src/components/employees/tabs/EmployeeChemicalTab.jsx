import React, { useMemo } from 'react';
import { FlaskConical, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CHEMICAL_RISK = {
  'Metasil': { risk: 'medio', desc: 'Silicone concentrado — monitorar desgaste da capa externa das cordas' },
  'Detergente Alcalino': { risk: 'baixo', desc: 'Solução alcalina — enxaguar bem os equipamentos têxteis' },
  'Detergente Ácido': { risk: 'alto', desc: 'ÁCIDO — realizar inspeção detalhada imediatamente após exposição' },
  'Ácido': { risk: 'alto', desc: 'Produto ácido — inspeção obrigatória antes de novo uso' },
  'Solvente': { risk: 'alto', desc: 'Solvente — pode degradar materiais têxteis e poliméricos' },
  'Desengraxante': { risk: 'medio', desc: 'Desengraxante — verificar conectores e peças metálicas' },
};

const RISK_CFG = {
  alto: { label: 'Alto Risco', color: '#FC5252', bg: 'rgba(252,82,82,0.10)' },
  medio: { label: 'Risco Médio', color: '#E87D00', bg: 'rgba(232,125,0,0.10)' },
  baixo: { label: 'Baixo Risco', color: '#00D99A', bg: 'rgba(0,217,154,0.10)' },
};

export default function EmployeeChemicalTab({ employee: _employee, equipments, inspections }) {
  // Coleta exposições dos equipamentos e inspeções
  const allExposures = useMemo(() => {
    const list = [];
    equipments.forEach(eq => {
      (eq.chemical_exposures || []).forEach(exp => {
        list.push({ ...exp, equipment_tag: eq.tag, equipment_name: eq.name });
      });
    });
    inspections.filter(i => i.chemical_exposure && i.chemical_products).forEach(insp => {
      const eq = equipments.find(e => e.id === insp.equipment_id);
      list.push({
        date: insp.date,
        product: insp.chemical_products,
        equipment_tag: eq?.tag,
        equipment_name: eq?.name,
        notes: `Registrado na inspeção ${insp.type}`,
      });
    });
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [equipments, inspections]);

  const totalChemical = equipments.reduce((s, eq) => s + (eq.chemical_exposure_count || 0), 0);
  const highRiskEqs = equipments.filter(eq => (eq.chemical_exposure_count || 0) >= 5);

  const productSummary = useMemo(() => {
    const map = {};
    allExposures.forEach(exp => {
      const key = exp.product || 'Desconhecido';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [allExposures]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white">Exposição Química Operacional</h3>
        <p className="text-xs mt-0.5" style={{ color: '#718096' }}>Rastreabilidade de produtos químicos utilizados nas atividades</p>
      </div>

      {/* Aviso Legal */}
      <div className="rounded-xl p-3 flex items-start gap-2"
        style={{ background: 'rgba(109,86,232,0.06)', border: '1px solid rgba(109,86,232,0.15)' }}>
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#6D56E8' }} />
        <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          A IA auxilia no monitoramento de exposição química e <strong style={{ color: '#6D56E8' }}>não substitui</strong> inspeção formal. Equipamentos expostos a produtos ácidos ou solventes devem ser inspecionados pelo Supervisor N3 antes de novo uso.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xl font-black" style={{ color: '#E87D00' }}>{totalChemical}</p>
          <p className="text-[11px]" style={{ color: '#718096' }}>Exposições Totais</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xl font-black" style={{ color: '#FC5252' }}>{highRiskEqs.length}</p>
          <p className="text-[11px]" style={{ color: '#718096' }}>Equip. Alta Exposição</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xl font-black" style={{ color: '#14B8D4' }}>{allExposures.length}</p>
          <p className="text-[11px]" style={{ color: '#718096' }}>Registros</p>
        </div>
      </div>

      {/* Produtos mais utilizados */}
      {productSummary.length > 0 && (
        <div className="rounded-2xl p-4"
          style={{ background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#14B8D4' }}>
            <FlaskConical className="w-3.5 h-3.5" /> Produtos por Frequência
          </p>
          <div className="space-y-2">
            {productSummary.map(([product, count]) => {
              const key = Object.keys(CHEMICAL_RISK).find(k => product.toLowerCase().includes(k.toLowerCase()));
              const risk = key ? CHEMICAL_RISK[key] : { risk: 'baixo', desc: 'Monitorar conforme boas práticas operacionais' };
              const rcfg = RISK_CFG[risk.risk];
              return (
                <div key={product} className="flex items-start justify-between gap-3 p-3 rounded-xl"
                  style={{ background: rcfg.bg, border: `1px solid ${rcfg.color}20` }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-white">{product}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: rcfg.bg, color: rcfg.color }}>{rcfg.label}</span>
                    </div>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{risk.desc}</p>
                  </div>
                  <div className="shrink-0 text-center">
                    <span className="text-base font-black" style={{ color: rcfg.color }}>{count}×</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Equipamentos com exposição */}
      {equipments.filter(eq => (eq.chemical_exposure_count || 0) > 0).length > 0 && (
        <div className="rounded-2xl p-4"
          style={{ background: 'linear-gradient(145deg,rgba(10,16,32,0.96),rgba(6,10,22,0.98))', border: '1px solid rgba(232,125,0,0.15)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#E87D00' }}>Equipamentos com Histórico Químico</p>
          <div className="space-y-2">
            {equipments
              .filter(eq => (eq.chemical_exposure_count || 0) > 0)
              .sort((a, b) => (b.chemical_exposure_count || 0) - (a.chemical_exposure_count || 0))
              .map(eq => (
                <div key={eq.id} className="flex items-center justify-between p-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span className="text-xs font-bold text-white">{eq.tag} — {eq.name}</span>
                    <p className="text-[10px] mt-0.5" style={{ color: '#718096' }}>{eq.chemical_exposure_count} exposição(ões)</p>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-black" style={{ color: (eq.chemical_exposure_count || 0) >= 5 ? '#FC5252' : '#E87D00' }}>
                      {eq.operational_score ?? 100}
                    </span>
                    <p className="text-[8px]" style={{ color: '#4A5568' }}>SCORE</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Histórico de exposições */}
      {allExposures.length === 0 ? (
        <div className="py-12 text-center rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-white/30">Nenhuma exposição química registrada</p>
          <p className="text-xs mt-1" style={{ color: '#718096' }}>Exposições são registradas automaticamente ao preencher inspeções ou checklists</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#718096' }}>Histórico de Registros</p>
          {allExposures.map((exp, i) => (
            <div key={i} className="rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{exp.product || 'Produto não especificado'}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#718096' }}>
                    {exp.date ? format(new Date(exp.date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR }) : '—'}
                    {exp.equipment_tag ? ` · ${exp.equipment_tag} — ${exp.equipment_name}` : ''}
                  </p>
                  {exp.notes && <p className="text-[10px] mt-0.5 italic" style={{ color: '#4A5568' }}>{exp.notes}</p>}
                </div>
                <FlaskConical className="w-4 h-4 shrink-0" style={{ color: '#E87D00' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
