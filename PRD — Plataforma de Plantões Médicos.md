# PRD — Plataforma de Plantões Médicos

**Status:** MVP  
**Versão:** 1.0  
**Produto:** Plataforma para encontrar plantões médicos  
**Usuários principais:** Médicos, hospitais e clínicas

---

## 1. Visão do Produto

### Problema

Médicos que desejam encontrar plantões disponíveis em sua cidade ou região precisam recorrer a diferentes canais, como:

- Grupos de WhatsApp;
- Indicações de outros médicos;
- Contatos pessoais;
- Grupos e comunidades profissionais;
- Comunicação direta com hospitais e clínicas.

As oportunidades ficam espalhadas e não existe uma maneira simples de visualizar **quais plantões estão disponíveis, onde estão e quanto pagam**.

Ao mesmo tempo, hospitais e clínicas podem ter dificuldade para encontrar rapidamente profissionais disponíveis para preencher plantões.

### Solução

Criar uma plataforma que centralize vagas de plantões médicos publicadas por hospitais e clínicas.

O médico poderá visualizar os plantões disponíveis por meio de uma **lista de vagas e de um mapa**, identificando rapidamente oportunidades próximas à sua localização.

> **Proposta de valor:** encontrar um plantão médico disponível na região de forma rápida, centralizada e confiável.

---

# 2. Objetivos

## Objetivo principal

Reduzir o tempo e o esforço necessários para um médico encontrar um plantão disponível.

## Objetivos secundários

- Centralizar oportunidades de plantões;
- Facilitar o preenchimento de plantões por hospitais e clínicas;
- Mostrar oportunidades relevantes de acordo com localização;
- Tornar informações como horário, especialidade e remuneração fáceis de comparar;
- Diminuir a dependência de grupos de WhatsApp e indicações.

---

# 3. Público-alvo

## Médico

Profissional procurando plantões disponíveis em sua cidade ou região.

### Necessidades

- Encontrar plantões rapidamente;
- Saber onde fica o plantão;
- Saber data e horário;
- Saber quanto será pago;
- Saber qual especialidade é necessária;
- Conseguir demonstrar interesse rapidamente.

---

## Hospital ou clínica

Instituição que precisa encontrar médicos para preencher plantões.

### Necessidades

- Publicar uma vaga rapidamente;
- Informar requisitos;
- Encontrar profissionais disponíveis;
- Receber candidatos para o plantão;
- Encerrar a vaga quando ela for preenchida.

---

# 4. Jobs to Be Done

### Médico

> Quando eu estiver procurando um plantão, quero visualizar rapidamente as vagas disponíveis perto de mim para conseguir escolher e me candidatar à melhor oportunidade.

### Hospital

> Quando surgir um plantão disponível, quero publicar a oportunidade rapidamente para encontrar um médico disponível antes do horário do plantão.

---

# 5. Fluxo principal — Médico

```text
Entrar na plataforma
        ↓
Informar localização
        ↓
Visualizar mapa + vagas disponíveis
        ↓
Aplicar filtros
        ↓
Selecionar um plantão
        ↓
Visualizar detalhes
        ↓
Demonstrar interesse
        ↓
Hospital recebe candidatura
```

---

# 6. Fluxo principal — Hospital

```text
Entrar na plataforma
        ↓
Criar vaga de plantão
        ↓
Informar detalhes
        ↓
Publicar
        ↓
Vaga aparece no mapa
        ↓
Médicos demonstram interesse
        ↓
Hospital visualiza candidatos
        ↓
Seleciona profissional
        ↓
Plantão é preenchido
```

---

# 7. Funcionalidades do MVP

## 7.1 Cadastro e Login

### Médico

O cadastro deve solicitar:

- Nome;
- E-mail;
- Telefone;
- Cidade;
- CRM;
- Estado do CRM;
- Especialidade.

### Hospital/Clínica

O cadastro deve solicitar:

- Nome da instituição;
- CNPJ;
- Endereço;
- Cidade;
- E-mail;
- Telefone;
- Responsável pela conta.

---

# 8. Publicação de Plantão

Hospitais e clínicas poderão criar uma vaga.

### Campos obrigatórios

- Hospital/clínica;
- Endereço;
- Data;
- Horário de início;
- Horário de término;
- Especialidade necessária;
- Valor do plantão;
- Descrição;
- Requisitos;
- Quantidade de vagas.

### Status

Cada vaga poderá ter os seguintes estados:

```text
ABERTO
PREENCHIDO
CANCELADO
ENCERRADO
```

---

# 9. Mapa de Plantões

O sistema deverá apresentar um mapa com os plantões disponíveis.

Cada plantão será representado por um marcador.

Ao selecionar o marcador, o médico deverá visualizar informações resumidas:

**Hospital:** Hospital X  
**Distância:** 4,2 km  
**Especialidade:** Clínica Geral  
**Data:** 15/08  
**Horário:** 19h–07h  
**Valor:** R$ 1.200

Botão:

**Ver plantão**

---

# 10. Lista de Plantões

Além do mapa, o médico poderá visualizar as vagas em formato de lista.

Exemplo:

```text
Hospital X

Clínica Geral
Hoje • 19h–07h

4,2 km de distância

R$ 1.200

[Ver plantão]
```

---

# 11. Filtros

O médico poderá filtrar as oportunidades por:

- Distância;
- Cidade;
- Especialidade;
- Data;
- Horário;
- Valor.

### Ordenação

- Mais próximos;
- Mais recentes;
- Maior remuneração;
- Plantões mais próximos de começar.

---

# 12. Página do Plantão

Ao abrir uma oportunidade, o médico visualizará:

### Informações

- Nome do hospital;
- Localização;
- Distância;
- Data;
- Horário;
- Duração;
- Especialidade;
- Valor;
- Descrição;
- Requisitos.

### CTA principal

**Tenho interesse**

Ao clicar, o médico confirma que deseja se candidatar à vaga.

---

# 13. Candidatura

Depois que o médico demonstrar interesse:

1. A candidatura é registrada;
2. O hospital recebe o perfil do médico;
3. O hospital pode visualizar os candidatos;
4. O hospital escolhe o profissional;
5. A vaga pode ser marcada como preenchida.

---

# 14. Painel do Hospital

O hospital deverá visualizar:

### Plantões

- Abertos;
- Preenchidos;
- Encerrados.

### Para cada plantão

Mostrar:

- Número de candidatos;
- Data;
- Horário;
- Especialidade;
- Valor;
- Status.

---

# 15. Painel do Médico

O médico deverá visualizar:

### Plantões disponíveis

Oportunidades próximas.

### Minhas candidaturas

```text
Hospital X
15/08 • 19h

Status: aguardando resposta
```

Possíveis status:

```text
Enviado
Aceito
Não selecionado
Cancelado
```

---

# 16. Regras de Negócio

1. Apenas hospitais e clínicas cadastrados podem publicar plantões.

2. Um plantão deve possuir data, horário, localização, especialidade e remuneração.

3. Plantões encerrados não devem aparecer entre as oportunidades disponíveis.

4. O médico precisa estar cadastrado para demonstrar interesse.

5. O CRM informado pelo médico deve estar associado ao seu perfil.

6. O hospital pode encerrar uma vaga quando encontrar um profissional.

7. Plantões cuja data já passou devem ser automaticamente classificados como encerrados.

---

# 17. Confiança e Segurança

Como o produto envolve serviços médicos, confiança é parte central da experiência.

A plataforma deverá prever:

- Validação de CRM;
- Validação das instituições;
- Proteção de dados pessoais;
- Registro das candidaturas;
- Identificação clara do hospital responsável pela vaga;
- Política de privacidade e termos de uso.

---

# 18. O que NÃO entra no MVP

Para evitar excesso de funcionalidades na primeira versão:

- Pagamento do médico pela plataforma;
- Prontuário eletrônico;
- Telemedicina;
- Avaliação de pacientes;
- Gestão completa da escala hospitalar;
- Controle de ponto;
- Folha de pagamento;
- IA para selecionar automaticamente médicos;
- Sistema complexo de reputação.

Essas funcionalidades poderão ser avaliadas depois que o problema principal for validado.

---

# 19. Métrica principal

## North Star Metric

**Número de plantões preenchidos através da plataforma por mês.**

Essa métrica representa valor para os dois lados:

**Médico →** conseguiu um plantão.

**Hospital →** conseguiu preencher uma vaga.

---

# 20. Métricas secundárias

### Marketplace

- Plantões publicados por semana;
- Médicos ativos;
- Hospitais ativos;
- Candidaturas por plantão;
- Taxa de plantões preenchidos.

### Velocidade

**Tempo médio entre:**

```text
Publicação → primeira candidatura
```

e

```text
Publicação → plantão preenchido
```

### Conversão

```text
Visualização
    ↓
Abertura da vaga
    ↓
Candidatura
    ↓
Aceite
    ↓
Plantão preenchido
```

---

# 21. Critérios de sucesso do MVP

Consideraremos que existe sinal de validação quando:

- Médicos utilizarem a plataforma de forma recorrente para procurar plantões;
- Hospitais voltarem a publicar novas oportunidades;
- Plantões forem efetivamente preenchidos pela plataforma;
- O tempo para encontrar profissionais for menor do que no processo atual.

---

# 22. Hipóteses a validar

### Hipótese 1

Médicos possuem dificuldade suficiente para encontrar plantões para utilizarem uma plataforma específica.

### Hipótese 2

Hospitais possuem dificuldade para preencher determinados plantões.

### Hipótese 3

Hospitais estão dispostos a publicar suas vagas na plataforma.

### Hipótese 4

Localização é um fator importante na escolha de um plantão.

### Hipótese 5

Informações de remuneração, horário e distância são suficientes para gerar interesse inicial.

---

# 23. Diferencial inicial

O produto não deve tentar ser um sistema completo de gestão hospitalar.

O foco inicial é:

> **Ser a maneira mais rápida de descobrir quais plantões médicos estão disponíveis perto de você.**

A experiência deve priorizar:

**localização + disponibilidade + remuneração + velocidade.**

---

# 24. Visão futura

Após validar o MVP, poderão ser estudadas funcionalidades como:

- Alertas de novos plantões;
- Plantões favoritos;
- Recomendação personalizada;
- Matching entre médico e hospital;
- Avaliações de hospitais;
- Avaliações de profissionais;
- Verificação avançada de credenciais;
- Chat;
- Escalas recorrentes;
- Contratos digitais;
- Histórico de plantões;
- Integração com sistemas hospitalares;
- Expansão para novas cidades.

---

# 25. Princípio do Produto

> **Se um médico abrir a plataforma procurando trabalho, ele deve conseguir descobrir em poucos segundos onde existe um plantão relevante disponível.**

Toda funcionalidade do MVP deve contribuir diretamente para esse objetivo.