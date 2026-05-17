/**
 * useWorkspace
 * ─────────────
 * Hook de conveniência — expõe o workspace ativo e metadados de membership.
 * Lê do WorkspaceContext (nova arquitetura multi-tenant).
 *
 * Mantém compatibilidade com código existente:
 *   const { workspaceId, isLoading, isReady } = useWorkspace();
 */
import { useMemo } from 'react';
import { useWorkspaceContext } from '@/lib/WorkspaceContext';

export function useWorkspace() {
  const ctx = useWorkspaceContext();
  return useMemo(() => ({
    workspaceId:        ctx.workspaceId,
    currentWorkspace:   ctx.currentWorkspace,
    membership:         ctx.currentMembership,
    memberships:        ctx.memberships,
    workspaces:         ctx.workspaces,
    role:               ctx.role,
    isWorkspaceAdmin:   ctx.isWorkspaceAdmin,
    isLoading:          ctx.isLoading,
    isReady:            ctx.isReady,
    switchWorkspace:    ctx.switchWorkspace,
    refreshMemberships: ctx.refreshMemberships,
  }), [
    ctx.workspaceId, ctx.currentWorkspace, ctx.currentMembership,
    ctx.memberships, ctx.workspaces, ctx.role, ctx.isWorkspaceAdmin,
    ctx.isLoading, ctx.isReady, ctx.switchWorkspace, ctx.refreshMemberships,
  ]);
}