import { runService } from '@/services/serviceUtils';

export const employeeService = {
  updateEmployee(db, id, data) {
    return runService(() => db.Employee.update(id, data), 'Erro ao atualizar colaborador');
  },

  saveCertifications(db, employeeId, certifications) {
    return runService(() => db.Employee.update(employeeId, { certifications }), 'Erro ao salvar certificações');
  },

  saveEquipment(db, { employeeId, workspaceId, data }) {
    return runService(() => {
      const payload = { ...data, employee_id: employeeId, workspace_id: workspaceId };
      if (payload._isNew) {
        delete payload._isNew;
        return db.Equipment.create(payload);
      }
      return db.Equipment.update(payload.id, payload);
    }, 'Erro ao salvar equipamento');
  },

  saveInspection(db, { employee, workspaceId, data, inspectionTypeLabel }) {
    return runService(async () => {
      const payload = { ...data, employee_id: employee.id, workspace_id: workspaceId };
      if (payload._isNew) {
        delete payload._isNew;
        await db.Inspection.create(payload);
        await db.Equipment.update(data.equipment_id, {
          last_inspection_date: data.date,
          audit_trail: [{
            action: `Inspeção ${inspectionTypeLabel || data.type}`,
            user: employee.name,
            timestamp: new Date().toISOString(),
            details: data.result,
          }],
        });
        return;
      }
      await db.Inspection.update(payload.id, payload);
    }, 'Erro ao salvar inspeção');
  },

  saveChecklist(db, { employeeId, workspaceId, data }) {
    return runService(() => {
      const payload = { ...data, employee_id: employeeId, workspace_id: workspaceId };
      if (payload._isNew) {
        delete payload._isNew;
        return db.EmployeeChecklist.create(payload);
      }
      return db.EmployeeChecklist.update(payload.id, payload);
    }, 'Erro ao salvar checklist');
  },
};
