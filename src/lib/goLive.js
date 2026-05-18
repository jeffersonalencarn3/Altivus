const DEFAULT_DATE_FIELDS = ['created_date', 'updated_date'];

export const GO_LIVE_DATE_FIELDS = {
  Activity: ['start_date', 'created_date', 'updated_date'],
  ActivitySession: ['date', 'hora_inicio', 'created_date'],
  AttendanceRecord: ['date', 'checkin_time', 'created_date'],
  ActivityOperationalReport: ['generated_at', 'created_date'],
  OperationalMap: ['captured_at', 'created_date'],
  OperationalLog: ['occurred_at', 'created_at', 'event_date'],
  Appointment: ['date', 'created_date'],
  FieldLog: ['date', 'created_date'],
  MaterialMovement: ['movement_at', 'created_date'],
};

function normalizeDate(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function getRecordDate(record, dateFields = DEFAULT_DATE_FIELDS) {
  for (const field of dateFields) {
    const normalized = normalizeDate(record?.[field]);
    if (normalized) return normalized;
  }
  return '';
}

export function isPostGoLiveRecord(record, goLiveDate, dateFields = DEFAULT_DATE_FIELDS) {
  if (!record || record.is_test === true || record.archived === true) return false;
  const normalizedGoLiveDate = normalizeDate(goLiveDate);
  if (!normalizedGoLiveDate) return true;
  const recordDate = getRecordDate(record, dateFields);
  return !recordDate || recordDate >= normalizedGoLiveDate;
}

export function filterPostGoLive(records = [], goLiveDate, dateFields = DEFAULT_DATE_FIELDS) {
  return (Array.isArray(records) ? records : []).filter(record =>
    isPostGoLiveRecord(record, goLiveDate, dateFields)
  );
}

export function isBeforeGoLive(record, goLiveDate, dateFields = DEFAULT_DATE_FIELDS) {
  const normalizedGoLiveDate = normalizeDate(goLiveDate);
  const recordDate = getRecordDate(record, dateFields);
  return !!normalizedGoLiveDate && !!recordDate && recordDate < normalizedGoLiveDate;
}

export function buildGoLiveSelect(goLiveDate, entityType) {
  return (records = []) => filterPostGoLive(
    records,
    goLiveDate,
    GO_LIVE_DATE_FIELDS[entityType] || DEFAULT_DATE_FIELDS
  );
}
