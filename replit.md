# Planton

Plataforma para médicos encontrarem plantões médicos disponíveis próximos à sua localização, e para hospitais e clínicas publicarem vagas rapidamente.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080)
- `pnpm --filter @workspace/planton-app run dev` — Frontend web (port auto)
- `pnpm --filter @workspace/planton-ds run dev` — Design system preview
- `pnpm run typecheck` — typecheck completo em todos os pacotes
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks e Zod schemas do OpenAPI spec
- `pnpm --filter @workspace/db run push` — aplicar schema no banco (dev only)
- `pnpm --filter @workspace/planton-ds run tokens` — rebuildar CSS e tokens após editar tokens.json

## Required env

- `DATABASE_URL` — Postgres connection string (provisionado automaticamente)
- `SESSION_SECRET` — segredo para sessões Express (configurado como Replit Secret)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Wouter + React Query
- Design system: @workspace/planton-ds (Inter, primary #155EEF, accent #0E9384)
- Map: react-leaflet + OpenStreetMap (sem API key)
- Validation: Zod, drizzle-zod, Orval codegen

## Where things live

- `lib/api-spec/openapi.yaml` — contrato da API (source of truth)
- `lib/db/src/schema/` — schema do banco (users, shifts, applications)
- `artifacts/api-server/src/routes/` — rotas: auth.ts, shifts.ts, applications.ts
- `artifacts/api-server/src/middlewares/auth.ts` — requireAuth, requireHospital, requireDoctor
- `artifacts/planton-app/src/pages/` — páginas do frontend
- `artifacts/planton-ds/tokens.json` — tokens do design system (única fonte da verdade)

## Architecture decisions

- Auth via express-session (cookie HttpOnly) + bcryptjs — sem JWT para MVP
- Sessions armazenadas em memória (express-session default) — considerar connect-pg-simple em produção
- OpenAPI spec usa `type: number` em vez de `type: integer` para compatibilidade com Orval + Zod v3
- Design system (@workspace/planton-ds) como dependência workspace — todos os componentes UI vêm dele
- react-leaflet + OpenStreetMap para mapa interativo sem custo de API key

## Product

- **Médico**: busca plantões por especialidade/cidade/data/valor, visualiza no mapa e lista, se candidata com "Tenho interesse"
- **Hospital**: publica plantões, visualiza candidatos, seleciona ou rejeita médicos
- Status de plantão: ABERTO / PREENCHIDO / CANCELADO / ENCERRADO
- Status de candidatura: PENDENTE / SELECIONADO / REJEITADO

## Seed data (dev)

- Hospitais: sirio@planton.dev, hc@planton.dev, moinhos@planton.dev, einstein@planton.dev
- Médicos: joao@planton.dev, maria@planton.dev
- Todos com senha: `senha123`
- 12 plantões em SP e Porto Alegre já cadastrados

## User preferences

_Preencher conforme o usuário instrui ao longo do projeto._

## Gotchas

- Após cada mudança no `lib/api-spec/openapi.yaml`, rodar `codegen` antes de usar os tipos
- O design system regenera `src/index.css` e `src/generated/tokens.tsx` automaticamente ao editar `tokens.json` — nunca editar esses arquivos diretamente
- Nunca usar `type: integer` no OpenAPI spec (usar `type: number`) — Orval v8 gera `zod.int()` que não existe no Zod v3
- Sessions em prod precisam de store persistente (connect-pg-simple) para sobreviver a restarts

## Pointers

- Ver `pnpm-workspace` skill para estrutura do monorepo
- Ver `artifacts/planton-ds/docs/AGENTS.md` para regras do design system
