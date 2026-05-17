import { ensureAllowed, runService } from '@/services/serviceUtils';
import { operationalLogService } from '@/services/operationalLogService';

export const contractService = {
  createContract(db, data, { canCreateContract = true } = {}) {
    return runService(async () => {
      ensureAllowed(canCreateContract, 'Sem permissão para criar contratos');
      const contract = await db.Contract.create(data);
      await operationalLogService.record(db, {
        source: 'service',
        category: 'register',
        event_type: 'contract.create',
        action: 'create_contract',
        description: `Contrato criado: ${contract.name || contract.title || contract.id}`,
        entity_type: 'Contract',
        entity_id: contract.id,
        contract_id: contract.id,
        after: contract,
        analytics_tags: ['contract', 'critical_change'],
      });
      return contract;
    }, 'Erro ao criar contrato');
  },

  updateContract(db, id, data, { canEditContract = true } = {}) {
    return runService(async () => {
      ensureAllowed(canEditContract, 'Sem permissão para editar contratos');
      const before = await db.Contract.get(id).catch(() => null);
      const contract = await db.Contract.update(id, data);
      await operationalLogService.record(db, {
        source: 'service',
        category: 'register',
        event_type: 'contract.update',
        action: 'update_contract',
        severity: 'warning',
        description: `Contrato atualizado: ${contract.name || contract.title || id}`,
        entity_type: 'Contract',
        entity_id: id,
        contract_id: id,
        before,
        after: contract,
        analytics_tags: ['contract', 'critical_change'],
      });
      return contract;
    }, 'Erro ao editar contrato');
  },

  deleteContract(db, id, { canDeleteContract = true } = {}) {
    return runService(async () => {
      ensureAllowed(canDeleteContract, 'Sem permissão para excluir contratos');
      const before = await db.Contract.get(id).catch(() => null);
      const removed = await db.Contract.delete(id);
      await operationalLogService.record(db, {
        source: 'service',
        category: 'register',
        event_type: 'contract.delete',
        action: 'delete_contract',
        severity: 'critical',
        description: `Contrato removido: ${before?.name || before?.title || id}`,
        entity_type: 'Contract',
        entity_id: id,
        contract_id: id,
        before,
        analytics_tags: ['contract', 'critical_change', 'audit'],
      });
      return removed;
    }, 'Erro ao excluir contrato');
  },
};
