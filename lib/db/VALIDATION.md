# Validação do banco Planton

O schema mantém as entidades existentes (`users`, `shifts` e `applications`) e
mapeia nelas instituições, médicos, plantões e candidaturas sem criar tabelas
paralelas.

## Execução

```bash
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run migrate:dev
pnpm --filter @workspace/db run seed
pnpm --filter @workspace/db run validate:data
pnpm --filter @workspace/db run validate:constraints
```

O seed é idempotente: usuários são identificados por e-mail, plantões pela
combinação de instituição, título, data e horário inicial, e candidaturas pela
combinação de plantão e médico.

`migrate:dev` aplica as migrações versionadas apenas no banco de
desenvolvimento. Alterações de produção continuam sendo aplicadas pelo fluxo de
publicação do Replit.

## Consultas cobertas

O comando de validação documenta e executa:

- contagens de instituições, médicos, plantões e candidaturas;
- plantões abertos agrupados por especialidade;
- JOIN entre plantão, instituição, candidatura e médico;
- plantões sem candidatura;
- médicos sem candidatura;
- referências órfãs;
- candidaturas duplicadas para a mesma combinação de médico e plantão.
- proporção de candidaturas compatíveis com a especialidade do plantão;
- existência de um plantão com três ou mais candidaturas;
- impossibilidade de vincular médico como instituição ou instituição como médico;
- rejeição de status inválidos, remuneração negativa, FKs órfãs e duplicidades;
- exclusão em cascata das candidaturas quando um plantão é removido.

Ele termina com código diferente de zero caso as quantidades mínimas, a
integridade referencial ou a unicidade das candidaturas não sejam atendidas.