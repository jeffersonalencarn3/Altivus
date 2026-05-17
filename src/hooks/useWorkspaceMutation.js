import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceEntities } from '@/lib/useWorkspaceEntities';
import { useWorkspace } from '@/lib/useWorkspace';
import { applyServiceMutationEffects } from '@/services/serviceLayer';
import { getServiceErrorMessage } from '@/services/serviceUtils';

/**
 * Mutation padronizada por workspace:
 * - injeta db + workspaceId
 * - merge incremental de cache
 * - invalidação por grupos
 * - erro normalizado (ServiceError)
 */
export function useWorkspaceMutation({
  mutationFn,
  invalidateGroups = [],
  invalidateKeys = [],
  cacheEffects = [],
  onSuccess,
  onError,
  ...options
}) {
  const queryClient = useQueryClient();
  const { workspaceId } = useWorkspace();
  const db = useWorkspaceEntities();

  return useMutation({
    ...options,
    mutationFn: (variables) => mutationFn({
      db,
      workspaceId,
      ...(variables || {}),
    }),
    onSuccess: (data, variables, context) => {
      applyServiceMutationEffects(queryClient, workspaceId, {
        groups: invalidateGroups,
        keys: invalidateKeys,
        cacheEffects,
        data,
        variables,
      });
      return onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      const message = getServiceErrorMessage(error);
      onError?.(error, message, variables, context);
    },
  });
}
