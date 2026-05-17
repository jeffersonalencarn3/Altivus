import { ensureAllowed, runService } from '@/services/serviceUtils';
import { operationalLogService } from '@/services/operationalLogService';

const ENTITY_BY_TAB = {
  units: 'Unit',
  areas: 'Area',
  serviceTypes: 'ServiceType',
};

function getEntity(db, key) {
  const entityName = ENTITY_BY_TAB[key] || key;
  return db[entityName];
}

export const registerService = {
  create(db, key, data, { canManageRegisters = true } = {}) {
    return runService(async () => {
      ensureAllowed(canManageRegisters, 'Sem permissão para editar cadastros');
      const created = await getEntity(db, key).create(data);
      await operationalLogService.record(db, {
        source: 'service',
        category: 'register',
        event_type: 'register.create',
        action: 'create_register',
        description: `Cadastro criado: ${key}`,
        entity_type: ENTITY_BY_TAB[key] || key,
        entity_id: created.id,
        after: created,
        metadata: { register_key: key },
        analytics_tags: ['register', 'critical_change'],
      });
      return created;
    }, 'Erro ao criar cadastro');
  },

  update(db, key, id, data, { canManageRegisters = true } = {}) {
    return runService(async () => {
      ensureAllowed(canManageRegisters, 'Sem permissão para editar cadastros');
      const entity = getEntity(db, key);
      const before = await entity.get(id).catch(() => null);
      const updated = await entity.update(id, data);
      await operationalLogService.record(db, {
        source: 'service',
        category: 'register',
        event_type: 'register.update',
        action: 'update_register',
        severity: 'warning',
        description: `Cadastro atualizado: ${key}`,
        entity_type: ENTITY_BY_TAB[key] || key,
        entity_id: id,
        before,
        after: updated,
        metadata: { register_key: key },
        analytics_tags: ['register', 'critical_change'],
      });
      return updated;
    }, 'Erro ao atualizar cadastro');
  },

  delete(db, key, id, { canManageRegisters = true } = {}) {
    return runService(async () => {
      ensureAllowed(canManageRegisters, 'Sem permissão para editar cadastros');
      const entity = getEntity(db, key);
      const before = await entity.get(id).catch(() => null);
      const removed = await entity.delete(id);
      await operationalLogService.record(db, {
        source: 'service',
        category: 'register',
        event_type: 'register.delete',
        action: 'delete_register',
        severity: 'critical',
        description: `Cadastro removido: ${key}`,
        entity_type: ENTITY_BY_TAB[key] || key,
        entity_id: id,
        before,
        metadata: { register_key: key },
        analytics_tags: ['register', 'critical_change', 'audit'],
      });
      return removed;
    }, 'Erro ao excluir cadastro');
  },
};
