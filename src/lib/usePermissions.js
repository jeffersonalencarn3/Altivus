/**
 * usePermissions — RBAC real baseado no WorkspaceMember.role
 *
 * Hierarquia:
 *   workspace_admin → acesso total ao workspace
 *   supervisor      → operacional pleno (sem configurações)
 *   operacional     → campo: check-in/out, fotos, visualizar
 *   visualizador    → somente leitura, sem nenhuma ação
 *
 * IMPORTANTE: lê o role do WorkspaceContext (membership real),
 * não do user.role do sistema base44.
 * Admin da plataforma (user.role === 'admin') mantém acesso total.
 */
import { useWorkspace } from '@/lib/useWorkspace';
import { useAuth } from '@/lib/AuthContext';

export function usePermissions() {
  const { role: wsRole } = useWorkspace();
  const { user } = useAuth();

  // Admin da plataforma = acesso total
  const isPlatformAdmin = user?.role === 'admin';

  // Resolve o role efetivo
  const role = isPlatformAdmin ? 'workspace_admin' : (wsRole || 'visualizador');

  const isWorkspaceAdmin = role === 'workspace_admin';
  const isSupervisor     = role === 'supervisor';
  const isOperacional    = role === 'operacional';
  const isVisualizador   = role === 'visualizador';

  // Pode qualquer escrita (não visualizador)
  const canWrite = isWorkspaceAdmin || isSupervisor || isOperacional;

  return {
    role,
    isPlatformAdmin,
    isWorkspaceAdmin,
    isSupervisor,
    isOperacional,
    isVisualizador,

    // ─── Atividades ────────────────────────────────────────────────
    canCreateActivity:   isWorkspaceAdmin || isSupervisor,
    canEditActivity:     isWorkspaceAdmin || isSupervisor,
    canDeleteActivity:   isWorkspaceAdmin,
    canArchiveActivity:  isWorkspaceAdmin,
    canDuplicateActivity: isWorkspaceAdmin || isSupervisor,
    canRescheduleActivity: isWorkspaceAdmin || isSupervisor,
    canUpdateProgress:   isWorkspaceAdmin || isSupervisor || isOperacional,

    // ─── Check-in / Check-out / Execução de campo ─────────────────
    canCheckin:         isWorkspaceAdmin || isSupervisor || isOperacional,
    canCheckout:        isWorkspaceAdmin || isSupervisor || isOperacional,
    canAddDescida:      isWorkspaceAdmin || isSupervisor || isOperacional,
    canUploadPhoto:     isWorkspaceAdmin || isSupervisor || isOperacional,

    // ─── Contratos ────────────────────────────────────────────────
    canCreateContract:  isWorkspaceAdmin,
    canEditContract:    isWorkspaceAdmin,
    canDeleteContract:  isWorkspaceAdmin,

    // ─── Equipes & Colaboradores ──────────────────────────────────
    canManageTeams:     isWorkspaceAdmin || isSupervisor,
    canDeleteTeam:      isWorkspaceAdmin,
    canEditEmployee:    isWorkspaceAdmin || isSupervisor,
    canDeleteEmployee:  isWorkspaceAdmin,
    canViewEmployeeProfile: true,

    // ─── Cadastros (Units, Areas, ServiceTypes) ───────────────────
    canManageRegisters: isWorkspaceAdmin,

    // ─── Materiais ────────────────────────────────────────────────
    canManageMaterials: isWorkspaceAdmin,
    canViewMaterials:   true,

    // ─── Relatórios ───────────────────────────────────────────────
    canExportPDF:       isWorkspaceAdmin || isSupervisor,
    canApproveReport:   isWorkspaceAdmin || isSupervisor,
    canViewDirector:    isWorkspaceAdmin || isSupervisor,

    // ─── Equipamentos & Inspeções ─────────────────────────────────
    canManageEquipments:  isWorkspaceAdmin || isSupervisor,
    canCreateInspection:  isWorkspaceAdmin || isSupervisor || isOperacional,
    canApproveInspection: isWorkspaceAdmin || isSupervisor,
    canBlockEquipment:    isWorkspaceAdmin || isSupervisor,

    // ─── Workspace Admin ─────────────────────────────────────────
    canManageWorkspace:      isWorkspaceAdmin,
    canInviteMembers:        isWorkspaceAdmin,
    canAccessWorkspaceAdmin: isWorkspaceAdmin,
    canAccessAdminMaster:    isPlatformAdmin,

    // ─── Presença / Attendance ────────────────────────────────────
    canManageAttendance:     isWorkspaceAdmin || isSupervisor,
    canViewAttendance:       true,

    // ─── Planejamento ─────────────────────────────────────────────
    canEditPlanning:    isWorkspaceAdmin || isSupervisor,

    // ─── Genérico ─────────────────────────────────────────────────
    canCreate:  isWorkspaceAdmin || isSupervisor,
    canEdit:    isWorkspaceAdmin || isSupervisor,
    canDelete:  isWorkspaceAdmin,
    canApprove: isWorkspaceAdmin || isSupervisor,
    isReadOnly: isVisualizador,

    // ─── Rotas ocultas no menu ────────────────────────────────────
    hiddenRoutes: isOperacional
      ? ['/contracts', '/registers', '/director', '/admin-master', '/workspace-admin', '/master-repair']
      : isSupervisor
        ? ['/registers', '/admin-master', '/workspace-admin', '/master-repair']
        : isVisualizador
          ? ['/contracts', '/registers', '/director', '/admin-master', '/workspace-admin', '/master-repair', '/materials']
          : [],
  };
}