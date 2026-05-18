import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { operationalLogService } from '@/services/operationalLogService';

const LS_KEY = 'altivus_active_workspace';
const WorkspaceCtx = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user, isLoadingAuth } = useAuth();

  const [memberships, setMemberships]         = useState([]);
  const [workspaces, setWorkspaces]           = useState([]);
  const [currentWorkspaceId, setCurrentWsId] = useState(null);
  const [isLoading, setIsLoading]             = useState(true);

  // ── Ativa workspace por ID — declarada ANTES de loadMemberships ──────────
  const activateWorkspace = useCallback((wsId) => {
    setCurrentWsId(wsId);
    try { localStorage.setItem(LS_KEY, wsId); } catch {}
  }, []);

  // ── Carrega memberships + workspaces do usuário ──────────────────────────
  const loadMemberships = useCallback(async (currentUser) => {
    if (!currentUser?.email) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const members = await base44.entities.WorkspaceMember.filter({
        user_email: currentUser.email,
        status: 'active',
      });
      setMemberships(members);

      if (members.length === 0) {
        const ownerWsId = currentUser.workspace_id || currentUser.data?.workspace_id;
        if (ownerWsId) {
          try {
            const ws = await base44.entities.Workspace.get(ownerWsId);
            const newMember = await base44.entities.WorkspaceMember.create({
              workspace_id: ownerWsId,
              user_id:      currentUser.id,
              user_email:   currentUser.email,
              user_name:    currentUser.full_name || currentUser.email,
              role:         'workspace_admin',
              status:       'active',
              joined_at:    new Date().toISOString(),
              invited_by:   'system',
            });
            setMemberships([newMember]);
            setWorkspaces([ws]);
            activateWorkspace(ownerWsId);
          } catch {
            setCurrentWsId(ownerWsId);
          }
        }
        setIsLoading(false);
        return;
      }

      const wsIds = [...new Set(members.map(m => m.workspace_id))];
      const wsArr = await Promise.all(
        wsIds.map(id => base44.entities.Workspace.get(id).catch(() => null))
      );
      setWorkspaces(wsArr.filter(Boolean));

      const saved = localStorage.getItem(LS_KEY);
      const preferred = saved && wsIds.includes(saved) ? saved : wsIds[0];
      activateWorkspace(preferred);

      const activeMember = members.find(m => m.workspace_id === preferred);
      if (activeMember) {
        base44.entities.WorkspaceMember.update(activeMember.id, {
          last_seen_at: new Date().toISOString(),
        }).catch(() => {});
      }
    } catch (err) {
      console.error('WorkspaceContext: erro ao carregar memberships', err);
    }
    setIsLoading(false);
  }, [activateWorkspace]);

  // ── Troca de workspace ────────────────────────────────────────────────────
  const switchWorkspace = useCallback((wsId) => {
    const previousWorkspaceId = currentWorkspaceId;
    activateWorkspace(wsId);
    const m = memberships.find(m => m.workspace_id === wsId);
    if (m) {
      base44.entities.WorkspaceMember.update(m.id, { last_seen_at: new Date().toISOString() }).catch(() => {});
    }
    if (previousWorkspaceId && previousWorkspaceId !== wsId) {
      operationalLogService.recordWorkspaceSwitch(base44.entities, {
        workspaceId: wsId,
        previousWorkspaceId,
        user,
      });
    }
  }, [currentWorkspaceId, memberships, activateWorkspace, user]);

  // Sincroniza troca de workspace entre abas do mesmo navegador.
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== LS_KEY || !event.newValue) return;
      setCurrentWsId(event.newValue);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // ── Recarrega memberships ─────────────────────────────────────────────────
  const refreshMemberships = useCallback(() => {
    if (user) loadMemberships(user);
  }, [user, loadMemberships]);

  // ── Reage a mudanças de usuário ───────────────────────────────────────────
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      setMemberships([]);
      setWorkspaces([]);
      setCurrentWsId(null);
      setIsLoading(false);
      return;
    }
    loadMemberships(user);
  }, [user, isLoadingAuth, loadMemberships]);

  // ── Derivados memoizados ──────────────────────────────────────────────────
  const currentMembership = useMemo(
    () => memberships.find(m => m.workspace_id === currentWorkspaceId) || null,
    [memberships, currentWorkspaceId]
  );

  const currentWorkspace = useMemo(
    () => workspaces.find(w => w.id === currentWorkspaceId) || null,
    [workspaces, currentWorkspaceId]
  );

  const value = useMemo(() => ({
    workspaceId:      currentWorkspaceId,
    currentWorkspace,
    currentMembership,
    memberships,
    workspaces,
    role:             currentMembership?.role || null,
    isWorkspaceAdmin: currentMembership?.role === 'workspace_admin',
    isLoading:        isLoading || isLoadingAuth,
    isReady:          !isLoading && !isLoadingAuth && !!currentWorkspaceId,
    switchWorkspace,
    refreshMemberships,
  }), [
    currentWorkspaceId, currentWorkspace, currentMembership,
    memberships, workspaces, isLoading, isLoadingAuth,
    switchWorkspace, refreshMemberships,
  ]);

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) {
    return {
      workspaceId: null, currentWorkspace: null, currentMembership: null,
      memberships: [], workspaces: [], role: null,
      isWorkspaceAdmin: false, isLoading: true, isReady: false,
      switchWorkspace: () => {}, refreshMemberships: () => {},
    };
  }
  return ctx;
}
