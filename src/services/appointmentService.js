import { runService } from '@/services/serviceUtils';
import { operationalLogService } from '@/services/operationalLogService';

export const appointmentService = {
  saveAppointment(db, { data, isDraft = true, user }) {
    return runService(async () => {
      const now = new Date().toISOString();
      const payload = {
        ...data,
        audit_trail: [
          ...(data.audit_trail || []),
          {
            action: data.id ? (isDraft ? 'update' : 'close') : 'create',
            user: user?.email || 'field',
            timestamp: now,
            details: `Status: ${data.status}`,
          },
        ],
      };

      if (data.start_time && data.end_time) {
        const [sh, sm] = data.start_time.split(':').map(Number);
        const [eh, em] = data.end_time.split(':').map(Number);
        payload.total_hours = Math.max(0, +((eh * 60 + em - sh * 60 - sm) / 60).toFixed(2));
      }

      if (!isDraft) {
        const hasBefore = (data.photos_before || []).length > 0;
        const hasAfter = (data.photos_after || []).length > 0;
        const hasReport = data.report_status === 'filled' || data.report_status === 'approved';
        const hasEndTime = !!data.end_time;
        if (hasBefore && !hasAfter) payload.status = 'executing';
        if (hasBefore && hasAfter && !hasReport) payload.status = 'report_pending';
        if (hasBefore && hasAfter && hasReport && hasEndTime) payload.status = 'awaiting_approval';
      }

      const saved = await (data.id
        ? db.Appointment.update(data.id, payload)
        : db.Appointment.create(payload));
      await operationalLogService.record(db, {
        source: 'service',
        category: 'appointment',
        event_type: data.id ? (isDraft ? 'appointment.update' : 'appointment.close') : 'appointment.create',
        action: data.id ? (isDraft ? 'update_appointment' : 'close_appointment') : 'create_appointment',
        description: `${data.id ? 'Apontamento atualizado' : 'Apontamento criado'}: ${saved.date || saved.id}`,
        entity_type: 'Appointment',
        entity_id: saved.id,
        activity_id: saved.activity_id,
        team_id: saved.team_id,
        contract_id: saved.contract_id,
        appointment_id: saved.id,
        user,
        before: data.id ? data : {},
        after: saved,
        analytics_tags: ['appointment', 'operation'],
      });
      return saved;
    }, 'Erro ao salvar apontamento');
  },

  deleteAppointment(db, id) {
    return runService(async () => {
      const before = await db.Appointment.get(id).catch(() => null);
      const removed = await db.Appointment.delete(id);
      await operationalLogService.record(db, {
        source: 'service',
        category: 'appointment',
        event_type: 'appointment.delete',
        action: 'delete_appointment',
        severity: 'critical',
        description: `Apontamento removido: ${before?.date || id}`,
        entity_type: 'Appointment',
        entity_id: id,
        activity_id: before?.activity_id,
        team_id: before?.team_id,
        contract_id: before?.contract_id,
        appointment_id: id,
        before,
        analytics_tags: ['appointment', 'critical_change', 'audit'],
      });
      return removed;
    }, 'Erro ao remover apontamento');
  },

  approveAppointment(db, { appointment, decision, user, notes = '' }) {
    return runService(async () => {
      const now = new Date().toISOString();
      const trail = [...(appointment.audit_trail || []), {
        action: decision,
        user: user?.email || 'supervisor',
        timestamp: now,
        details: notes,
      }];

      const updated = await db.Appointment.update(appointment.id, {
        approval_status: decision,
        approval_by: user?.email,
        approval_at: now,
        approval_notes: notes,
        locked: decision === 'approved',
        status: decision === 'approved' ? 'approved' : 'rejected',
        audit_trail: trail,
      });
      await operationalLogService.recordApproval(db, {
        workspace_id: appointment.workspace_id || '',
        event_type: 'appointment.approval',
        decision,
        description: `Aprovacao do apontamento: ${decision}`,
        entity_type: 'Appointment',
        entity_id: appointment.id,
        activity_id: appointment.activity_id,
        team_id: appointment.team_id,
        contract_id: appointment.contract_id,
        appointment_id: appointment.id,
        user,
        before: appointment,
        after: updated,
        metadata: { notes },
        analytics_tags: ['appointment'],
      });
    }, 'Erro ao aprovar apontamento');
  },
};
