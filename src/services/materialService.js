import { ensureAllowed, runService } from '@/services/serviceUtils';
import { operationalLogService } from '@/services/operationalLogService';

export const MATERIAL_SERVICE_DOMAIN = 'material';

function nextQuantity(current, delta) {
  return Math.max(0, (current || 0) + delta);
}

function logInventoryEvent(db, event) {
  return operationalLogService.record(db, {
    source: 'service',
    category: 'inventory',
    severity: 'info',
    ...event,
  });
}

export const materialService = {
  createMaterial(db, data, { canManageMaterials = true } = {}) {
    return runService(async () => {
      ensureAllowed(canManageMaterials, 'Sem permissão para criar materiais');
      const material = await db.Material.create(data);
      await logInventoryEvent(db, {
        event_type: 'material.create',
        action: 'create_material',
        description: `Material criado: ${material.name || material.id}`,
        entity_type: 'Material',
        entity_id: material.id,
        material_id: material.id,
        after: material,
        analytics_tags: ['inventory', 'critical_change'],
      });
      return material;
    }, 'Erro ao criar material');
  },

  updateMaterial(db, id, data, { canManageMaterials = true } = {}) {
    return runService(async () => {
      ensureAllowed(canManageMaterials, 'Sem permissão para editar materiais');
      const before = await db.Material.get(id).catch(() => null);
      const material = await db.Material.update(id, data);
      await logInventoryEvent(db, {
        event_type: 'material.update',
        action: 'update_material',
        severity: 'warning',
        description: `Material atualizado: ${material.name || id}`,
        entity_type: 'Material',
        entity_id: id,
        material_id: id,
        before,
        after: material,
        analytics_tags: ['inventory', 'critical_change'],
      });
      return material;
    }, 'Erro ao atualizar material');
  },

  deleteMaterial(db, id, { canManageMaterials = true } = {}) {
    return runService(async () => {
      ensureAllowed(canManageMaterials, 'Sem permissão para remover materiais');
      const before = await db.Material.get(id).catch(() => null);
      const removed = await db.Material.delete(id);
      await logInventoryEvent(db, {
        event_type: 'material.delete',
        action: 'delete_material',
        severity: 'critical',
        description: `Material removido: ${before?.name || id}`,
        entity_type: 'Material',
        entity_id: id,
        material_id: id,
        before,
        analytics_tags: ['inventory', 'critical_change', 'audit'],
      });
      return removed;
    }, 'Erro ao remover material');
  },

  addToActivity(db, { activityId, material, quantity }) {
    return runService(async () => {
      const qty = Number(quantity) || 0;
      ensureAllowed(activityId, 'Atividade inválida');
      ensureAllowed(material?.id, 'Material não encontrado');
      ensureAllowed(qty > 0, 'Informe uma quantidade válida');
      ensureAllowed((material.quantity_available || 0) >= qty, 'Quantidade insuficiente em estoque');
      await db.ActivityMaterial.create({
        activity_id: activityId,
        material_id: material.id,
        material_name: material.name,
        quantity_used: qty,
        unit: material.unit,
      });
      await db.Material.update(material.id, {
        quantity_available: nextQuantity(material.quantity_available, -qty),
      });
      await logInventoryEvent(db, {
        event_type: 'material.allocate_activity',
        action: 'allocate_material_to_activity',
        description: `Material alocado em atividade: ${material.name}`,
        entity_type: 'ActivityMaterial',
        activity_id: activityId,
        material_id: material.id,
        before: material,
        after: { quantity_available: nextQuantity(material.quantity_available, -qty) },
        metadata: { quantity: qty, unit: material.unit },
        analytics_tags: ['inventory', 'activity'],
      });
    }, 'Erro ao adicionar material à atividade');
  },

  removeFromActivity(db, record) {
    return runService(async () => {
      await db.ActivityMaterial.delete(record.id);
      if (record.material_id) {
        const material = await db.Material.get(record.material_id).catch(() => null);
        if (material) {
          await db.Material.update(record.material_id, {
            quantity_available: nextQuantity(material.quantity_available, record.quantity_used || 0),
          });
          await logInventoryEvent(db, {
            event_type: 'material.return_activity',
            action: 'return_material_from_activity',
            description: `Material retornado ao estoque: ${record.material_name || material.name}`,
            entity_type: 'ActivityMaterial',
            entity_id: record.id,
            activity_id: record.activity_id,
            material_id: record.material_id,
            before: record,
            after: { quantity_available: nextQuantity(material.quantity_available, record.quantity_used || 0) },
            metadata: { quantity: record.quantity_used || 0, unit: record.unit },
            analytics_tags: ['inventory', 'activity'],
          });
        }
      }
    }, 'Erro ao remover material da atividade');
  },

  consumeMaterials(db, { materials = [], consumption = [], source = {} }) {
    return runService(async () => {
      await Promise.all(consumption.map(async (item) => {
        const material = materials.find(m => m.id === (item.material_id || item.id));
        const materialId = item.material_id || item.id;
        const qty = item.quantity_used || item.quantity || 0;
        if (!materialId || qty <= 0) return;

        await db.Material.update(materialId, {
          quantity_available: nextQuantity(material?.quantity_available, -qty),
        });

        await operationalLogService.recordInventoryExit(db, {
          workspace_id: source.workspaceId || material?.workspace_id || item.workspace_id || '',
          description: `Baixa de estoque: ${item.material_name || material?.name || item.name || materialId}`,
          entity_type: 'Material',
          entity_id: materialId,
          activity_id: source.activityId,
          contract_id: source.contractId,
          material_id: materialId,
          user: source.user || { email: source.collaborator },
          before: material || {},
          after: { quantity_available: nextQuantity(material?.quantity_available, -qty) },
          metadata: {
            quantity: qty,
            field_log_id: source.fieldLogId,
            notes: source.notes,
          },
        });

        if (source.createMovement) {
          await db.MaterialMovement.create({
            material_id: materialId,
            material_name: item.material_name || material?.name || item.name || '',
            quantity: qty,
            type: 'exit',
            field_log_id: source.fieldLogId,
            activity_id: source.activityId,
            contract_id: source.contractId,
            collaborator: source.collaborator,
            notes: source.notes,
            confirmed: false,
            movement_at: source.movementAt || new Date().toISOString(),
          });
        }
      }));
    }, 'Erro ao consumir materiais');
  },
};
