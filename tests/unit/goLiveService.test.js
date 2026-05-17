import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBase44Mock } from '@/test/mocks/base44';

describe('goLiveService', () => {
  let base44;
  let db;
  let goLiveService;
  let GO_LIVE_CONFIRMATION_PHRASE;
  let OPERATIONAL_LOG_EVENTS;

  beforeEach(async () => {
    vi.resetModules();
    base44 = createBase44Mock({
      Activity: [
        { id: 'act-old', workspace_id: 'ws-alpha', start_date: '2026-05-16' },
        { id: 'act-new', workspace_id: 'ws-alpha', start_date: '2026-05-17' },
      ],
      ActivitySession: [
        { id: 'sess-old', workspace_id: 'ws-alpha', date: '2026-05-16' },
      ],
      AttendanceRecord: [],
      FieldLog: [{ id: 'field-old', workspace_id: 'ws-alpha', date: '2026-05-16' }],
      Appointment: [],
      OperationalMap: [],
      ActivityOperationalReport: [],
      MaterialMovement: [
        {
          id: 'mov-1',
          workspace_id: 'ws-alpha',
          material_id: 'mat-1',
          type: 'exit',
          quantity: 3,
          activity_id: 'act-old',
          movement_at: '2026-05-16T10:00:00.000Z',
        },
      ],
      OperationalLog: [],
      Contract: [
        { id: 'contract-1', workspace_id: 'ws-alpha', total_descidas_executadas: 8, progresso_descidas: 40 },
      ],
      Material: [
        { id: 'mat-1', workspace_id: 'ws-alpha', quantity_available: 7 },
      ],
    });
    vi.doMock('@/api/base44Client', () => ({ base44 }));
    const workspaceClient = await import('@/lib/workspaceClient');
    ({ goLiveService, GO_LIVE_CONFIRMATION_PHRASE } = await import('@/services/goLiveService'));
    ({ OPERATIONAL_LOG_EVENTS } = await import('@/services/operationalLogEvents'));
    db = workspaceClient.createWorkspaceClient('ws-alpha');
  });

  it('arquiva registros pré-go-live, preserva estrutura e registra auditoria', async () => {
    const workspace = { id: 'ws-alpha' };
    const updateWorkspace = async (_id, payload) => payload;

    await goLiveService.resetOperationalTestData(db, {
      workspace,
      user: { id: 'user-1', email: 'admin@altivus.com' },
      goLiveDate: '2026-05-17',
      confirmed: true,
      confirmationPhrase: GO_LIVE_CONFIRMATION_PHRASE,
      updateWorkspace,
    });

    expect(base44.entities.Activity.rows.get('act-old')).toEqual(expect.objectContaining({
      is_test: true,
      archived: true,
    }));
    expect(base44.entities.Activity.rows.get('act-new')).not.toEqual(expect.objectContaining({
      is_test: true,
    }));
    expect(base44.entities.Contract.rows.get('contract-1')).toEqual(expect.objectContaining({
      total_descidas_executadas: 0,
      progresso_descidas: 0,
    }));
    expect(base44.entities.Material.rows.get('mat-1')).toEqual(expect.objectContaining({
      quantity_available: 10,
    }));
    expect(base44.entities.OperationalLog.create).toHaveBeenCalledWith(expect.objectContaining({
      workspace_id: 'ws-alpha',
      event_type: OPERATIONAL_LOG_EVENTS.WORKSPACE_GO_LIVE_RESET,
      metadata: expect.objectContaining({
        go_live_date: '2026-05-17',
        affected_records: expect.objectContaining({
          Activity: 1,
          ActivitySession: 1,
          FieldLog: 1,
          MaterialMovement: 1,
          ContractCounters: 1,
          MaterialStockRestores: 1,
        }),
      }),
    }));
  });

  it('exige confirmação dupla antes do reset', async () => {
    await expect(goLiveService.resetOperationalTestData(db, {
      workspace: { id: 'ws-alpha' },
      user: { id: 'user-1' },
      goLiveDate: '2026-05-17',
      confirmed: false,
      confirmationPhrase: '',
      updateWorkspace: async () => null,
    })).rejects.toThrow('Confirmação dupla obrigatória');
  });
});
