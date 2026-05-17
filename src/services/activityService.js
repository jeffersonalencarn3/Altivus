import { calcularPlano } from '@/lib/planningEngine';
import { ensureAllowed, runService } from '@/services/serviceUtils';
import { materialService } from '@/services/materialService';
import { operationalLogService } from '@/services/operationalLogService';

function formatHour(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function logActivityEvent(db, event) {
  return operationalLogService.record(db, {
    source: 'service',
    category: 'activity',
    severity: 'info',
    ...event,
  });
}

export const activityService = {
  createActivity(db, data, permissions = {}) {
    return runService(async () => {
      if ('canCreateActivity' in permissions) ensureAllowed(permissions.canCreateActivity, 'Sem permissão para criar atividades');
      const activity = await db.Activity.create(data);
      await logActivityEvent(db, {
        event_type: 'activity.create',
        action: 'create_activity',
        description: `Atividade criada: ${activity.title || activity.id}`,
        entity_type: 'Activity',
        entity_id: activity.id,
        activity_id: activity.id,
        team_id: activity.team_id,
        contract_id: activity.contract_id,
        user: permissions.user,
        after: activity,
        analytics_tags: ['activity', 'critical_change'],
      });
      return activity;
    }, 'Erro ao criar atividade');
  },

  updateActivity(db, id, data, permissions = {}) {
    return runService(async () => {
      if ('canEditActivity' in permissions) ensureAllowed(permissions.canEditActivity, 'Sem permissão para editar atividades');
      const before = await db.Activity.get(id).catch(() => null);
      const activity = await db.Activity.update(id, data);
      await logActivityEvent(db, {
        event_type: 'activity.update',
        action: 'update_activity',
        description: `Atividade atualizada: ${activity.title || id}`,
        entity_type: 'Activity',
        entity_id: id,
        activity_id: id,
        team_id: activity.team_id || before?.team_id,
        contract_id: activity.contract_id || before?.contract_id,
        user: permissions.user,
        before,
        after: activity,
        analytics_tags: ['activity', 'critical_change'],
      });
      return activity;
    }, 'Erro ao atualizar atividade');
  },

  archiveActivity(db, { activity, mode, reason, user, canDeleteActivity }) {
    return runService(async () => {
      ensureAllowed(canDeleteActivity, 'Sem permissão para esta ação');
      const newStatus = mode === 'delete' ? 'deleted' : 'archived';
      const auditEntry = {
        action: mode === 'delete' ? 'soft_delete' : 'archive',
        previous_status: activity.status,
        new_status: newStatus,
        reason,
        user: user?.email || '',
        user_role: user?.role || '',
        timestamp: new Date().toISOString(),
      };
      const updated = await db.Activity.update(activity.id, {
        status: newStatus,
        planning_log: [...(activity.planning_log || []), auditEntry],
      });
      await logActivityEvent(db, {
        event_type: mode === 'delete' ? 'activity.soft_delete' : 'activity.archive',
        action: mode === 'delete' ? 'soft_delete_activity' : 'archive_activity',
        severity: 'critical',
        description: `${mode === 'delete' ? 'Exclusao logica' : 'Arquivamento'} da atividade: ${activity.title || activity.id}`,
        entity_type: 'Activity',
        entity_id: activity.id,
        activity_id: activity.id,
        team_id: activity.team_id,
        contract_id: activity.contract_id,
        user,
        before: activity,
        after: updated,
        metadata: { reason },
        analytics_tags: ['activity', 'critical_change', 'audit'],
      });
      return updated;
    }, 'Erro ao arquivar atividade');
  },

  restoreActivity(db, { activity, user, canDeleteActivity }) {
    return runService(async () => {
      ensureAllowed(canDeleteActivity, 'Sem permissão');
      const auditEntry = {
        action: 'restore',
        previous_status: activity.status,
        new_status: 'not_started',
        user: user?.email || '',
        user_role: user?.role || '',
        timestamp: new Date().toISOString(),
      };
      const updated = await db.Activity.update(activity.id, {
        status: 'not_started',
        planning_log: [...(activity.planning_log || []), auditEntry],
      });
      await logActivityEvent(db, {
        event_type: 'activity.restore',
        action: 'restore_activity',
        severity: 'warning',
        description: `Atividade restaurada: ${activity.title || activity.id}`,
        entity_type: 'Activity',
        entity_id: activity.id,
        activity_id: activity.id,
        team_id: activity.team_id,
        contract_id: activity.contract_id,
        user,
        before: activity,
        after: updated,
        analytics_tags: ['activity', 'critical_change', 'audit'],
      });
      return updated;
    }, 'Erro ao restaurar atividade');
  },

  rescheduleActivity(db, { activity, form, user, canEditActivity }) {
    return runService(async () => {
      ensureAllowed(canEditActivity, 'Sem permissão para reprogramar');
      const auditEntry = {
        action: 'reschedule',
        field: 'dates',
        before: `${activity.start_date} → ${activity.end_date}`,
        after: `${form.start_date} → ${form.end_date}`,
        reason: form.reason,
        user: user?.email || '',
        user_role: user?.role || '',
        timestamp: new Date().toISOString(),
      };
      const updated = await db.Activity.update(activity.id, {
        start_date: form.start_date,
        end_date: form.end_date || activity.end_date,
        team_id: form.team_id || activity.team_id,
        planning_log: [...(activity.planning_log || []), auditEntry],
      });
      await logActivityEvent(db, {
        event_type: 'activity.reschedule',
        action: 'reschedule_activity',
        severity: 'warning',
        description: `Atividade reprogramada: ${activity.title || activity.id}`,
        entity_type: 'Activity',
        entity_id: activity.id,
        activity_id: activity.id,
        team_id: updated.team_id || activity.team_id,
        contract_id: activity.contract_id,
        user,
        before: activity,
        after: updated,
        metadata: { reason: form.reason },
        analytics_tags: ['activity', 'planning', 'sla'],
      });
      return updated;
    }, 'Erro ao reprogramar atividade');
  },

  duplicateActivity(db, { activity, user, canCreateActivity }) {
    return runService(async () => {
      ensureAllowed(canCreateActivity, 'Sem permissão para duplicar');
      const {
        id: _id,
        created_date: _created_date,
        updated_date: _updated_date,
        created_by: _created_by,
        descents_completed: _descents_completed,
        hours_actual: _hours_actual,
        planning_log: _planning_log,
        ...base
      } = activity;

      const duplicated = await db.Activity.create({
        ...base,
        title: `${activity.title} (cópia)`,
        status: 'not_started',
        progress: 0,
        descents_completed: 0,
        hours_actual: 0,
        planning_log: [{
          action: 'duplicated_from',
          msg: `Duplicada de "${activity.title}" (${activity.id})`,
          user: user?.email || '',
          timestamp: new Date().toISOString(),
        }],
      });
      await logActivityEvent(db, {
        event_type: 'activity.duplicate',
        action: 'duplicate_activity',
        description: `Atividade duplicada: ${activity.title || activity.id}`,
        entity_type: 'Activity',
        entity_id: duplicated.id,
        activity_id: duplicated.id,
        team_id: duplicated.team_id,
        contract_id: duplicated.contract_id,
        user,
        before: activity,
        after: duplicated,
        metadata: { duplicated_from: activity.id },
        analytics_tags: ['activity', 'planning'],
      });
      return duplicated;
    }, 'Erro ao duplicar atividade');
  },

  recalculatePlans(db, activities = []) {
    return runService(async () => {
      const targets = activities.filter(a => a.status !== 'completed' && a.area_m2 > 0);
      await Promise.all(targets.map(async (activity) => {
        const plan = calcularPlano(activity.area_m2, activity.num_alpinistas || 1);
        await db.Activity.update(activity.id, {
          descents_planned: plan.descidas_planejadas,
          hours_planned: plan.tempo_total_horas,
          time_per_descent: 1.33,
          dias_planejados: plan.dias_planejados,
          tempo_total_horas: plan.tempo_total_horas,
          planning_log: [
            ...(activity.planning_log || []),
            { timestamp: new Date().toISOString(), msg: 'Planejamento recalculado automaticamente' },
          ],
        });
      }));
      return targets.length;
    }, 'Erro ao recalcular planejamentos');
  },

  checkin(db, { activity, today = new Date().toISOString().slice(0, 10), checklist, descidas_planejadas_hoje = 0, visual_checkin_map = null, user }) {
    return runService(async () => {
      ensureAllowed(activity?.id, 'Atividade inválida');
      const now = new Date().toISOString();
      const session = await db.ActivitySession.create({
        activity_id: activity.id,
        team_id: activity.team_id,
        date: today,
        hora_inicio: now,
        status: 'em_execucao',
        checklist_inicio: checklist,
        visual_checkin_map,
        descidas_realizadas: 0,
        descidas_planejadas_hoje,
        materiais_utilizados: [],
        fotos_antes: [],
        fotos_durante: [],
        fotos_depois: [],
      });
      if (activity.status === 'not_started') {
        await db.Activity.update(activity.id, { status: 'in_progress' });
      }
      const executionMeta = { planned_descents_today: descidas_planejadas_hoje, session_id: session.id };
      await operationalLogService.recordActivityExecution(db, {
        workspaceId: activity.workspace_id,
        activity,
        user,
        phase: 'start',
        metadata: executionMeta,
      });
      await operationalLogService.recordActivityExecution(db, {
        workspaceId: activity.workspace_id,
        activity,
        session,
        user,
        phase: 'checkin',
        after: session,
        metadata: { planned_descents_today: descidas_planejadas_hoje },
      });
      return session;
    }, 'Erro ao iniciar atividade');
  },

  checkout(db, { activity, activeSession, materials = [], checkoutData = {}, user }) {
    return runService(async () => {
      ensureAllowed(activity?.id, 'Atividade inválida');
      ensureAllowed(activeSession?.id, 'Sessão ativa não encontrada');
      const now = new Date().toISOString();
      const descentsDone = Number(checkoutData.descidas_realizadas || 0);
      const materialUsage = checkoutData.materiais_utilizados || [];
      const minutos = Math.floor((new Date(now) - new Date(activeSession.hora_inicio)) / 60000);

      const session = await db.ActivitySession.update(activeSession.id, {
        ...checkoutData,
        hora_fim: now,
        status: 'finalizado',
        tempo_total_minutos: minutos,
      });

      const totalDescents = (activity.descents_completed || 0) + descentsDone;
      const planned = activity.descents_planned || 1;
      const progress = Math.min(100, Math.round((totalDescents / planned) * 100));
      const newStatus = progress >= 100 ? 'completed' : 'in_progress';

      const updatedActivity = await db.Activity.update(activity.id, {
        descents_completed: totalDescents,
        progress,
        status: newStatus,
      });

      if (materialUsage.length > 0) {
        await materialService.consumeMaterials(db, {
          materials,
          consumption: materialUsage,
          source: {
            workspaceId: activity.workspace_id || '',
            activityId: activity.id,
            contractId: activity.contract_id,
            user,
            notes: `Checkout atividade ${activity.title || activity.id}`,
          },
        });
      }

      const checkoutMeta = {
        descents_done: descentsDone,
        progress,
        new_status: newStatus,
        elapsed_minutes: minutos,
        session_id: session.id,
      };
      await operationalLogService.recordActivityExecution(db, {
        workspaceId: activity.workspace_id,
        activity,
        user,
        phase: 'finish',
        metadata: checkoutMeta,
      });
      await operationalLogService.recordActivityExecution(db, {
        workspaceId: activity.workspace_id,
        activity,
        session,
        user,
        phase: 'checkout',
        before: activeSession,
        after: session,
        metadata: checkoutMeta,
      });
      return { progress, newStatus, session, activity: updatedActivity };
    }, 'Erro ao finalizar atividade');
  },

  addDescent(db, { activeSession, quantity = 1 }) {
    return runService(() => db.ActivitySession.update(activeSession.id, {
      descidas_realizadas: (activeSession.descidas_realizadas || 0) + quantity,
    }), 'Erro ao adicionar descida');
  },

  addDuringPhoto(db, { activeSession, fileUrl }) {
    return runService(() => db.ActivitySession.update(activeSession.id, {
      fotos_durante: [...(activeSession.fotos_durante || []), fileUrl],
    }), 'Erro ao adicionar foto');
  },

  updatePlanningTeam(db, { activity, area, numAlpinistas }) {
    return runService(async () => {
      const n = Number(numAlpinistas);
      ensureAllowed(n >= 1, 'Informe ao menos 1 alpinista');
      const plano = calcularPlano(area, n);
      const logEntry = {
        timestamp: new Date().toISOString(),
        msg: `Equipe ajustada: ${activity.num_alpinistas || 1} → ${n} alpinistas. Prazo recalculado automaticamente.`,
      };
      const updated = await db.Activity.update(activity.id, {
        num_alpinistas: n,
        descents_planned: plano.descidas_planejadas,
        hours_planned: plano.tempo_total_horas,
        dias_planejados: plano.dias_planejados,
        tempo_total_horas: plano.tempo_total_horas,
        planning_log: [...(activity.planning_log || []), logEntry],
      });
      await logActivityEvent(db, {
        event_type: 'activity.planning_team_update',
        action: 'update_planning_team',
        severity: 'warning',
        description: `Equipe de planejamento ajustada: ${activity.title || activity.id}`,
        entity_type: 'Activity',
        entity_id: activity.id,
        activity_id: activity.id,
        team_id: activity.team_id,
        contract_id: activity.contract_id,
        before: activity,
        after: updated,
        metadata: { previous_alpinistas: activity.num_alpinistas || 1, next_alpinistas: n },
        analytics_tags: ['activity', 'planning', 'sla'],
      });
      return updated;
    }, 'Erro ao recalcular equipe');
  },

  loadTeamAttendance(db, { workspaceId, activity, team, employees = [], records = [], today }) {
    return runService(async () => {
      const todayRecs = records.filter(r => r.date === today);
      const existing = new Set(todayRecs.map(r => r.employee_id));
      const missing = employees.filter(employee => !existing.has(employee.id));
      await Promise.all(missing.map(emp => db.AttendanceRecord.create({
        workspace_id: workspaceId,
        activity_id: activity.id,
        employee_id: emp.id,
        employee_name: emp.name,
        employee_role: emp.role || '',
        team_id: activity.team_id,
        team_name: team?.name || '',
        date: today,
        scheduled_start: '08:00',
        status: 'previsto',
        delay_minutes: 0,
        total_hours: 0,
        audit_log: [],
      })));
      await operationalLogService.record(db, {
        workspace_id: workspaceId,
        source: 'service',
        category: 'attendance',
        event_type: 'attendance.team_loaded',
        action: 'load_team_attendance',
        description: `Equipe carregada para presenca: ${missing.length} colaborador(es)`,
        entity_type: 'Activity',
        entity_id: activity.id,
        activity_id: activity.id,
        team_id: activity.team_id,
        metadata: { date: today, employees_loaded: missing.length },
        analytics_tags: ['attendance', 'team'],
      });
      return missing.length;
    }, 'Erro ao carregar equipe');
  },

  saveAttendance(db, { workspaceId, activity, recordId, payload, oldRecord, finalStatus, currentUser }) {
    return runService(async () => {
      if (recordId) {
        await db.AttendanceRecord.update(recordId, payload);
      } else {
        await db.AttendanceRecord.create({ ...payload, activity_id: activity.id, workspace_id: workspaceId });
      }

      const logEntry = {
        action: finalStatus || payload.status,
        employee: oldRecord?.employee_name,
        employee_id: oldRecord?.employee_id,
        previous_status: oldRecord?.status,
        new_status: payload.status,
        user: currentUser?.email || 'sistema',
        user_role: currentUser?.role || '',
        timestamp: new Date().toISOString(),
        details: payload.justification || (payload.delay_minutes > 0 ? `+${payload.delay_minutes}min atraso` : ''),
        reason: payload.audit_log?.slice(-1)[0]?.reason || '',
        observation: payload.audit_log?.slice(-1)[0]?.observation || '',
      };
      await db.Activity.update(activity.id, {
        audit_trail: [...(activity.audit_trail || []), logEntry],
      });
      await operationalLogService.record(db, {
        workspace_id: workspaceId,
        source: 'service',
        category: 'attendance',
        event_type: 'attendance.record',
        action: finalStatus || payload.status,
        description: `Presenca registrada: ${oldRecord?.employee_name || payload.employee_name || 'colaborador'}`,
        entity_type: 'AttendanceRecord',
        entity_id: recordId || '',
        activity_id: activity.id,
        team_id: activity.team_id,
        user: currentUser,
        before: oldRecord || {},
        after: payload,
        metadata: {
          employee_id: oldRecord?.employee_id || payload.employee_id,
          status: finalStatus || payload.status,
          delay_minutes: payload.delay_minutes || 0,
        },
        analytics_tags: ['attendance', 'audit'],
      });
    }, 'Erro ao registrar presença');
  },

  addCollaborator(db, { workspaceId, activity, employee, team, currentUser, today }) {
    return runService(async () => {
      const now = new Date().toISOString();
      await db.ActivityEmployee.create({
        workspace_id: workspaceId,
        activity_id: activity.id,
        employee_id: employee.id,
        role_in_activity: 'executor',
        hours_worked: 0,
      });

      const existingRec = await db.AttendanceRecord.filter({ activity_id: activity.id, employee_id: employee.id, date: today });
      if (!existingRec.length) {
        await db.AttendanceRecord.create({
          workspace_id: workspaceId,
          activity_id: activity.id,
          employee_id: employee.id,
          employee_name: employee.name,
          employee_role: employee.role || '',
          team_id: activity.team_id,
          team_name: team?.name || '',
          date: today,
          scheduled_start: '08:00',
          status: 'previsto',
          late_arrival_time: now,
          delay_minutes: 0,
          total_hours: 0,
          audit_log: [{
            action: 'adicionado_em_campo',
            new_status: 'previsto',
            reason: 'Adicionado operacionalmente pelo supervisor',
            user: currentUser?.email || 'supervisor',
            user_role: currentUser?.role || '',
            timestamp: now,
            observation: `${employee.name} adicionado por ${currentUser?.full_name || currentUser?.email || 'supervisor'} às ${formatHour(now)}`,
          }],
          registered_by: currentUser?.email || 'supervisor',
          registered_by_role: currentUser?.role || '',
          registered_at: now,
        });
      }

      await db.Activity.update(activity.id, {
        audit_trail: [...(activity.audit_trail || []), {
          action: 'colaborador_adicionado',
          employee: employee.name,
          user: currentUser?.email || 'supervisor',
          user_role: currentUser?.role || '',
          timestamp: now,
          details: `${employee.name} adicionado por ${currentUser?.full_name || currentUser?.email || 'supervisor'} às ${formatHour(now)}`,
        }],
      });
      await operationalLogService.record(db, {
        workspace_id: workspaceId,
        source: 'service',
        category: 'attendance',
        event_type: 'attendance.collaborator_added',
        action: 'add_collaborator',
        description: `Colaborador adicionado em campo: ${employee.name}`,
        entity_type: 'Employee',
        entity_id: employee.id,
        activity_id: activity.id,
        team_id: activity.team_id,
        user: currentUser,
        after: { employee_id: employee.id, employee_name: employee.name },
        analytics_tags: ['attendance', 'team', 'audit'],
      });
    }, 'Erro ao adicionar colaborador');
  },

  removeCollaborator(db, { activity, activityEmployees = [], employee, currentUser }) {
    return runService(async () => {
      const now = new Date().toISOString();
      const link = activityEmployees.find(item => item.employee_id === employee.id);
      if (link) await db.ActivityEmployee.delete(link.id);

      await db.Activity.update(activity.id, {
        audit_trail: [...(activity.audit_trail || []), {
          action: 'colaborador_removido',
          employee: employee.name,
          user: currentUser?.email || 'supervisor',
          user_role: currentUser?.role || '',
          timestamp: now,
          details: `${employee.name} removido por ${currentUser?.full_name || currentUser?.email || 'supervisor'} às ${formatHour(now)}`,
        }],
      });
      await operationalLogService.record(db, {
        workspace_id: activity.workspace_id || '',
        source: 'service',
        category: 'attendance',
        event_type: 'attendance.collaborator_removed',
        action: 'remove_collaborator',
        severity: 'warning',
        description: `Colaborador removido em campo: ${employee.name}`,
        entity_type: 'Employee',
        entity_id: employee.id,
        activity_id: activity.id,
        team_id: activity.team_id,
        user: currentUser,
        before: { employee_id: employee.id, employee_name: employee.name },
        analytics_tags: ['attendance', 'team', 'audit'],
      });
    }, 'Erro ao remover colaborador');
  },

  assignEmployee(db, { activityId, employeeId, role }) {
    return runService(() => {
      ensureAllowed(activityId && employeeId, 'Selecione uma atividade e um colaborador');
      return db.ActivityEmployee.create({
        activity_id: activityId,
        employee_id: employeeId,
        role_in_activity: role || 'executor',
        hours_worked: 0,
      });
    }, 'Erro ao alocar colaborador');
  },

  removeEmployeeAssignment(db, id) {
    return runService(() => db.ActivityEmployee.delete(id), 'Erro ao remover alocação');
  },

  updateEmployeeHours(db, { id, hours }) {
    return runService(() => db.ActivityEmployee.update(id, {
      hours_worked: Number(hours) || 0,
    }), 'Erro ao atualizar horas');
  },
};
