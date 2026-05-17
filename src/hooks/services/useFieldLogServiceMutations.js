import { useAuth } from '@/lib/AuthContext';
import { useWorkspaceMutation } from '@/hooks/useWorkspaceMutation';
import { fieldLogService } from '@/services/fieldLogService';

export function useFieldLogServiceMutations({ user: userOverride } = {}) {
  const { user: authUser } = useAuth();
  const user = userOverride || authUser;

  const saveFieldLog = useWorkspaceMutation({
    mutationFn: ({ db, data, isClose, materials, contracts }) =>
      fieldLogService.saveFieldLog(db, { data, isClose, user, materials, contracts }),
    invalidateGroups: ['fieldLogs'],
  });

  const deleteFieldLog = useWorkspaceMutation({
    mutationFn: ({ db, id }) => fieldLogService.deleteFieldLog(db, id),
    invalidateGroups: ['fieldLogs'],
  });

  const approveFieldLog = useWorkspaceMutation({
    mutationFn: ({ db, log, decision, notes, movements }) =>
      fieldLogService.approveFieldLog(db, { log, decision, user, notes, movements }),
    invalidateGroups: ['fieldLogs'],
  });

  return {
    saveFieldLog,
    deleteFieldLog,
    approveFieldLog,
    validateClose: fieldLogService.validateClose,
  };
}
