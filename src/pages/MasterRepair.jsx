import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createAdminClient } from '@/lib/workspaceClient';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck, AlertTriangle, Database, RefreshCw, CheckCircle2,
  Lock, Wrench, Eye, ChevronDown, ChevronUp, Zap
} from 'lucide-react';

const ENTITY_NAMES = [
  'Activity', 'Team', 'Employee', 'Material', 'Contract',
  'Unit', 'Area', 'ServiceType', 'ActivityMaterial', 'ActivityEmployee',
  'FieldLog', 'ActivitySession', 'Appointment', 'MaterialMovement',
];

export default function MasterRepair() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const adminDb = createAdminClient();
  const isAdmin = user?.role === 'admin';

  const [auditResult, setAuditResult] = useState(null);
  const [repairResult, setRepairResult] = useState(null);
  const [expandedEntity, setExpandedEntity] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | auditing | audit_done | repairing | done
  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(false);

  // Busca o workspace do usuário logado (pode ser null = admin master sem ws)
  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces-all'],
    queryFn: () => adminDb.Workspace.list(),
    enabled: isAdmin,
  });

  // O workspace master é o primeiro cadastrado (ou o que pertence ao admin)
  const masterWorkspace = workspaces[0] || null;

  // Vincula o workspace master à conta do usuário logado
  const handleLinkWorkspace = async (wsId) => {
    setLinking(true);
    await base44.auth.updateMe({ workspace_id: wsId });
    setLinked(true);
    setLinking(false);
    setTimeout(() => window.location.reload(), 1000);
  };

  // ── AUDITORIA ──────────────────────────────────────────────────────────
  const auditMut = useMutation({
    mutationFn: async () => {
      setPhase('auditing');
      const res = await base44.functions.invoke('repairMasterWorkspace', {
        mode: 'audit',
        masterWorkspaceId: masterWorkspace?.id || null,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setAuditResult(data);
      setPhase('audit_done');
    },
    onError: () => setPhase('idle'),
  });

  // ── REPARO ─────────────────────────────────────────────────────────────
  const repairMut = useMutation({
    mutationFn: async () => {
      setPhase('repairing');
      const res = await base44.functions.invoke('repairMasterWorkspace', {
        mode: 'repair',
        masterWorkspaceId: masterWorkspace?.id || null,
        createMasterIfMissing: true, // Cria workspace master se não existir
      });
      return res.data;
    },
    onSuccess: (data) => {
      setRepairResult(data);
      setPhase('done');
      // Invalida todos os caches de dados operacionais
      qc.invalidateQueries();
    },
    onError: () => setPhase('audit_done'),
  });

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)' }}>
        <div className="text-center">
          <Lock className="w-10 h-10 mx-auto mb-3" style={{ color: '#4A5568' }} />
          <p className="text-white/50 text-sm">Acesso restrito a administradores.</p>
        </div>
      </div>
    );
  }

  const totalOrphans = auditResult?.summary?.totalOrphans ?? 0;
  const totalRepaired = repairResult?.summary?.totalRepaired ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reparo Master ALTIVUS"
        subtitle="Recupera dados órfãos e reconecta ao workspace master"
        accent="#E87D00"
      />

      {/* Status Banner */}
      <div className="rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(232,125,0,0.07), rgba(232,125,0,0.03))',
          border: '1px solid rgba(232,125,0,0.25)',
        }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(232,125,0,0.15)', border: '1px solid rgba(232,125,0,0.35)' }}>
            <AlertTriangle className="w-4 h-4" style={{ color: '#E87D00' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#E87D00' }}>Ferramenta de Recuperação de Dados</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Dados criados antes da implementação multi-tenant podem estar sem <code className="text-[#14B8D4]">workspace_id</code> e por isso ficam invisíveis.
              Esta ferramenta os encontra e os vincula automaticamente ao workspace master.
            </p>
            <p className="text-xs mt-1.5 font-semibold" style={{ color: 'rgba(255,255,255,0.30)' }}>
              ⚠ Nenhum dado é apagado. A operação é reversível.
            </p>
          </div>
        </div>
      </div>

      {/* Workspace info */}
      <div className="rounded-2xl p-4"
        style={{ background: 'rgba(20,184,212,0.05)', border: '1px solid rgba(20,184,212,0.15)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#718096' }}>Workspace Master Alvo</p>
        {masterWorkspace ? (
          <div className="flex items-center gap-3 flex-wrap">
            <Database className="w-5 h-5 shrink-0" style={{ color: '#14B8D4' }} />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{masterWorkspace.company_name}</p>
              <p className="text-[10px] font-mono" style={{ color: '#14B8D4' }}>ID: {masterWorkspace.id}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(0,217,154,0.12)', color: '#00D99A', border: '1px solid rgba(0,217,154,0.25)' }}>
              {masterWorkspace.account_status?.toUpperCase()}
            </span>
            {/* Verifica se o usuário já está vinculado */}
            {user?.workspace_id !== masterWorkspace.id ? (
              <Button
                size="sm"
                onClick={() => handleLinkWorkspace(masterWorkspace.id)}
                disabled={linking || linked}
                className="gap-1.5 h-7 text-xs"
                style={{ background: 'linear-gradient(135deg,#14B8D4,#6D56E8)', color: '#fff', fontWeight: 700 }}
              >
                {linked ? <><CheckCircle2 className="w-3 h-3" /> Vinculado!</> : linking ? <><RefreshCw className="w-3 h-3 animate-spin" /> Vinculando...</> : <><Zap className="w-3 h-3" /> Vincular minha conta</>}
              </Button>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                style={{ background: 'rgba(0,217,154,0.12)', color: '#00D99A' }}>
                <CheckCircle2 className="w-3 h-3" /> Sua conta está vinculada
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm" style={{ color: '#FC5252' }}>
            Nenhum workspace encontrado. Execute o reparo para criar e vincular automaticamente.
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => auditMut.mutate()}
          disabled={phase === 'auditing' || phase === 'repairing'}
          variant="outline"
          className="gap-2"
        >
          {phase === 'auditing'
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Auditando...</>
            : <><Eye className="w-4 h-4" /> Auditar Dados</>
          }
        </Button>

        {(phase === 'audit_done' || phase === 'done') && totalOrphans > 0 && (
          <Button
            onClick={() => repairMut.mutate()}
            disabled={phase === 'repairing' || !masterWorkspace}
            className="gap-2"
            style={{ background: 'linear-gradient(135deg, #E87D00, #E8C200)', color: '#000', fontWeight: 700 }}
          >
            {phase === 'repairing'
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Reparando...</>
              : <><Wrench className="w-4 h-4" /> Reparar {totalOrphans} Registros</>
            }
          </Button>
        )}

        {phase === 'audit_done' && totalOrphans === 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(0,217,154,0.10)', border: '1px solid rgba(0,217,154,0.25)', color: '#00D99A' }}>
            <ShieldCheck className="w-4 h-4" /> Todos os dados já estão vinculados corretamente
          </div>
        )}
      </div>

      {/* Repair success banner */}
      {phase === 'done' && (
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(0,217,154,0.08)', border: '1px solid rgba(0,217,154,0.25)' }}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6" style={{ color: '#00D99A' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: '#00D99A' }}>
                Reparo concluído! {totalRepaired} registros reconectados ao workspace master.
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Recarregue a página para ver todos os dados restaurados.
              </p>
            </div>
            <Button size="sm" className="ml-auto gap-1.5" onClick={() => window.location.reload()}>
              <RefreshCw className="w-3.5 h-3.5" /> Recarregar
            </Button>
          </div>
        </div>
      )}

      {/* Audit Results */}
      {(auditResult || repairResult) && (
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(10,16,32,0.92), rgba(6,10,22,0.96))',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
          <div className="px-5 py-3.5 flex items-center gap-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Zap className="w-4 h-4" style={{ color: '#14B8D4' }} />
            <span className="text-sm font-bold text-white">Relatório de Auditoria</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-auto"
              style={{
                background: totalOrphans > 0 ? 'rgba(252,82,82,0.12)' : 'rgba(0,217,154,0.12)',
                color: totalOrphans > 0 ? '#FC5252' : '#00D99A',
                border: `1px solid ${totalOrphans > 0 ? 'rgba(252,82,82,0.25)' : 'rgba(0,217,154,0.25)'}`,
              }}>
              {totalOrphans} órfãos encontrados
            </span>
          </div>

          <div className="p-4 space-y-2">
            {ENTITY_NAMES.map((name) => {
              const data = (repairResult || auditResult)?.entities?.[name];
              if (!data) return null;
              const hasOrphans = (data.orphans || 0) > 0;
              const isExpanded = expandedEntity === name;

              return (
                <div key={name}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    background: hasOrphans ? 'rgba(252,82,82,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${hasOrphans ? 'rgba(252,82,82,0.18)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                    onClick={() => setExpandedEntity(isExpanded ? null : name)}
                  >
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: hasOrphans ? '#FC5252' : '#00D99A' }} />
                    <span className="text-sm font-semibold text-white flex-1">{name}</span>
                    <span className="text-[11px]" style={{ color: '#718096' }}>
                      {data.total ?? '?'} total
                    </span>
                    {hasOrphans && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(252,82,82,0.15)', color: '#FC5252' }}>
                        {data.orphans} órfãos
                      </span>
                    )}
                    {(data.repaired || 0) > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(0,217,154,0.15)', color: '#00D99A' }}>
                        {data.repaired} reparados
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-1" style={{ color: '#4A5568' }} /> : <ChevronDown className="w-3.5 h-3.5 ml-1" style={{ color: '#4A5568' }} />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total', value: data.total ?? '—', color: '#A0AEC0' },
                        { label: 'Órfãos', value: data.orphans ?? 0, color: (data.orphans || 0) > 0 ? '#FC5252' : '#00D99A' },
                        { label: 'Reparados', value: data.repaired ?? 0, color: (data.repaired || 0) > 0 ? '#00D99A' : '#4A5568' },
                        { label: 'Erros', value: data.repairErrors ?? 0, color: (data.repairErrors || 0) > 0 ? '#FC5252' : '#4A5568' },
                      ].map(m => (
                        <div key={m.label} className="rounded-xl p-3 text-center"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-xs font-bold" style={{ color: m.color }}>{m.value}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#4A5568' }}>{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Errors */}
          {(repairResult || auditResult)?.errors?.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#FC5252' }}>
                Erros ({(repairResult || auditResult).errors.length})
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(repairResult || auditResult).errors.map((e, i) => (
                  <p key={i} className="text-[10px] font-mono" style={{ color: '#FC5252' }}>{e}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Guide */}
      <div className="rounded-2xl p-5"
        style={{ background: 'rgba(109,86,232,0.05)', border: '1px solid rgba(109,86,232,0.15)' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6D56E8' }}>
          Como funciona o reparo
        </p>
        <ol className="space-y-2 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          <li><span className="font-bold text-white">1. Auditar</span> — lê todos os registros de todas as entidades e identifica os que não têm <code className="text-[#14B8D4]">workspace_id</code></li>
          <li><span className="font-bold text-white">2. Reparar</span> — injeta o ID do workspace master nesses registros (atualização segura, sem deletar dados)</li>
          <li><span className="font-bold text-white">3. Recarregar</span> — após o reparo, recarregue a página para os dados aparecerem normalmente</li>
          <li><span className="font-bold text-white">Novos clientes</span> — ao criar workspace via WorkspaceSetup, todos os dados já nascem com o <code className="text-[#14B8D4]">workspace_id</code> correto</li>
        </ol>
      </div>
    </div>
  );
}
