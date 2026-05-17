import { useAuth } from '@/lib/AuthContext';
import { useWorkspaceMutation } from '@/hooks/useWorkspaceMutation';
import { appointmentService } from '@/services/appointmentService';

export function useAppointmentServiceMutations({ user: userOverride } = {}) {
  const { user: authUser } = useAuth();
  const user = userOverride || authUser;

  const saveAppointment = useWorkspaceMutation({
    mutationFn: ({ db, data, isDraft }) =>
      appointmentService.saveAppointment(db, { data, isDraft, user }),
    invalidateGroups: ['appointments'],
  });

  const deleteAppointment = useWorkspaceMutation({
    mutationFn: ({ db, id }) => appointmentService.deleteAppointment(db, id),
    invalidateGroups: ['appointments'],
  });

  const approveAppointment = useWorkspaceMutation({
    mutationFn: ({ db, appointment, decision, notes }) =>
      appointmentService.approveAppointment(db, { appointment, decision, user, notes }),
    invalidateGroups: ['appointments'],
  });

  return {
    saveAppointment,
    deleteAppointment,
    approveAppointment,
  };
}
