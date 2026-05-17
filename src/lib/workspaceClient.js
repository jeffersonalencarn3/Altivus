import { base44 } from '@/api/base44Client';

/**
 * workspaceClient
 * ───────────────
 * Proxy de segurança que envolve base44.entities com isolamento por workspace_id.
 *
 * Regras aplicadas automaticamente:
 *  • list()    → filtra por { workspace_id }
 *  • filter()  → injeta { workspace_id } no filtro
 *  • get()     → busca normalmente (leve — registro único)
 *  • create()  → injeta workspace_id no payload (imutável)
 *  • update()  → valida que o registro pertence ao workspace antes de atualizar
 *  • delete()  → valida que o registro pertence ao workspace antes de deletar
 *
 * workspace_id nunca é exposto ao chamador — ele vem da closure.
 */
export function createWorkspaceClient(workspaceId) {
  if (!workspaceId) {
    return buildBlockedClient();
  }

  return buildClient(workspaceId);
}

export function createAdminClient() {
  return buildDirectClient();
}

function buildClient(workspaceId) {
  function entity(name) {
    const ent = base44.entities[name];

    return {
      /** Lista todos os registros do workspace */
      list(sort, limit) {
        return ent.filter({ workspace_id: workspaceId }, sort, limit);
      },

      /** Filtra com critérios adicionais dentro do workspace */
      filter(query, sort, limit) {
        return ent.filter({ ...query, workspace_id: workspaceId }, sort, limit);
      },

      /** Busca por ID — valida pertencimento ao workspace */
      async get(id) {
        const record = await ent.get(id);
        assertWorkspaceRecord(record, workspaceId);
        return record;
      },

      /** Cria injetando workspace_id de forma imutável */
      create(data) {
        const { workspace_id: _ignored, ...rest } = data; // remove qualquer tentativa manual
        return ent.create({ ...rest, workspace_id: workspaceId });
      },

      /** Criação em lote */
      async bulkCreate(items) {
        const safe = items.map(({ workspace_id: _ignored, ...rest }) => ({
          ...rest,
          workspace_id: workspaceId,
        }));
        return ent.bulkCreate(safe);
      },

      /** Atualiza — injeta workspace_id diretamente, sem double-fetch de validação */
      async update(id, data) {
        const { workspace_id: _ignored, ...rest } = data;
        await assertRecordBelongsToWorkspace(ent, id, workspaceId);
        return ent.update(id, rest);
      },

      /** Deleta — sem double-fetch de validação (workspace_id já está no filtro de list/filter) */
      async delete(id) {
        await assertRecordBelongsToWorkspace(ent, id, workspaceId);
        return ent.delete(id);
      },

      /** Schema da entidade (sem dados) */
      schema() {
        return ent.schema();
      },

      /** Subscribe a eventos em tempo real (filtragem por workspace no handler) */
      subscribe(callback) {
        return ent.subscribe((event) => {
          // Só repassa eventos do próprio workspace
          if (!event.data?.workspace_id || event.data.workspace_id === workspaceId) {
            callback(event);
          }
        });
      },
    };
  }

  // Proxy que cria o wrapper de entidade sob demanda
  return new Proxy({}, {
    get(_, name) {
      return entity(name);
    },
  });
}

async function assertRecordBelongsToWorkspace(ent, id, workspaceId) {
  const record = await ent.get(id);
  assertWorkspaceRecord(record, workspaceId);
  return record;
}

function assertWorkspaceRecord(record, workspaceId) {
  if (!record) {
    throw new Error('Registro não encontrado.');
  }
  if (record.workspace_id !== workspaceId) {
    throw new Error('Acesso negado: registro não pertence ao seu workspace.');
  }
}

function buildBlockedClient() {
  const fail = () => {
    throw new Error('Workspace ativo não definido. Aguarde o carregamento do workspace antes de acessar dados operacionais.');
  };

  function entity() {
    return {
      list: fail,
      filter: fail,
      get: fail,
      create: fail,
      bulkCreate: fail,
      update: fail,
      delete: fail,
      schema: fail,
      subscribe: fail,
    };
  }

  return new Proxy({}, { get() { return entity(); } });
}

/** Cliente direto: usa base44.entities sem filtro de workspace (para admin master) */
function buildDirectClient() {
  function entity(name) {
    const ent = base44.entities[name];
    return {
      list(sort, limit)           { return ent.list(sort, limit); },
      filter(query, sort, limit)  { return ent.filter(query, sort, limit); },
      get(id)                     { return ent.get(id); },
      create(data)                { return ent.create(data); },
      bulkCreate(items)           { return ent.bulkCreate(items); },
      update(id, data)            { return ent.update(id, data); },
      delete(id)                  { return ent.delete(id); },
      schema()                    { return ent.schema(); },
      subscribe(callback)         { return ent.subscribe(callback); },
    };
  }
  return new Proxy({}, { get(_, name) { return entity(name); } });
}
