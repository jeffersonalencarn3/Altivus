import { useAuth } from '@/lib/AuthContext';
import { usePermissions } from '@/lib/usePermissions';
import { useWorkspaceMutation } from '@/hooks/useWorkspaceMutation';
import { activityService } from '@/services/activityService';
import { buildMergeEffect } from '@/services/serviceLayer';

function activityExecutionEffects(activity, session, extraActivityPatch) {
  const effects = [];
  if (session) effects.push(buildMergeEffect('ActivitySession', session, ['activitySessions']));
  if (extraActivityPatch) effects.push(buildMergeEffect('Activity', extraActivityPatch, ['activities']));
  return effects;
}

export function useActivityServiceMutations({
  activity,
  activeSession,
  materials = [],
  today,
  user: userOverride,
  onRefresh,
} = {}) {
  const { user: authUser } = useAuth();
  const user = userOverride || authUser;
  const {
    canCreateActivity,
    canEditActivity,
    canDeleteActivity,
    canCheckin,
    canCheckout,
    canAddDescida,
    canUploadPhoto,
  } = usePermissions();

  const invalidateExecution = ['activities', 'materials'];

  const checkin = useWorkspaceMutation({
    mutationFn: ({ db, checklist, visual_checkin_map }) => {
      if (!canCheckin) throw new Error('Sem permissão para realizar check-in');
      return activityService.checkin(db, {
        activity,
        today,
        checklist,
        visual_checkin_map: visual_checkin_map || null,
        user,
      });
    },
    invalidateGroups: invalidateExecution,
    cacheEffects: (session) => activityExecutionEffects(
      activity,
      session,
      activity?.status === 'not_started' ? { ...activity, status: 'in_progress' } : null,
    ),
    onSuccess: () => onRefresh?.(),
  });

  const checkout = useWorkspaceMutation({
    mutationFn: ({ db, checkoutData }) => {
      if (!canCheckout) throw new Error('Sem permissão para realizar check-out');
      return activityService.checkout(db, {
        activity,
        activeSession,
        materials,
        user,
        checkoutData,
      });
    },
    invalidateGroups: invalidateExecution,
    cacheEffects: (result, variables) => {
      const descents = Number(variables?.checkoutData?.descidas_realizadas || 0);
      return activityExecutionEffects(
        activity,
        result?.session || {
          ...activeSession,
          descidas_realizadas: descents,
          status: 'finalizado',
        },
        result?.activity || {
          ...activity,
          descents_completed: (activity?.descents_completed || 0) + descents,
          progress: result?.progress,
          status: result?.newStatus,
        },
      );
    },
    onSuccess: () => onRefresh?.(),
  });

  const uploadDuringPhoto = useWorkspaceMutation({
    mutationFn: ({ db, file }) => {
      if (!canUploadPhoto) throw new Error('Sem permissão para enviar fotos');
      return activityService.uploadDuringPhoto(db, { activeSession, file });
    },
    invalidateGroups: ['activities'],
    cacheEffects: (session) => activityExecutionEffects(activity, session || activeSession),
  });

  const addDescent = useWorkspaceMutation({
    mutationFn: ({ db }) => {
      if (!canAddDescida) throw new Error('Sem permissão');
      return activityService.addDescent(db, { activeSession });
    },
    invalidateGroups: ['activities'],
    cacheEffects: (session) => activityExecutionEffects(
      activity,
      session || {
        ...activeSession,
        descidas_realizadas: (activeSession?.descidas_realizadas || 0) + 1,
      },
    ),
  });

  const createActivity = useWorkspaceMutation({
    mutationFn: ({ db, data }) => activityService.createActivity(db, data, { canCreateActivity, user }),
    invalidateGroups: ['activities'],
  });

  const archiveActivity = useWorkspaceMutation({
    mutationFn: ({ db, targetActivity = activity, mode, reason }) => activityService.archiveActivity(db, {
      activity: targetActivity,
      mode,
      reason,
      user,
      canDeleteActivity,
    }),
    invalidateGroups: ['activities'],
  });

  const restoreActivity = useWorkspaceMutation({
    mutationFn: ({ db, targetActivity = activity }) => activityService.restoreActivity(db, {
      activity: targetActivity,
      user,
      canDeleteActivity,
    }),
    invalidateGroups: ['activities'],
  });

  const rescheduleActivity = useWorkspaceMutation({
    mutationFn: ({ db, targetActivity = activity, form }) => activityService.rescheduleActivity(db, {
      activity: targetActivity,
      form,
      user,
      canEditActivity,
    }),
    invalidateGroups: ['activities'],
  });

  const duplicateActivity = useWorkspaceMutation({
    mutationFn: ({ db, targetActivity = activity }) => activityService.duplicateActivity(db, {
      activity: targetActivity,
      user,
      canCreateActivity,
    }),
    invalidateGroups: ['activities'],
  });

  const updateActivity = useWorkspaceMutation({
    mutationFn: ({ db, id, data }) => activityService.updateActivity(db, id, data, { canEditActivity, user }),
    invalidateGroups: ['activities'],
  });

  const loadTeamAttendance = useWorkspaceMutation({
    mutationFn: ({ db, workspaceId, team, employees, records }) => activityService.loadTeamAttendance(db, {
      workspaceId,
      activity,
      team,
      employees,
      records,
      today,
    }),
    invalidateGroups: ['activities'],
  });

  const saveAttendance = useWorkspaceMutation({
    mutationFn: ({ db, workspaceId, recordId, payload, oldRecord, finalStatus, currentUser }) =>
      activityService.saveAttendance(db, {
        workspaceId,
        activity,
        recordId,
        payload,
        oldRecord,
        finalStatus,
        currentUser: currentUser || user,
      }),
    invalidateGroups: ['activities'],
  });

  const addCollaborator = useWorkspaceMutation({
    mutationFn: ({ db, workspaceId, employee, team }) => activityService.addCollaborator(db, {
      workspaceId,
      activity,
      employee,
      team,
      currentUser: user,
      today,
    }),
    invalidateGroups: ['activities'],
  });

  const removeCollaborator = useWorkspaceMutation({
    mutationFn: ({ db, activityEmployees, employee }) => activityService.removeCollaborator(db, {
      activity,
      activityEmployees,
      employee,
      currentUser: user,
    }),
    invalidateGroups: ['activities'],
  });

  const assignEmployee = useWorkspaceMutation({
    mutationFn: ({ db, activityId, employeeId, role }) => activityService.assignEmployee(db, {
      activityId: activityId || activity?.id,
      employeeId,
      role,
    }),
    invalidateGroups: ['activities'],
  });

  const removeEmployeeAssignment = useWorkspaceMutation({
    mutationFn: ({ db, id }) => activityService.removeEmployeeAssignment(db, id),
    invalidateGroups: ['activities'],
  });

  const updateEmployeeHours = useWorkspaceMutation({
    mutationFn: ({ db, id, hours }) => activityService.updateEmployeeHours(db, { id, hours }),
    invalidateGroups: ['activities'],
  });

  const updatePlanningTeam = useWorkspaceMutation({
    mutationFn: ({ db, area, numAlpinistas }) => activityService.updatePlanningTeam(db, {
      activity,
      area,
      numAlpinistas,
    }),
    invalidateGroups: ['activities'],
  });

  return {
    checkin,
    checkout,
    uploadDuringPhoto,
    addDescent,
    createActivity,
    archiveActivity,
    restoreActivity,
    rescheduleActivity,
    duplicateActivity,
    updateActivity,
    loadTeamAttendance,
    saveAttendance,
    addCollaborator,
    removeCollaborator,
    assignEmployee,
    removeEmployeeAssignment,
    updateEmployeeHours,
    updatePlanningTeam,
  };
}
