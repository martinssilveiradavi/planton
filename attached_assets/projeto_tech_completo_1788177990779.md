# Projeto Tech --- Modelo, Banco de Dados e Análise

## 1. Modelo Conceitual --- BRMW

### Entidades e atributos

#### HOSPITAL/CLÍNICA

-   `id_instituição` (PK)
-   `nome`
-   `cnpj`
-   `cidade`

#### PLANTÃO

-   `id_plantão` (PK)
-   `localização`
-   `data`
-   `valor`
-   `especialidade`
-   `status`

#### CANDIDATURA

-   `id_candidatura` (PK)
-   `data_candidatura`
-   `status`

#### MÉDICO

-   `id_médico` (PK)
-   `nome`
-   `CRM`
-   `cidade`
-   `especialidade`

### Relacionamentos

#### HOSPITAL/CLÍNICA --- publica --- PLANTÃO

-   Um **Hospital/Clínica** pode publicar de `0` a `n` plantões.
-   Cada **Plantão** é publicado por `1` Hospital/Clínica.

#### PLANTÃO --- recebe --- CANDIDATURA

-   Um **Plantão** pode receber de `0` a `n` candidaturas.
-   Cada **Candidatura** pertence a `1` Plantão.

#### MÉDICO --- realiza --- CANDIDATURA

-   Um **Médico** pode realizar de `0` a `n` candidaturas.
-   Cada **Candidatura** é realizada por `1` Médico.

### Fluxo do modelo

`HOSPITAL/CLÍNICA` → publica → `PLANTÃO` → recebe → `CANDIDATURA` ←
realiza ← `MÉDICO`

------------------------------------------------------------------------

## 2. Banco de Dados --- Tech

### Tabela `hospital`

  Campo              Tipo      Exemplo
  ------------------ --------- ----------
  `idhospital`       integer   1
  `hospitalnome`     text      einsten
  `cnpjhospital`     text      01020304
  `cidadehospital`   text      sp

### Tabela `plantao`

  Campo                    Tipo      Exemplo
  ------------------------ --------- ------------
  `idplantao`              integer   1
  `localizacaoplantao`     text      sp
  `dataplantao`            date      2026-08-28
  `valorplatao`            real      1200
  `especialidadeplantao`   text      cardio
  `statusplantao`          text      aberto
  `idhospital`             integer   1

### Estrutura observada

O banco exibido contém as tabelas `hospital` e `plantao`. O campo
`idhospital` aparece na tabela `plantao`, conectando o plantão ao
hospital correspondente.

------------------------------------------------------------------------

## 3. Análise do Modelo

Analisando o nosso modelo, acreditamos que alguns pontos poderiam ser
melhorados para deixá-lo mais completo e próximo do funcionamento real
da plataforma.

No **Plantão**, acrescentaríamos o horário de início e término, além da
data que já está presente, e também uma descrição com mais informações
sobre a vaga.

Na **Candidatura**, detalharíamos melhor o atributo `status`, definindo
possibilidades como:

-   pendente;
-   aprovada;
-   recusada;
-   cancelada.

Isso deixaria mais claro o processo entre a candidatura do médico e a
decisão da instituição.

No **Médico**, também poderíamos incluir alguma informação relacionada à
disponibilidade ou ao status do cadastro, complementando os dados que já
temos, como nome, CRM, cidade e especialidade.

De forma geral, manteríamos a estrutura e os relacionamentos principais,
pois acreditamos que o fluxo entre **Hospital/Clínica**, **Plantão**,
**Candidatura** e **Médico** está bem representado. As mudanças seriam
principalmente para detalhar melhor as informações e tornar o modelo
mais completo.
