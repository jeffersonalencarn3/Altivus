import { useWorkspace } from '@/lib/useWorkspace';
import { createWorkspaceClient } from '@/lib/workspaceClient';
import { useMemo } from 'react';

/**
 * Retorna um cliente de entidades isolado por workspace_id do usuário logado.
 * Use este hook em qualquer componente que precise acessar dados operacionais.
 *
 * Exemplo:
 *   const db = useWorkspaceEntities();
 *   const activities = await db.Activity.list();
 *   await db.Contract.create({ name: 'Novo contrato', company: 'XPTO' });
 */
export function useWorkspaceEntities() {
  const { workspaceId } = useWorkspace();
  const db = useMemo(() => createWorkspaceClient(workspaceId), [workspaceId]);
  return db;
}