import { runService } from '@/services/serviceUtils';

export const operationalMapService = {
  createMap(db, data) {
    return runService(() => db.OperationalMap.create(data), 'Erro ao criar mapa operacional');
  },

  updateMap(db, id, data) {
    return runService(() => db.OperationalMap.update(id, data), 'Erro ao atualizar mapa operacional');
  },

  deleteMap(db, id) {
    return runService(() => db.OperationalMap.delete(id), 'Erro ao remover mapa operacional');
  },
};
