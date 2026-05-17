import { isBeforeGoLive, GO_LIVE_DATE_FIELDS } from '@/lib/goLive';
import { runService, ensureAllowed } from '@/services/serviceUtils';
import { operationalLogService } from '@/services/operationalLogService';
import { OPERATIONAL_LOG_CATEGORIES, OPERATIONAL_LOG_EVENTS } from '@/services/operationalLogEvents';

export const GO_LIVE_CONFIRMATION_PHRASE = 'LIMPAR DADOS OPERACIONAIS DE TESTE';

const RESETTABLE_ENTITIES = [
  'Activity',
  'ActivitySession',
  'AttendanceRecord',
  'FieldLog',
  'Appointment',
  'OperationalMap',
  'ActivityOperationalReport',
  'MaterialMovement',
  'OperationalLog',
];

function buildArchivePatch(entityName, record) {
  const base = {
    is_test: true,
    archived: true,
  };

  if (
    (entityName === 'OperationalMap' || entityName === 'ActivityOperationalReport') &&
    record.status !== 'archived'
  ) {
    return { ...base, status: 'archived' };
  }

  return base;
}

async function archiveEntityBeforeGoLive(db, entityName, goLiveDate) {
  const entity = db[entityName];
  const rows = await entity.list();
  const targets = rows.filter(record =>
    isBeforeGoLive(record, goLiveDate, GO_LIVE_DATE_FIELDS[entityName])
  );

  await Promise.all(targets.map(record =>
    entity.update(record.id, buildArchivePatch(entityName, record))
  ));

  return targets.length;
}

async function resetContractOperationalCounters(db) {
  const contracts = await db.Contract.list();
  const targets = contracts.filter(contract =>
    (contract.total_descidas_executadas || 0) !== 0 ||
    (contract.progresso_descidas || 0) !== 0
  );

  await Promise.all(targets.map(contract =>
    db.Contract.update(contract.id, {
      total_descidas_executadas: 0,
      progresso_descidas: 0,
    })
  ));

  return targets.length;
}

async function restoreOperationalStock(db, goLiveDate) {
  const movements = await db.MaterialMovement.list();
  const operationalExits = movements.filter(movement =>
    movement.type === 'exit' &&
    (movement.activity_id || movement.field_log_id) &&
    isBeforeGoLive(movement, goLiveDate, GO_LIVE_DATE_FIELDS.MaterialMovement)
  );

  const restoreByMaterial = operationalExits.reduce((acc, movement) => {
    if (!movement.material_id) return acc;
    acc[movement.material_id] = (acc[movement.material_id] || 0) + Number(movement.quantity || 0);
    return acc;
  }, {});

  const materials = await db.Material.list();
  const targets = materials.filter(material => restoreByMaterial[material.id]);

  await Promise.all(targets.map(material =>
    db.Material.update(material.id, {
      quantity_available: Number(material.quantity_available || 0) + restoreByMaterial[material.id],
    })
  ));

  return targets.length;
}

export const goLiveService = {
  async resetOperationalTestData(db, {
    workspace,
    user,
    goLiveDate,
    confirmationPhrase,
    confirmed = false,
    updateWorkspace,
  }) {
    return runService(async () => {
      ensureAllowed(workspace?.id, 'Workspace inválido para GO-LIVE');
      ensureAllowed(goLiveDate, 'Informe a data de GO-LIVE');
      ensureAllowed(confirmed, 'Confirmação dupla obrigatória');
      ensureAllowed(
        confirmationPhrase === GO_LIVE_CONFIRMATION_PHRASE,
        'Frase de confirmação inválida'
      );

      const affected = {};
      for (const entityName of RESETTABLE_ENTITIES) {
        affected[entityName] = await archiveEntityBeforeGoLive(db, entityName, goLiveDate);
      }
      affected.ContractCounters = await resetContractOperationalCounters(db);
      affected.MaterialStockRestores = await restoreOperationalStock(db, goLiveDate);

      await updateWorkspace(workspace.id, { go_live_date: goLiveDate });

      await operationalLogService.record(db, {
        workspace_id: workspace.id,
        event_type: OPERATIONAL_LOG_EVENTS.WORKSPACE_GO_LIVE_RESET,
        category: OPERATIONAL_LOG_CATEGORIES.WORKSPACE,
        severity: 'critical',
        action: 'reset_operational_test_data',
        description: 'Reset operacional de GO-LIVE executado',
        entity_type: 'Workspace',
        entity_id: workspace.id,
        user,
        metadata: {
          go_live_date: goLiveDate,
          reset_type: 'archive_pre_go_live_operational_data',
          affected_records: affected,
        },
        source: 'service',
        analytics_tags: ['workspace', 'go_live', 'audit'],
      });

      return {
        workspace_id: workspace.id,
        go_live_date: goLiveDate,
        affected_records: affected,
      };
    }, 'Erro ao executar reset operacional de GO-LIVE');
  },
};
