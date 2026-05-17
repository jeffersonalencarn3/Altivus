import { ensureAllowed, runService } from '@/services/serviceUtils';
import { operationalLogService } from '@/services/operationalLogService';

function logTeamEvent(db, event) {
  return operationalLogService.record(db, {
    source: 'service',
    category: 'team',
    severity: 'info',
    ...event,
  });
}

export const teamService = {
  createTeam(db, data, { canManageTeams = true } = {}) {
    return runService(async () => {
      ensureAllowed(canManageTeams, 'Sem permissão para gerenciar equipes');
      const team = await db.Team.create(data);
      await logTeamEvent(db, {
        event_type: 'team.create',
        action: 'create_team',
        description: `Equipe criada: ${team.name || team.id}`,
        entity_type: 'Team',
        entity_id: team.id,
        team_id: team.id,
        after: team,
        analytics_tags: ['team', 'critical_change'],
      });
      return team;
    }, 'Erro ao criar equipe');
  },

  updateTeam(db, id, data, { canManageTeams = true } = {}) {
    return runService(async () => {
      ensureAllowed(canManageTeams, 'Sem permissão para gerenciar equipes');
      const before = await db.Team.get(id).catch(() => null);
      const team = await db.Team.update(id, data);
      await logTeamEvent(db, {
        event_type: 'team.update',
        action: 'update_team',
        severity: 'warning',
        description: `Equipe atualizada: ${team.name || id}`,
        entity_type: 'Team',
        entity_id: id,
        team_id: id,
        before,
        after: team,
        analytics_tags: ['team', 'critical_change'],
      });
      return team;
    }, 'Erro ao atualizar equipe');
  },

  deleteTeam(db, id, { canDeleteTeam = true } = {}) {
    return runService(async () => {
      ensureAllowed(canDeleteTeam, 'Sem permissão para excluir equipes');
      const before = await db.Team.get(id).catch(() => null);
      const removed = await db.Team.delete(id);
      await logTeamEvent(db, {
        event_type: 'team.delete',
        action: 'delete_team',
        severity: 'critical',
        description: `Equipe removida: ${before?.name || id}`,
        entity_type: 'Team',
        entity_id: id,
        team_id: id,
        before,
        analytics_tags: ['team', 'critical_change', 'audit'],
      });
      return removed;
    }, 'Erro ao excluir equipe');
  },

  createEmployee(db, data, { canEditEmployee = true } = {}) {
    return runService(async () => {
      ensureAllowed(canEditEmployee, 'Sem permissão para editar colaboradores');
      const employee = await db.Employee.create(data);
      await logTeamEvent(db, {
        event_type: 'employee.create',
        action: 'create_employee',
        description: `Colaborador criado: ${employee.name || employee.id}`,
        entity_type: 'Employee',
        entity_id: employee.id,
        team_id: employee.team_id,
        after: employee,
        analytics_tags: ['employee', 'team', 'critical_change'],
      });
      return employee;
    }, 'Erro ao criar colaborador');
  },

  updateEmployee(db, id, data, { canEditEmployee = true } = {}) {
    return runService(async () => {
      ensureAllowed(canEditEmployee, 'Sem permissão para editar colaboradores');
      const before = await db.Employee.get(id).catch(() => null);
      const employee = await db.Employee.update(id, data);
      await logTeamEvent(db, {
        event_type: 'employee.update',
        action: 'update_employee',
        severity: 'warning',
        description: `Colaborador atualizado: ${employee.name || id}`,
        entity_type: 'Employee',
        entity_id: id,
        team_id: employee.team_id || before?.team_id,
        before,
        after: employee,
        analytics_tags: ['employee', 'team', 'critical_change'],
      });
      return employee;
    }, 'Erro ao atualizar colaborador');
  },

  deleteEmployee(db, id, { canDeleteEmployee = true } = {}) {
    return runService(async () => {
      ensureAllowed(canDeleteEmployee, 'Sem permissão para excluir colaboradores');
      const before = await db.Employee.get(id).catch(() => null);
      const removed = await db.Employee.delete(id);
      await logTeamEvent(db, {
        event_type: 'employee.delete',
        action: 'delete_employee',
        severity: 'critical',
        description: `Colaborador removido: ${before?.name || id}`,
        entity_type: 'Employee',
        entity_id: id,
        team_id: before?.team_id,
        before,
        analytics_tags: ['employee', 'team', 'critical_change', 'audit'],
      });
      return removed;
    }, 'Erro ao excluir colaborador');
  },
};
