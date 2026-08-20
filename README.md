# Planton

**Planton** é uma plataforma MVP que aproxima médicos de plantões disponíveis e hospitais ou clínicas que precisam preencher vagas com agilidade.

O produto centraliza oportunidades que normalmente ficam dispersas em grupos, indicações e contatos pessoais. A experiência prioriza **localização, disponibilidade, remuneração e velocidade** para que médicos encontrem plantões relevantes em poucos segundos.

> **Status:** MVP em desenvolvimento.

## Problema que resolvemos

Encontrar um plantão médico costuma exigir acompanhar muitos canais e comparar manualmente local, data, especialidade e valor. Ao mesmo tempo, instituições precisam divulgar vagas e receber candidatos com rapidez.

O Planton reúne essas duas necessidades em um único fluxo:

- médicos descobrem oportunidades em lista e mapa;
- hospitais e clínicas publicam vagas e analisam candidaturas;
- as informações essenciais de cada plantão ficam acessíveis e comparáveis.

## Principais funcionalidades

### Para médicos

- Cadastro e login de perfil médico;
- Descoberta de plantões abertos em **lista e mapa**;
- Filtros por especialidade, cidade, data e faixa de remuneração;
- Visualização de detalhes: instituição, endereço, data, horário, especialidade, valor, descrição e requisitos;
- Geolocalização pelo navegador e enquadramento automático dos plantões no mapa;
- Seleção integrada entre card da lista e marcador do mapa;
- Candidatura com o CTA **“Tenho interesse”**;
- Área para acompanhar as próprias candidaturas.

### Para hospitais e clínicas

- Cadastro e login de perfil institucional;
- Publicação de plantões com data, horários, especialidade, remuneração, localização, descrição e requisitos;
- Consulta dos plantões publicados;
- Visualização dos candidatos de cada vaga;
- Seleção ou rejeição de candidatos.

### Gestão de status

| Entidade    | Status disponíveis                               |
| ----------- | ------------------------------------------------ |
| Plantão     | `ABERTO`, `PREENCHIDO`, `CANCELADO`, `ENCERRADO` |
| Candidatura | `PENDENTE`, `SELECIONADO`, `REJEITADO`           |

## Fluxos principais

### Médico

```text
Entrar na plataforma
        ↓
Explorar mapa e lista de plantões
        ↓
Aplicar filtros e abrir detalhes
        ↓
Demonstrar interesse
        ↓
Acompanhar o status da candidatura
```

### Hospital ou clínica

```text
Entrar na plataforma
        ↓
Publicar plantão
        ↓
Receber candidaturas
        ↓
Analisar profissionais
        ↓
Selecionar ou rejeitar candidatos
```

## Mapa de plantões

O mapa interativo usa OpenStreetMap e Leaflet, sem depender de chave de API externa. Ele inclui:

- marcadores para vagas com coordenadas cadastradas;
- popup com instituição, especialidade, data, horário, cidade e remuneração;
- ação **Ver detalhes** em cada marcador;
- destaque do plantão selecionado;
- controles para reenquadrar todos os resultados e usar a localização atual;
- sincronização entre a seleção no mapa e os cards da lista;
- adaptação para a aba de mapa em dispositivos móveis.

## Arquitetura

```text
React + Vite (web)
        │
        │  /api · cookies de sessão
        ▼
Express API
        │
        ▼
PostgreSQL + Drizzle ORM
```

O repositório é organizado como um monorepo com `pnpm workspaces`:

```text
artifacts/
├── planton-app/       # Aplicação web React
├── api-server/        # API Express
└── planton-ds/        # Design system e tokens visuais
lib/
├── api-spec/          # Contrato OpenAPI (fonte da verdade da API)
├── api-client-react/  # Cliente React gerado a partir do contrato
├── api-zod/           # Schemas Zod gerados
└── db/                # Schema e acesso ao PostgreSQL com Drizzle
attached_assets/
└── PRD_*.md           # Documento de requisitos do produto
```

## Stack

- **Frontend:** React 19, Vite, TypeScript, Wouter e TanStack Query;
- **Interface:** Planton Design System, Tailwind CSS e Radix UI;
- **Mapa:** React Leaflet, Leaflet e OpenStreetMap;
- **API:** Node.js, Express 5, `express-session` e `bcryptjs`;
- **Banco:** PostgreSQL e Drizzle ORM;
- **Contratos e validação:** OpenAPI, Orval, Zod e drizzle-zod;
- **Gerenciador de pacotes:** pnpm workspaces.

## Como executar

### Pré-requisitos

- Node.js 24 ou superior;
- pnpm;
- PostgreSQL acessível por uma `DATABASE_URL`;
- uma chave segura para `SESSION_SECRET`.

### 1. Instale as dependências

```bash
pnpm install
```

### 2. Configure as variáveis de ambiente

```bash
export DATABASE_URL="postgresql://usuario:senha@host:5432/planton"
export SESSION_SECRET="substitua-por-uma-chave-aleatoria-e-segura"
```

> Nunca versione valores reais de `DATABASE_URL` ou `SESSION_SECRET`. No Replit, configure esses valores no gerenciamento de Secrets.

### 3. Aplique o schema do banco

```bash
pnpm --filter @workspace/db run push
```

### 4. Inicie a API

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
```

### 5. Inicie a aplicação web

Em outro terminal:

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/planton-app run dev
```

O frontend consome a API no caminho `/api`. No ambiente Replit, os workflows configurados fazem esse roteamento. Em uma execução local com serviços em portas diferentes, configure um proxy reverso para encaminhar `/api` ao servidor Express.

### Comandos úteis

```bash
# Verificar todos os pacotes TypeScript
pnpm run typecheck

# Gerar novamente cliente React e schemas Zod após alterar a especificação OpenAPI
pnpm --filter @workspace/api-spec run codegen

# Recriar tokens gerados do Design System após editar tokens.json
pnpm --filter @workspace/planton-ds run tokens

# Gerar build da aplicação web
pnpm --filter @workspace/planton-app run build
```

## API

O contrato completo está em [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml). Os principais grupos de endpoints são:

| Grupo        | Endpoints principais                                                                           | Finalidade                                 |
| ------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Saúde        | `GET /api/healthz`                                                                             | Verifica a disponibilidade da API          |
| Autenticação | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Cria e gerencia sessões                    |
| Plantões     | `GET/POST /api/shifts`, `GET/PATCH/DELETE /api/shifts/:id`                                     | Descobre e gerencia vagas                  |
| Candidatos   | `GET /api/shifts/:id/applications`                                                             | Lista candidatos de um plantão do hospital |
| Candidaturas | `GET/POST /api/applications`, `PATCH /api/applications/:id`                                    | Cria e atualiza candidaturas               |

### Regras de acesso

- somente perfis institucionais podem criar, alterar ou remover os próprios plantões;
- somente o hospital dono da vaga pode visualizar seus candidatos ou atualizar uma candidatura;
- uma candidatura só pode ser feita para um plantão `ABERTO`;
- um médico não pode se candidatar duas vezes ao mesmo plantão;
- sessões usam cookies `HttpOnly` e as senhas são armazenadas com hash via `bcryptjs`.

## Design System

Toda a interface usa o pacote interno `@workspace/planton-ds`. Os tokens visuais têm como fonte de verdade:

```text
artifacts/planton-ds/tokens.json
```

Os principais fundamentos visuais são a fonte **Inter**, o azul primário `#155EEF` e o teal de destaque `#0E9384`.

## Escopo do MVP

O foco do Planton é ser a forma mais rápida de descobrir e preencher plantões médicos próximos. Por isso, recursos como pagamentos pela plataforma, prontuário eletrônico, telemedicina, gestão completa de escalas, controle de ponto e folha de pagamento não fazem parte deste MVP.

## Próximas possibilidades

Direções previstas pelo PRD para depois da validação do MVP:

- alertas de novos plantões;
- favoritos e recomendações;
- matching entre profissionais e instituições;
- avaliações e verificação avançada de credenciais;
- chat, contratos digitais e histórico de plantões;
- escalas recorrentes e integrações com sistemas hospitalares;
- expansão para novas cidades.

## Produto e métricas

A métrica principal definida para o produto é:

> **Número de plantões preenchidos através da plataforma por mês.**

Métricas complementares incluem plantões publicados, médicos e hospitais ativos, candidaturas por vaga, taxa de preenchimento e tempo entre a publicação e a primeira candidatura.

## Documento de referência

Este projeto foi desenvolvido a partir do PRD disponível em:

[`attached_assets/PRD_—_Plataforma_de_Plantões_Médicos_1786967439308.md`](attached_assets/PRD_—_Plataforma_de_Plantões_Médicos_1786967439308.md)
