import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createWorkspaceClient } from '@/lib/workspaceClient';
import { useWorkspace } from '@/lib/useWorkspace';
import { invalidateWorkspaceQueries } from '@/services/serviceUtils';
import { applyRealtimeEntityEvent } from '@/services/realtimeService';

const ENTITY_QUERY_KEYS = {
  Activity: ['activities'],
  ActivityEmployee: ['activityEmployees', 'allActivityEmployees'],
  ActivityMaterial: ['activityMaterials', 'allActivityMaterials'],
  ActivityOperationalReport: ['operationalReports'],
  ActivitySession: ['activitySessions'],
  Appointment: ['appointments'],
  AttendanceRecord: ['attendanceRecords'],
  Contract: ['contracts'],
  Employee: ['employees'],
  Equipment: ['equipments'],
  FieldLog: ['fieldlogs'],
  Inspection: ['inspections'],
  Material: ['materials'],
  MaterialMovement: ['material_movements'],
  OperationalMap: ['operationalMaps'],
  OperationalLog: ['operationalLogs'],
  Team: ['teams'],
};

function unsubscribe(subscription) {
  if (!subscription) return;
  if (typeof subscription === 'function') {
    subscription();
    return;
  }
  subscription.unsubscribe?.();
}

export function useWorkspaceRealtime() {
  const { workspaceId } = useWorkspace();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!workspaceId) return undefined;

    const db = createWorkspaceClient(workspaceId);
    const subscriptions = [];

    Object.entries(ENTITY_QUERY_KEYS).forEach(([entityName, keys]) => {
      const entity = db[entityName];
      if (!entity?.subscribe) return;

      try {
        const sub = entity.subscribe((event) => {
          const handled = applyRealtimeEntityEvent(queryClient, workspaceId, entityName, event, keys);
          if (!handled) {
            invalidateWorkspaceQueries(queryClient, workspaceId, keys);
          }
        });
        subscriptions.push(sub);
      } catch {
        // Algumas entidades/ambientes podem nao expor subscribe; o cache manual continua funcionando.
      }
    });

    return () => {
      subscriptions.forEach(unsubscribe);
    };
  }, [queryClient, workspaceId]);
}
