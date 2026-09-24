# PlantOn — SEO, descoberta e análise de uso

## 1. Documento de SEO

**Title:** PlantOn | Encontre plantões médicos ideais

**Meta description:** Encontre plantões médicos por especialidade e localização. Compare oportunidades no mapa e receba recomendações por inteligência artificial no PlantOn.

**H1:** Encontre o plantão médico ideal para você

Esses textos foram aplicados ao código: title e descrição no HTML principal e H1 visível na página de descoberta. A página é renderizada em React; o H1 aparece após executar JavaScript. A tela de assinatura pode substituir a descoberta para médicos sem assinatura ativa, conforme a regra já existente.

## 2. Links para conferir após republicar

- https://plataforma-plantoes-medicos.replit.app/robots.txt
- https://plataforma-plantoes-medicos.replit.app/sitemap.xml
- https://plataforma-plantoes-medicos.replit.app/llms.txt

O sitemap inclui somente a página pública principal; não lista candidaturas ou páginas privadas. Robots orienta rastreadores e não substitui autenticação. Llms.txt descreve o produto, mas não garante uso por sistemas de IA.

## 3. Próximas cinco features com score

Método proposto: ICE = Impacto × Confiança × Facilidade. Notas de 1 a 10; facilidade maior significa menor esforço. As notas são hipóteses de priorização, não métricas medidas. Se a aula exigir outro método, recalcular conforme a rubrica.

| Prioridade | Feature proposta | Impacto | Confiança | Facilidade | Score ICE | Justificativa e métrica |
|---|---|---:|---:|---:|---:|---|
| 1 | Favoritar plantões | 7 | 8 | 9 | 504 | Facilita retomar oportunidades. Medir proporção de favoritos que viram candidaturas. |
| 2 | Salvar buscas e receber alertas de novas vagas | 9 | 8 | 6 | 432 | Reduz consultas repetidas e aproxima médico de vagas compatíveis. Medir candidaturas originadas dos alertas. |
| 3 | Agenda pessoal com aviso de conflito de horários | 9 | 8 | 5 | 360 | Ajuda a evitar compromissos simultâneos. Medir conflitos detectados antes da confirmação. |
| 4 | Histórico e previsão de ganhos por plantão | 7 | 7 | 6 | 294 | Ajuda o médico a planejar receita, distinguindo previsto e recebido. Medir uso mensal do painel. |
| 5 | Avaliações de hospitais após plantão confirmado | 8 | 6 | 4 | 192 | Apoia decisões com experiências verificadas. Medir avaliações válidas e necessidade de moderação. |

As cinco propostas são um plano de evolução, não funções implementadas nesta entrega. Busca, mapa e recomendações por IA já existem no código analisado.

## 4. PostHog — integração preparada, ativação pendente

Foi adicionada captura de visualizações de página em produção. Sem configuração, o aplicativo funciona sem enviar eventos. Não foram criados conta, painel ou evidência fictícia de visita.

1. Criar ou abrir sua conta em https://posthog.com e selecionar o projeto PlantOn.
2. Copiar o Project Token e o API Host nas configurações do projeto. Não usar Personal API Key.
3. No Replit, configurar VITE_POSTHOG_KEY com o token público e VITE_POSTHOG_HOST com o host correto: https://us.i.posthog.com ou https://eu.i.posthog.com.
4. Recompilar e republicar; variáveis VITE são incorporadas durante o build. Um proprietário ou Publicador precisa executar a publicação.
5. Abrir o site publicado, navegar entre páginas e conferir eventos $pageview no PostHog, no projeto e intervalo de tempo corretos.
6. Capturar um print real do painel mostrando a visita e anexá-lo à entrega individual no Canvas.

Se nenhum evento aparecer, verificar bloqueadores de anúncios, configuração das variáveis no build publicado, host/região e erros de rede. A integração desabilita autocapture e gravação de sessão, não identifica pessoas, remove consultas e fragmentos da URL capturada e substitui identificadores de plantões/candidaturas no caminho. A persistência é em memória, portanto não serve para medir usuários recorrentes com precisão.

Referência técnica: https://posthog.com/docs/libraries/js

## Situação da entrega

- SEO, robots, sitemap e llms: integrados ao código atual.
- Documento e cinco features: preservados neste documento.
- PostHog: integrado; depende de token, publicação e visita real.
- Publicação, verificação dos links no domínio e print do painel: pendentes.