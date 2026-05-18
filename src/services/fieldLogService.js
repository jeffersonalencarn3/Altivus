import { runService } from '@/services/serviceUtils';
import { materialService } from '@/services/materialService';
import { operationalLogService } from '@/services/operationalLogService';

export const FIELD_LOG_SERVICE_DOMAIN = 'field_log';

function validateCloseRules(data, materials, contracts) {
  const contract = contracts.find(c => c.id === data.contract_id);
  const saldo = Math.max(0, (contract?.total_descidas_previstas || 0) - (contract?.total_descidas_executadas || 0));
  if (contract && saldo > 0 && (data.descidas_realizadas || 0) > saldo) {
    return 'Descidas excedem o saldo do contrato.';
  }

  const stockIssue = (data.material_consumption || []).find(c => {
    const mat = materials.find(m => m.id === c.material_id);
    return mat && c.quantity_used > (mat.quantity_available || 0);
  });
  if (stockIssue) {
    const mat = materials.find(m => m.id === stockIssue.material_id);
    return `Estoque insuficiente: ${mat?.name} (disponível: ${mat?.quantity_available})`;
  }

  return null;
}

export const fieldLogService = {
  validateClose(data, { materials = [], contracts = [] }) {
    return validateCloseRules(data, materials, contracts);
  },

  deleteFieldLog(db, id) {
    return runService(async () => {
      const before = await db.FieldLog.get(id).catch(() => null);
      const removed = await db.FieldLog.delete(id);
      await operationalLogService.record(db, {
        source: 'service',
        category: 'field_log',
        event_type: 'field_log.delete',
        action: 'delete_field_log',
        severity: 'critical',
        description: `Diario de campo removido: ${before?.date || id}`,
        entity_type: 'FieldLog',
        entity_id: id,
        activity_id: before?.activity_id,
        team_id: before?.team_id,
        contract_id: before?.contract_id,
        field_log_id: id,
        before,
        analytics_tags: ['field_log', 'critical_change', 'audit'],
      });
      return removed;
    }, 'Erro ao remover diário');
  },

  saveFieldLog(db, { data, isClose, user, materials = [], contracts = [] }) {
    return runService(async () => {
      if (isClose) {
        const closeError = validateCloseRules(data, materials, contracts);
        if (closeError) throw new Error(closeError);
      }

      const now = new Date().toISOString();
      const persisted = data.id ? await db.FieldLog.get(data.id).catch(() => null) : null;
      const alreadyCommitted = !!(persisted?.stock_committed || data.stock_committed);
      const trail = [...(data.audit_trail || []), {
        action: data.id ? (isClose ? 'close' : 'update') : 'create',
        user: user?.email || data.supervisor_id || 'system',
        timestamp: now,
        details: `Status: ${data.status}`,
      }];
      const payload = { ...data, audit_trail: trail, stock_committed: alreadyCommitted };

      const saved = data.id
        ? await db.FieldLog.update(data.id, payload)
        : await db.FieldLog.create(payload);

      await operationalLogService.record(db, {
        workspace_id: data.workspace_id || saved.workspace_id || '',
        source: 'service',
        category: 'field_log',
        event_type: data.id ? (isClose ? 'field_log.close' : 'field_log.update') : 'field_log.create',
        action: data.id ? (isClose ? 'close_field_log' : 'update_field_log') : 'create_field_log',
        description: `${isClose ? 'Diario de campo fechado' : data.id ? 'Diario de campo atualizado' : 'Diario de campo criado'}: ${saved.date}`,
        entity_type: 'FieldLog',
        entity_id: saved.id,
        activity_id: saved.activity_id,
        team_id: saved.team_id,
        contract_id: saved.contract_id,
        field_log_id: saved.id,
        user,
        before: persisted || {},
        after: saved,
        metadata: {
          status: saved.status,
          descidas_realizadas: saved.descidas_realizadas || 0,
          material_items: (data.material_consumption || []).length,
        },
        analytics_tags: ['field_log', 'operation', isClose ? 'sla' : 'draft'],
      });

      if (!isClose) return saved;

      const consumption = data.material_consumption || [];
      if (consumption.length > 0 && !alreadyCommitted) {
        await materialService.consumeMaterials(db, {
          materials,
          consumption,
          source: {
            workspaceId: data.workspace_id || '',
            createMovement: true,
            fieldLogId: saved.id,
            activityId: data.activity_id,
            contractId: data.contract_id,
            collaborator: user?.email || data.supervisor_id || 'unknown',
            user,
            notes: `Diário ${data.date}`,
            movementAt: now,
          },
        });
      }

      const contract = contracts.find(c => c.id === data.contract_id);
      if (contract && (data.descidas_realizadas || 0) > 0 && !alreadyCommitted) {
        const newExec = (contract.total_descidas_executadas || 0) + (data.descidas_realizadas || 0);
        const previstas = contract.total_descidas_previstas || 0;
        const progresso = previstas > 0 ? Math.min(100, Math.round((newExec / previstas) * 100)) : 0;
        await db.Contract.update(contract.id, {
          total_descidas_executadas: newExec,
          progresso_descidas: progresso,
        });
      }

      if (!alreadyCommitted) {
        await db.FieldLog.update(saved.id, { stock_committed: true });
      }

      return saved;
    }, 'Erro ao salvar diário de campo');
  },

  approveFieldLog(db, { log, decision, user, notes = '', movements = [] }) {
    return runService(async () => {
      const now = new Date().toISOString();
      const trail = [...(log.audit_trail || []), {
        action: decision,
        user: user?.email || 'supervisor',
        timestamp: now,
        details: notes,
      }];

      const updated = await db.FieldLog.update(log.id, {
        approval_status: decision,
        approval_by: user?.email,
        approval_at: now,
        approval_notes: notes,
        locked: decision === 'approved',
        audit_trail: trail,
      });

      if (decision === 'approved') {
        const logMovements = movements.filter(m => m.field_log_id === log.id);
        await Promise.all(logMovements.map(m => db.MaterialMovement.update(m.id, { confirmed: true })));
      }
      await operationalLogService.recordApproval(db, {
        workspace_id: log.workspace_id || '',
        event_type: 'field_log.approval',
        decision,
        description: `Aprovacao do diario de campo: ${decision}`,
        entity_type: 'FieldLog',
        entity_id: log.id,
        activity_id: log.activity_id,
        team_id: log.team_id,
        contract_id: log.contract_id,
        field_log_id: log.id,
        user,
        before: log,
        after: updated,
        metadata: { notes, confirmed_movements: movements.filter(m => m.field_log_id === log.id).length },
        analytics_tags: ['field_log'],
      });
    }, 'Erro ao aprovar diário');
  },
};
