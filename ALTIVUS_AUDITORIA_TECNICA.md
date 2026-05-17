# Auditoria Tecnica Altivus

Data: 2026-05-16  
Escopo: analise estatica completa do projeto extraido de `altivus (3).zip`.  
Restricao aplicada: nenhum arquivo do produto foi alterado.

## Sumario executivo

O projeto Altivus atual e um aplicativo React + Vite, nao Next.js, com backend/dados via Base44 SDK. Nao ha dependencia `@supabase/supabase-js`, pasta `supabase`, migrations SQL, RLS ou policies locais para auditar. Portanto, a parte Supabase deve ser tratada como arquitetura futura/migracao, nao como backend existente.

Arquiteturalmente, a aplicacao ja possui uma tentativa importante de multiempresa via `workspace_id`, `WorkspaceContext`, `useWorkspaceEntities` e React Query. O maior risco atual esta em inconsistencias nessa camada: alguns componentes ainda chamam `base44.entities.*` diretamente sem filtro por workspace e com query keys globais, enquanto outros usam o proxy multi-tenant. Isso pode causar vazamento/cross-tenant, cache poluido entre empresas e telas com dados incorretos.

Os tres pontos mais criticos sao:

1. Isolamento multi-tenant parcial: `workspaceClient.update/delete` nao validam pertencimento e alguns fluxos ignoram `workspaceId`.
2. Entidade `MaterialMovement` usada no codigo, mas ausente em `base44/entities`, gerando risco de quebra no Diario de Campo.
3. Realtime quase inexistente para dados operacionais; a aplicacao depende de cache/invalidation/refetch manual.

## Stack real encontrada

- Build/app: Vite 6 + React 18 + React Router.
- Dados/auth: `@base44/sdk`.
- Estado remoto: `@tanstack/react-query`.
- UI: componentes Radix/shadcn-like, Tailwind, lucide.
- PDF/relatorios: `jspdf`, `html2canvas`.
- Nao encontrado: Next.js, Supabase client, migrations, SQL, RLS, Edge Functions Supabase.

Arquivos base:

- `package.json`
- `vite.config.js`
- `src/api/base44Client.js`
- `src/lib/AuthContext.jsx`
- `src/lib/WorkspaceContext.jsx`
- `src/lib/workspaceClient.js`
- `src/lib/useAppData.js`
- `base44/entities/*.jsonc`

## Estrutura do projeto

### Pontos positivos

- Separacao razoavel entre `pages`, `components`, `lib`, `api` e schemas Base44.
- Existe camada central de dados em `useAppData.js`.
- Existe proxy de entidades por workspace em `workspaceClient.js`.
- Existem schemas declarativos em `base44/entities`.
- Componentes UI estao concentrados em `src/components/ui`.

### Problemas encontrados

| Gravidade | Problema | Impacto | Arquivos envolvidos | Solucao recomendada |
|---|---|---|---|---|
| Alta | Projeto descrito como Next/Supabase, mas implementado como Vite/Base44 | Decisoes futuras podem partir de premissa errada; migracao exige plano explicito | `package.json`, `vite.config.js`, `src/api/base44Client.js` | Formalizar arquitetura atual e criar ADR antes de migrar |
| Alta | `MaterialMovement` e usado, mas nao existe schema em `base44/entities` | Diario de Campo pode falhar ao fechar consumo/aprovar movimentos | `src/components/fieldlog/FieldLogEntry.jsx`, `FieldLogDashboard.jsx`, `ApprovalPanel.jsx`, `base44/entities` | Criar schema `MaterialMovement` ou remover/reprojetar chamadas apos validacao |
| Media | Duplicidade de `StatusBadge` | Design e comportamento divergentes para mesmo conceito | `src/components/ui/StatusBadge.jsx`, `src/components/shared/StatusBadge.jsx` | Unificar API visual sem alterar aparencia por etapa |
| Media | Componentes muito grandes | Manutencao lenta, maior risco em mudancas | `AttendanceTab.jsx` 573 linhas, `WorkspaceAdmin.jsx` 529, `ActivityDetailPanel.jsx` 495, `Teams.jsx` 453 | Refatorar por fluxo/hooks, mantendo snapshots visuais |
| Media | Encoding/mojibake em textos e comentarios | Textos quebrados em ambiente local, risco de UX ruim | varios arquivos exibem `NÃ£o`, `ExecuÃ§Ã£o`, emojis corrompidos | Normalizar encoding UTF-8 em etapa isolada |
| Baixa | Dependencias possivelmente nao usadas | Bundle maior, superficie de manutencao | `package.json` | Confirmar via bundle/analyzer apos instalar dependencias |

## Frontend e performance

### Achados

1. React Query e usado, mas as query keys nao sao totalmente consistentes.
   - Padrao bom: `['activities', workspaceId]`.
   - Padrao ruim: `['activities']` com `base44.entities.Activity.list()`.
   - Impacto: cache compartilhado entre workspaces, dados antigos entre abas e refetch incorreto.

2. Muitos filtros e agregacoes rodam no cliente sobre listas completas.
   - Exemplos: dashboard, produtividade, materiais, diretor.
   - Impacto: aceitavel em pequeno volume, mas degrada em operacao industrial real.

3. Invalidation parcial.
   - `ApprovalPanel` invalida `['material_movements', workspaceId]`, mas consultas usam `['movements', workspaceId]`.
   - `OperationalMapTab` invalida `['operationalMaps']`, enquanto queries usam workspace/activity.
   - Impacto: tela pode nao atualizar depois de mutacoes.

4. Alguns componentes fazem chamadas diretas ao Base44 dentro de substeps.
   - `StepWorkdayStart.jsx`, `StepStart.jsx`, `TeamAllocationView.jsx`.
   - Impacto: contorna isolamento multi-tenant e cache padronizado.

5. Uso de reload/navegacao hard.
   - `MasterRepair.jsx` e `JoinWorkspace.jsx` usam `window.location.reload`/`href`.
   - Impacto: mascara problemas de estado e piora UX.

## Autenticacao e workspace

### Achados

| Gravidade | Problema | Impacto | Arquivos | Recomendacao |
|---|---|---|---|---|
| Alta | Cliente criado com `requiresAuth: false` apesar de haver fluxos autenticados | Risco conceitual/operacional: protecao depende do SDK/ambiente e nao fica explicita | `src/api/base44Client.js` | Validar modelo Base44 e documentar; ajustar so com teste de login |
| Alta | Token e parametros ficam em `localStorage` via `app-params.js` | Maior exposicao a XSS e problemas entre abas | `src/lib/app-params.js` | Se migrar para Supabase, usar refresh/session oficial; no Base44, reduzir persistencia quando possivel |
| Alta | `WorkspaceContext` seleciona workspace via `localStorage`, sem sincronizacao multi-aba | Troca de workspace em uma aba nao atualiza outra | `WorkspaceContext.jsx` | Escutar evento `storage`/BroadcastChannel e invalidar queries por workspace |
| Media | `loadMemberships` busca workspaces via `Promise.all(get)` | N+1 requests por usuario com muitos workspaces | `WorkspaceContext.jsx` | Criar endpoint/listagem por IDs ou query unica |
| Media | `last_seen_at` em todo load/troca | Escritas frequentes e ruido operacional | `WorkspaceContext.jsx` | Debounce/throttle ou job separado |
| Media | Trial/bloqueio e apenas banner, nao enforcement de acesso | Workspace bloqueado ainda pode usar rotas | `TrialBanner.jsx`, `AppLayout.jsx` | Criar guard de status de workspace antes das rotas operacionais |

## Backend/Base44 e seguranca

Nao ha Supabase local para analisar RLS. No backend atual, o isolamento e feito principalmente no cliente.

### Problemas criticos

1. `createWorkspaceClient(null)` retorna cliente direto sem filtro.
   - Arquivo: `src/lib/workspaceClient.js`.
   - Causa: fallback para admin/master ou estado ainda sem workspace.
   - Impacto: qualquer componente renderizado antes do workspace pronto pode buscar dados globais se usar o cliente direto.
   - Solucao: cliente sem workspace deve falhar fechado para entidades operacionais; admin deve usar cliente explicito separado.

2. `update` e `delete` nao validam pertencimento.
   - Arquivo: `src/lib/workspaceClient.js`.
   - O comentario fala em validacao, mas a implementacao apenas chama `ent.update(id, rest)` e `ent.delete(id)`.
   - Impacto: se um ID de outro workspace vazar/for manipulado, a operacao pode atingir outro tenant.
   - Solucao: validar `get(id)` antes de update/delete ou mover enforcement para backend/RLS.

3. Chamadas diretas ao `base44.entities` em telas operacionais.
   - Arquivos: `StepWorkdayStart.jsx`, `StepStart.jsx`, `TeamAllocationView.jsx`.
   - Impacto: bypass de workspace.
   - Solucao: migrar para `useWorkspaceEntities`/`useAppData` com queryKey contendo `workspaceId`.

4. RBAC e majoritariamente client-side.
   - Arquivos: `usePermissions.js`, paginas com guards locais.
   - Impacto: melhora UX, mas nao e controle de seguranca forte.
   - Solucao: regras no backend/Base44 ou, em Supabase futuro, RLS por membership.

## Realtime

### Estado atual

- Realtime operacional nao esta implementado de forma sistemica.
- `workspaceClient` expoe `subscribe`, mas quase nenhum modulo operacional usa.
- `MaintenanceAgent.jsx` assina conversas do agente e limpa o listener corretamente.
- O restante depende de React Query + invalidations manuais.

### Impacto

- Atualizacoes em outra aba/usuario nao aparecem sem refetch/navegacao.
- Risco de painel operacional atrasado em ambiente industrial.
- Mutacoes concorrentes podem sobrescrever estoque/progresso.

### Recomendacao

1. Criar `RealtimeProvider` por workspace.
2. Assinar entidades criticas: `Activity`, `ActivitySession`, `AttendanceRecord`, `Material`, `FieldLog`, `Appointment`.
3. Em cada evento, atualizar/invalidate query keys especificas do workspace.
4. Usar BroadcastChannel para sincronizar workspace ativo e invalidations entre abas.
5. Para estoque/progresso, preferir operacoes atomicas ou transacoes no backend.

## UX operacional

### Gargalos

- Muitos spinners/refetches por pagina em vez de uma estrategia coerente de cache quente.
- Fechamento de Diario de Campo faz varias atualizacoes em paralelo sem transacao.
- Fluxos de fotos/mapas podem gerar payloads grandes e latencia perceptivel.
- Bloqueio/trial aparece como banner, mas nao impede fluxo operacional.
- Textos com encoding corrompido podem aparecer em producao se os arquivos estiverem realmente gravados assim.

## Escalabilidade SaaS/multiempresa

### Limitacoes atuais

- Multi-tenant esta no cliente, nao no banco/backend.
- Listagens trazem dados amplos e filtram/agregam no browser.
- Sem paginação consistente em entidades centrais.
- Sem camada de dominio/transacao para operacoes compostas.
- Sem separacao clara entre plataforma admin e workspace app.
- Sem observabilidade tecnica: logs estruturados, tracing, metricas de query, auditoria central.

## Prioridades recomendadas

### P0 - Estabilidade e seguranca

1. Mapear todas as chamadas diretas `base44.entities.*` em rotas operacionais.
2. Corrigir isolamento do `workspaceClient`: fail-closed sem workspace, validar update/delete.
3. Resolver `MaterialMovement`: criar schema ou retirar fluxo dependente.
4. Corrigir query keys/invalidation inconsistentes.
5. Adicionar guard real para workspace bloqueado/expirado.

### P1 - Performance operacional

1. Padronizar `useAppData` como unica entrada para dados operacionais.
2. Separar componentes grandes em hooks/componentes menores.
3. Introduzir paginação/limits coerentes em listas pesadas.
4. Memoizar agregacoes pesadas e revisar renders de dashboards.
5. Medir bundle e remover dependencias nao usadas.

### P2 - Realtime

1. Criar provider de realtime por workspace.
2. Atualizar cache React Query por evento.
3. Sincronizar abas com BroadcastChannel.
4. Criar estrategia de conflito para estoque, apontamentos e sessoes.

### P3 - Arquitetura enterprise

1. Criar camada de dominio/servicos: `activityService`, `fieldLogService`, `materialService`.
2. Criar testes de regressao para auth/workspace/RBAC.
3. Criar auditoria central de eventos.
4. Planejar migracao para Supabase/Postgres com RLS se esse for o destino.

## Plano de refatoracao seguro

### Etapa 1 - Inventario e protecoes sem visual

Motivo: reduzir risco antes de mexer em fluxos.  
Impacto: nenhum visual esperado.  
Dependencias afetadas: data layer, React Query.

- Adicionar testes/checklist para login, troca de workspace, CRUD basico e diario.
- Documentar entidades e query keys existentes.
- Corrigir encoding em etapa separada se confirmado.

### Etapa 2 - Isolamento multi-tenant

Motivo: evitar vazamento de dados e cache cross-tenant.  
Impacto: rotas podem passar a mostrar loading/erro quando workspace nao esta pronto, em vez de dados globais.  
Dependencias afetadas: `workspaceClient`, `useWorkspaceEntities`, `useAppData`, componentes operacionais.

- Alterar cliente sem workspace para falhar fechado em entidades operacionais.
- Criar cliente admin explicito para AdminMaster/MasterRepair.
- Migrar chamadas diretas ao `base44.entities` em componentes operacionais.
- Padronizar query keys com `workspaceId`.

### Etapa 3 - Consistencia de mutacoes

Motivo: garantir que tela atualize sem refresh.  
Impacto: melhora pos-salvamento, sem alterar design.  
Dependencias afetadas: React Query, fluxos de materials, maps, appointments, fieldlog.

- Corrigir invalidations inconsistentes.
- Criar helpers de invalidation por entidade.
- Revisar fluxos compostos com rollback/log de erro.

### Etapa 4 - Diario de Campo e estoque

Motivo: fluxo industrial critico e hoje tem risco de entidade ausente e concorrencia.  
Impacto: fechamento/aprovacao mais confiaveis.  
Dependencias afetadas: `FieldLog`, `Material`, `MaterialMovement`, `Contract`.

- Definir schema `MaterialMovement`.
- Transformar baixa de estoque + movimento + contrato em operacao transacional no backend quando possivel.
- Evitar dupla baixa com idempotency key por `field_log_id`.

### Etapa 5 - Realtime operacional

Motivo: reduzir refresh manual e atraso entre usuarios/abas.  
Impacto: dados atualizam automaticamente; exige cuidado para nao gerar excesso de invalidations.  
Dependencias afetadas: React Query, WorkspaceContext, entidades criticas.

- Realtime por workspace.
- BroadcastChannel para abas.
- Atualizacao incremental de cache para eventos simples; invalidation para eventos complexos.

### Etapa 6 - Escala enterprise

Motivo: preparar SaaS industrial multiempresa.  
Impacto: arquitetura mais modular e auditavel.  
Dependencias afetadas: servicos, auth, backend.

- Separar plataforma admin de workspace operacional.
- Criar servicos de dominio.
- Introduzir observabilidade e auditoria.
- Se migrar para Supabase: Postgres + RLS + Edge Functions para operacoes criticas.

## Arquitetura futura ideal

### Curto prazo no Base44

- UI preservada.
- React Query como cache unico.
- `WorkspaceProvider` + `WorkspaceDataProvider` + `RealtimeProvider`.
- Cliente operacional fail-closed.
- Cliente admin separado.
- Servicos por dominio para operacoes compostas.

### Futuro em Supabase/Postgres

- `workspaces`, `workspace_members`, `activities`, `sessions`, `materials`, `material_movements`, `field_logs`, `appointments`.
- RLS por `workspace_id` e membership ativa.
- Policies separadas por role.
- Edge Functions para:
  - fechar diario de campo;
  - baixa de estoque;
  - aprovacao;
  - geracao de relatorio;
  - convites.
- Supabase Realtime filtrado por workspace.
- Storage com buckets privados por workspace e signed URLs.
- Auditoria append-only para eventos criticos.

## Melhorias enterprise sugeridas

- Idempotency keys para operacoes de campo.
- Audit log central por workspace/user/action.
- Feature flags por workspace.
- Billing/limits aplicados no backend.
- Rate limiting por workspace.
- Observabilidade: erros, latencia de queries, volume de eventos realtime.
- Backups/exportacao por workspace.
- Politicas de retencao de fotos e relatorios.
- Controle offline-first para campo, se equipes usarem mobile em area instavel.

## Verificacao executada

- Estrutura e arquivos mapeados com `rg --files` e `Get-ChildItem`.
- Busca por chamadas de dados/auth/realtime/localStorage.
- Leitura dos contexts, cliente de workspace, hooks de dados, schemas e paginas criticas.
- `npm run lint` e `npm run build` nao puderam executar porque o ZIP nao inclui `node_modules`; usando `npm.cmd`, os comandos falharam por ausencia de binarios locais (`eslint`, `vite`).

## Observacao final

Antes de qualquer implementacao, a recomendacao e tratar a Etapa 2 como fundacao: garantir que toda leitura/escrita operacional esteja isolada por workspace. Esse e o ponto que mais protege estabilidade, seguranca e escalabilidade sem alterar o visual atual.

## Correcoes aplicadas em 2026-05-16

Arquivos alterados sem mudanca intencional de layout:

- `src/lib/workspaceClient.js`
  - `createWorkspaceClient(null)` agora falha fechado em vez de usar cliente global.
  - `update` e `delete` validam o `workspace_id` do registro antes de alterar/remover.
  - Adicionado `createAdminClient()` para acesso global explicito de telas administrativas.

- `src/lib/WorkspaceContext.jsx`
  - Adicionada sincronizacao de workspace ativo entre abas via evento `storage`.

- `src/lib/useWorkspaceRealtime.js`
  - Criado hook de realtime por workspace para invalidar caches React Query das entidades criticas.

- `src/components/layout/AppLayout.jsx`
  - Ativado realtime operacional.
  - Adicionado bloqueio operacional para workspace bloqueado ou expirado.

- `src/components/layout/TrialBanner.jsx`
  - Banner agora usa `currentWorkspace`, nao o primeiro workspace global.

- `src/components/fieldlog/steps/StepWorkdayStart.jsx`
- `src/components/fieldlog/steps/StepCloseDay.jsx`
- `src/components/fieldlog/steps/StepActivities.jsx`
- `src/components/appointments/steps/StepStart.jsx`
- `src/components/teams/TeamAllocationView.jsx`
- `src/components/operationalmap/OperationalMapTab.jsx`
- `src/pages/Activities.jsx`
- `src/components/activities/RecalcButton.jsx`
  - Removidos bypasses operacionais diretos de `base44.entities.*`.
  - Queries operacionais agora usam `workspaceId` nas query keys.
  - Escritas operacionais agora passam pelo cliente isolado por workspace.

- `base44/entities/MaterialMovement.jsonc`
  - Criado schema da entidade ja usada pelo Diario de Campo.

- `src/components/fieldlog/FieldLogEntry.jsx`
  - Movimentacoes de material agora registram `activity_id` e `movement_at`.
  - Fechamento de diario ganhou protecao contra dupla baixa/duplo incremento usando `stock_committed`.
  - Cache de `material_movements` e invalidado apos fechamento.

- `src/components/fieldlog/ApprovalPanel.jsx`
- `src/components/appointments/AppointmentApproval.jsx`
  - Aprovacao agora usa permissoes do workspace (`usePermissions`) em vez de confiar no `user.role` global.

- `src/pages/AdminMaster.jsx`
- `src/pages/MasterRepair.jsx`
- `base44/functions/repairMasterWorkspace/entry.ts`
  - Acesso global passou a usar cliente admin explicito.
  - Queries globais foram condicionadas a `user.role === 'admin'`.
  - `MaterialMovement` foi incluido na ferramenta de reparo master.

Validacoes realizadas apos as correcoes:

- Busca estatica confirmou ausencia de chamadas operacionais diretas para `base44.entities.Contract/Activity/Employee/Team/Area/Material/Unit/ServiceType/OperationalMap`.
- Busca estatica confirmou ausencia de query keys globais para `contracts`, `activities`, `employees`, `teams`, `areas`, `materials`, `units`, `serviceTypes`.
- `npm install` foi concluido em nova tentativa com acesso de rede aprovado.
- `npm run lint` passou sem erros.
- `npm exec eslint .` passou sem erros e sem warnings apos limpeza de imports/variaveis nao utilizadas.
- `npm run build` passou; o aviso `[base44] Proxy not enabled (VITE_BASE44_APP_BASE_URL not set)` indica apenas ausencia de variavel local para proxy Base44.
- `npm audit --audit-level=moderate` retornou `found 0 vulnerabilities`.
