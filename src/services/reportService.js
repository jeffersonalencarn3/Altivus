import { runService } from '@/services/serviceUtils';
import { operationalLogService } from '@/services/operationalLogService';

function buildReportNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `REL-${year}-${rand}`;
}

export const reportService = {
  approveOperationalReport(db, id) {
    return runService(() => db.ActivityOperationalReport.update(id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
    }), 'Erro ao aprovar relatório');
  },

  archiveOperationalReport(db, id) {
    return runService(() => db.ActivityOperationalReport.update(id, { status: 'archived' }), 'Erro ao arquivar relatório');
  },

  generateOperationalReport(db, { workspaceId, activity, sessions = [], employees = [], attendanceRecords = [], user }) {
    return runService(async () => {
      const now = new Date().toISOString();
      const completedSessions = sessions.filter(s => s.status === 'finalizado');
      const totalDescidas = completedSessions.reduce((acc, s) => acc + (s.descidas_realizadas || 0), 0);
      const totalMinutos = completedSessions.reduce((acc, s) => acc + (s.tempo_total_minutos || 0), 0);
      const totalHH = Math.round((totalMinutos / 60) * 100) / 100;
      const efficiency = activity.descents_planned > 0
        ? Math.min(100, Math.round((totalDescidas / activity.descents_planned) * 100))
        : (activity.progress || 0);

      const photosBefore = completedSessions.flatMap(s => s.fotos_antes || []);
      const photosDuring = completedSessions.flatMap(s => [...(s.fotos_durante || []), ...(s.checkout_photos || [])]);
      const photosAfter = completedSessions.flatMap(s => s.fotos_depois || []);

      const teamMembers = employees.filter(e =>
        attendanceRecords.some(r => r.employee_id === e.id) ||
        e.team_id === activity.team_id
      );

      const report = await db.ActivityOperationalReport.create({
        workspace_id: workspaceId,
        activity_id: activity.id,
        contract_id: activity.contract_id || '',
        report_number: buildReportNumber(),
        title: `Relatório Operacional — ${activity.title}`,
        generated_by: user?.email || 'sistema',
        generated_at: now,
        status: 'generated',
        revision: 1,
        activity_snapshot: { ...activity },
        team_snapshot: teamMembers.map(e => ({
          id: e.id,
          name: e.name,
          role: e.role,
          irata_level: e.irata_level,
          nr35_level: e.nr35_level,
          photo_url: e.photo_url,
          attendance: attendanceRecords.find(r => r.employee_id === e.id) || null,
        })),
        sessions_snapshot: completedSessions,
        attendance_snapshot: attendanceRecords,
        photos_before: photosBefore,
        photos_during: photosDuring,
        photos_after: photosAfter,
        observations: completedSessions.map(s => s.observacoes).filter(Boolean).join('\n'),
        area_executed_pct: efficiency,
        total_hh: totalHH,
        efficiency_pct: efficiency,
      });
      await operationalLogService.record(db, {
        workspace_id: workspaceId,
        source: 'service',
        category: 'report',
        event_type: 'report.generate',
        action: 'generate_operational_report',
        description: `Relatorio operacional gerado: ${report.report_number}`,
        entity_type: 'ActivityOperationalReport',
        entity_id: report.id,
        activity_id: activity.id,
        team_id: activity.team_id,
        contract_id: activity.contract_id,
        user,
        after: report,
        metadata: { total_descidas: totalDescidas, total_hh: totalHH, efficiency_pct: efficiency },
        analytics_tags: ['report', 'analytics', 'audit'],
      });
      return report;
    }, 'Erro ao gerar relatório');
  },
};
