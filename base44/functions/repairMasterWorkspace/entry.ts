/**
 * repairMasterWorkspace
 * ─────────────────────
 * Audita e reassocia dados órfãos (sem workspace_id) ao workspace master.
 * Também pode reassociar dados com workspace_id incorreto se especificado.
 *
 * Payload:
 *   { mode: "audit" }              → apenas lê, não modifica nada
 *   { mode: "repair", masterWorkspaceId: "<id>" } → aplica correção
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ENTITY_NAMES = [
  'Activity', 'Team', 'Employee', 'Material', 'Contract',
  'Unit', 'Area', 'ServiceType', 'ActivityMaterial', 'ActivityEmployee',
  'FieldLog', 'ActivitySession', 'Appointment', 'MaterialMovement',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { mode = 'audit', masterWorkspaceId, wrongWorkspaceId, createMasterIfMissing } = body;

    // Se solicitado e não existe workspace, cria o master automaticamente
    let resolvedMasterWorkspaceId = masterWorkspaceId;
    if (!resolvedMasterWorkspaceId && createMasterIfMissing) {
      const existing = await base44.asServiceRole.entities.Workspace.list();
      if (existing.length > 0) {
        resolvedMasterWorkspaceId = existing[0].id;
      } else {
        const today = new Date().toISOString().split('T')[0];
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 3650); // 10 anos
        const ws = await base44.asServiceRole.entities.Workspace.create({
          company_name: 'ALTIVUS MASTER',
          responsible_email: user.email,
          responsible_name: user.full_name || 'Admin',
          account_status: 'active',
          commercial_status: 'converted',
          trial_start: today,
          trial_end: trialEnd.toISOString().split('T')[0],
          adoption_score: 100,
          workspace_mode: 'master_fixed',
        });
        resolvedMasterWorkspaceId = ws.id;
        // Salva no perfil do admin
        await base44.auth.updateMe({ workspace_id: resolvedMasterWorkspaceId });
      }
    }

    const report = {};
    const errors = [];

    for (const entityName of ENTITY_NAMES) {
      try {
        const ent = base44.asServiceRole.entities[entityName];

        // 1) Registros sem workspace_id
        const allRecords = await ent.list();
        const orphans = allRecords.filter(r => !r.workspace_id);

        // 2) Registros com workspace_id errado (opcional)
        let wrongWs = [];
        if (wrongWorkspaceId) {
          wrongWs = allRecords.filter(r => r.workspace_id === wrongWorkspaceId);
        }

        const toFix = [...orphans, ...wrongWs];

        report[entityName] = {
          total: allRecords.length,
          orphans: orphans.length,
          wrongWorkspace: wrongWs.length,
          toRepair: toFix.length,
          repaired: 0,
          repairErrors: 0,
        };

        if (mode === 'repair' && resolvedMasterWorkspaceId && toFix.length > 0) {
          let repaired = 0;
          let repairErrors = 0;

          for (const record of toFix) {
            try {
              await ent.update(record.id, { workspace_id: resolvedMasterWorkspaceId });
              repaired++;
            } catch (e) {
              repairErrors++;
              errors.push(`${entityName}#${record.id}: ${e.message}`);
            }
          }

          report[entityName].repaired = repaired;
          report[entityName].repairErrors = repairErrors;
        }
      } catch (e) {
        report[entityName] = { error: e.message };
        errors.push(`${entityName}: ${e.message}`);
      }
    }

    // Totais
    const totalOrphans = Object.values(report).reduce((s, r) => s + (r.orphans || 0), 0);
    const totalRepaired = Object.values(report).reduce((s, r) => s + (r.repaired || 0), 0);

    return Response.json({
      mode,
      masterWorkspaceId: resolvedMasterWorkspaceId || null,
      summary: {
        totalOrphans,
        totalRepaired,
        errors: errors.length,
      },
      entities: report,
      errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
