import { usePermissions } from '@/lib/usePermissions';
import { useWorkspaceMutation } from '@/hooks/useWorkspaceMutation';
import { materialService } from '@/services/materialService';

export function useMaterialServiceMutations({ canManageMaterials: canManageOverride } = {}) {
  const { canManageMaterials: canManageFromPermissions } = usePermissions();
  const canManageMaterials = canManageOverride ?? canManageFromPermissions;

  const createMaterial = useWorkspaceMutation({
    mutationFn: ({ db, data }) => materialService.createMaterial(db, data, { canManageMaterials }),
    invalidateGroups: ['materials'],
  });

  const updateMaterial = useWorkspaceMutation({
    mutationFn: ({ db, id, data }) => materialService.updateMaterial(db, id, data, { canManageMaterials }),
    invalidateGroups: ['materials'],
  });

  const deleteMaterial = useWorkspaceMutation({
    mutationFn: ({ db, id }) => materialService.deleteMaterial(db, id, { canManageMaterials }),
    invalidateGroups: ['materials'],
  });

  const addToActivity = useWorkspaceMutation({
    mutationFn: ({ db, activityId, material, quantity }) =>
      materialService.addToActivity(db, { activityId, material, quantity }),
    invalidateGroups: ['materials'],
  });

  const removeFromActivity = useWorkspaceMutation({
    mutationFn: ({ db, record }) => materialService.removeFromActivity(db, record),
    invalidateGroups: ['materials'],
  });

  const consumeMaterials = useWorkspaceMutation({
    mutationFn: ({ db, materials, consumption, source }) =>
      materialService.consumeMaterials(db, { materials, consumption, source }),
    invalidateGroups: ['materials', 'fieldLogs'],
  });

  return {
    createMaterial,
    updateMaterial,
    deleteMaterial,
    addToActivity,
    removeFromActivity,
    consumeMaterials,
  };
}
