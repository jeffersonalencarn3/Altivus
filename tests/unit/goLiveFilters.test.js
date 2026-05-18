import { describe, expect, it } from 'vitest';
import {
  filterPostGoLive,
  GO_LIVE_DATE_FIELDS,
  isBeforeGoLive,
  isPostGoLiveRecord,
} from '@/lib/goLive';

describe('go-live filters', () => {
  it('mantém somente registros operacionais pós-go-live', () => {
    const rows = [
      { id: 'old', date: '2026-05-16' },
      { id: 'new', date: '2026-05-17' },
      { id: 'test', date: '2026-05-18', is_test: true },
      { id: 'archived', date: '2026-05-18', archived: true },
    ];

    expect(filterPostGoLive(rows, '2026-05-17', GO_LIVE_DATE_FIELDS.ActivitySession))
      .toEqual([{ id: 'new', date: '2026-05-17' }]);
  });

  it('usa a data de início da atividade para separar teste de produção', () => {
    expect(isBeforeGoLive(
      { start_date: '2026-05-16', created_date: '2026-05-10' },
      '2026-05-17',
      GO_LIVE_DATE_FIELDS.Activity
    )).toBe(true);
    expect(isPostGoLiveRecord(
      { start_date: '2026-05-17', created_date: '2026-05-10' },
      '2026-05-17',
      GO_LIVE_DATE_FIELDS.Activity
    )).toBe(true);
  });
});

