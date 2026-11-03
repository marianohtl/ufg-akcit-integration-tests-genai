# Análise da experimentação dos prompts

## 1. Contexto

- **Data:** 02/11/2026.
- **Modelo:** DeepSeek V4.1 Flash em execução no OpenCode.
- **Prompts utilizados:**
  - [Prompt 1 — E2E caixa-preta](../../prompts/prompt-01-integracao-e2e-api-frontend.md)
  - [Prompt 2 — Spring/MockMvc caixa-branca](../../prompts/prompt-02-integracao-backend-spring-mockmvc.md)
- **Objetivo:** verificar como dois tipos de prompt, com abordagens deliberadamente distintas,
  influenciam a quantidade, a qualidade e a diversidade dos casos de teste de integração gerados.
- **Resultado da geração:** 22 casos catalogados em [casos-de-teste.md](casos-de-teste.md), sendo
  17 ativos e 5 desabilitados por divergências entre especificação e implementação.

Os dois prompts foram usados como instruções completas para a LLM. A LLM gerou os arquivos de
teste, revisou o contrato da API no código-fonte e executou a suíte quando o ambiente permitiu.
A versão final dos prompts, armazenada em `prompts/`, já incorpora os ajustes descritos na seção 5.

## 2. Metodologia

1. Leitura dos prompts e do código de produção (`controllers`, `services`, `repositories`,
   `entities`, `dto`, `application.properties` e `frontend/`).
2. Geração dos testes do Prompt 2 primeiro, por serem mais rápidos e isolados, para confirmar o
   contrato real da API.
3. Geração dos testes do Prompt 1, reutilizando o contrato confirmado e criando dados via API.
4. Execução das suítes, correção de problemas de infraestrutura e registro das divergências.
5. Catalogação dos casos e comparação das abordagens.

A ordem não foi exigida pelos prompts, mas facilitou a validação do contrato antes de escrever
asserções de interface.

## 3. Como o Prompt 1 influenciou a qualidade e a diversidade

O Prompt 1 é **caixa-preta e orientado ao comportamento do usuário**. Ele pede explicitamente:
jornada completa, estados de tela, CORS, segurança de saída, falha de rede, responsividade,
seletores por papel e ausência de mocks no caminho feliz.

**Casos gerados:** 8 (CT-E2E-01 a CT-E2E-08).

**Pontos fortes observados:**

- **Diversidade de contexto de uso:** o mesmo endpoint foi exercitado por fluxo feliz, estado
  vazio, entrada inválida, erro de API, falha de transporte, viewport móvel e origem cruzada.
- **Realismo:** os testes validam o que o usuário vê e faz — renderização, revelação de respostas,
  filtro sem acento, recolhimento de decks, recarga por URL.
- **Riscos que só aparecem no navegador:** CORS real, resolução automática da URL da API, escaping
  de HTML, foco do campo e overflow horizontal.
- **Diagnóstico orientado a produto:** falhas indicam impacto direto na experiência, não apenas
  um detalhe de implementação.

**Limitações observadas:**

- A suíte é mais lenta e depende de backend, front-end, navegador e, no caso CORS, de um servidor
  estático adicional.
- É mais sensível a textos e seletores da interface; por isso o prompt precisou exigir seletores
  por papel/label e âncoras estáveis.
- Não gera naturalmente casos profundos de persistência, serialização ou cascade, pois o prompt
  não expõe o interior do backend.
- Uma falha de backend aparece na UI de forma genérica; o diagnóstico exato exige consultar a API
  ou os logs.

## 4. Como o Prompt 2 influenciou a qualidade e a diversidade

O Prompt 2 é **caixa-branca e orientado ao contrato e à persistência**. Ele exige contexto Spring
completo, `MockMvc`, H2 real, ausência de mocks e comparação explícita com a especificação.

**Casos gerados:** 14 (CT-INT-01 a CT-INT-11c, incluindo CT-INT-07b), sendo 9 ativos e 5
desabilitados.

**Pontos fortes observados:**

- **Profundidade técnica:** valida nomes de campos JSON, datas ISO, `userId` nulo, arrays vazios,
  vínculos entre entidades, isolamento entre coleções e cascade.
- **Determinismo e velocidade:** não depende de navegador, servidor estático ou renderização.
- **Diagnóstico preciso:** uma falha aponta diretamente para status HTTP, JSONPath, repositório ou
  relacionamento.
- **Comparação com a especificação:** expôs cinco divergências (404/500, validações ausentes e
  formato de erro para UUID inválido) que o teste E2E não conseguiria classificar sozinho.
- **Cobertura de infraestrutura:** verificou CORS no nível de cabeçalhos e o serving do front-end
  pelo Spring.

**Limitações observadas:**

- Não valida a experiência real do navegador, JavaScript, acessibilidade ou responsividade.
- Pode acoplar o teste a detalhes internos (serviços/repositórios), como no caso de cascade.
- Testes com `@SpringBootTest` são mais pesados que testes unitários e podem esconder problemas de
  integração externa se o contexto for excessivamente controlado.
- O H2 compartilhado exige limpeza explícita para evitar dependência de ordem.

## 5. Comparação de qualidade e diversidade

### 5.1 Matriz de riscos cobertos

| Categoria de risco | Prompt 1 (E2E) | Prompt 2 (Spring) |
| ------------------ | :-------------: | :---------------: |
| Fluxo funcional ponta a ponta | ✔ | — |
| Contrato HTTP e nomes de campos JSON | — | ✔ |
| Serialização de datas e tipos | — | ✔ |
| Persistência e vínculo entre entidades | — | ✔ |
| Cascade e integridade referencial | — | ✔ |
| Isolamento entre coleções | — | ✔ |
| CORS real no navegador | ✔ | — |
| Cabeçalhos CORS no servidor | — | ✔ |
| Front-end estático servido pelo Spring | — | ✔ |
| Renderização e interações de UI | ✔ | — |
| Filtro sem acento e estado sem resultados | ✔ | — |
| Foco, `aria-invalid` e validação no cliente | ✔ | — |
| XSS/escape de saída | ✔ | — |
| Falha de rede e retry | ✔ | — |
| Responsividade / overflow | ✔ | — |
| Status de erro vs. especificação | Parcial | ✔ |
| Recarga por URL e estado persistido | ✔ | — |

### 5.2 Qualidade comparada

| Critério | Prompt 1 (E2E) | Prompt 2 (Spring) |
| -------- | -------------- | ----------------- |
| Realismo | Alto | Médio |
| Determinismo | Médio | Alto |
| Velocidade | Baixa/média | Alta |
| Precisão do diagnóstico | Média | Alta |
| Custo de manutenção | Alto (UI/ambiente) | Médio (contrato/DB) |
| Cobertura de UX | Alta | Baixa |
| Cobertura de dados/contrato | Baixa/média | Alta |
| Tendência a falso positivo | Média (seletores/timing) | Baixa |
| Tendência a falso negativo | Média (não vê interior) | Média (não vê navegador) |

### 5.3 Diversidade

Os prompts produziram **pouca sobreposição e alta complementaridade**:

- O único tema claramente presente nos dois é CORS, mas em níveis diferentes: no Prompt 1 ele é
  validado pela requisição real do navegador; no Prompt 2, pelos cabeçalhos HTTP.
- Erros também aparecem nos dois, mas o Prompt 1 avalia a experiência (mensagem, retry, foco) e o
  Prompt 2 avalia o status/código de erro.
- Nenhum dos dois, isoladamente, cobriria a matriz acima de forma satisfatória. A união dos casos
  cobre jornada, contrato, dados, infraestrutura, segurança de saída, resiliência e UX.

## 6. Ajustes de prompt necessários

Os ajustes abaixo foram identificados ao transformar os prompts em código executável. A versão
final em `prompts/` já reflete todos eles.

| # | Problema identificado | Ajuste aplicado | Efeito |
| - | --------------------- | --------------- | ------ |
| 1 | Os prompts iniciais não traziam o contrato exato dos endpoints. | Incluir payloads, campos de resposta e exemplos de `collectionId`, `deckId` e `cardId`. | Reduziu ambiguidade e retrabalho na criação de dados. |
| 2 | Coleção inexistente: a spec prevê 404, mas a implementação atual retorna 500. | Definir política de divergência: teste `@Disabled` com justificativa e relatório, sem alterar produção. | A suíte permanece verde sem esconder o bug; a expectativa da spec fica registrada. |
| 3 | Validar CORS dentro da mesma origem não exercitaria CORS. | Criar projeto Playwright separado, front-end em `localhost:5500` e API em `localhost:8080`. | O cenário passou a validar o comportamento real de origem cruzada. |
| 4 | H2 é compartilhado e não existem endpoints de exclusão. | Exigir nomes/dados únicos por execução e limpeza em ordem de FK no `@BeforeEach`. | Eliminou dependência de ordem e colisões entre testes. |
| 5 | `@Transactional` em testes com `MockMvc` pode mascarar o limite transacional real. | Preferir limpeza explícita em vez de transação de teste. | Os testes exercitam commit/rollback mais próximo do comportamento real. |
| 6 | Seletores por classe CSS são frágeis. | Exigir seletores por papel/label e `data-action`; evitar classes internas. | Menor acoplamento à implementação visual. |
| 7 | `sleep` fixo aumentaria flakiness. | Exigir asserções web-first e proibir esperas fixas. | Testes mais estáveis e rápidos. |
| 8 | O welcome page pode não ser resolvido no `MockMvc` em todos os cenários. | Prever fallback para `/index.html` e registrar observação. | Evita falso negativo de infraestrutura de teste. |
| 9 | A primeira versão do Prompt 1 não cobria segurança de saída, falha de rede e mobile. | Adicionar CT-E2E-06, CT-E2E-07 e CT-E2E-08. | Aumentou a diversidade de riscos cobertos. |
| 10 | O Prompt 2 não previa verificações de entradas inválidas. | Adicionar CT-INT-11a/b/c como exploração de relacionamento e validação. | Revelou lacunas de tratamento de erro na API. |
| 11 | Sem critério de aceite, a LLM poderia entregar apenas “esqueletos” de teste. | Exigir comandos, relatório, evidências e critérios de aceite explícitos. | Resultado verificável e reproduzível. |
| 12 | Sem a regra “não alterar produção”, a LLM poderia corrigir a API para o teste passar. | Proibir alterações em `src/main/` e `frontend/`; divergências vão para o relatório. | Preservou o valor diagnóstico dos testes. |
| 13 | A welcome page `/` no MockMvc é um forward sem corpo; validar conteúdo direto em `/` falhava. | Validar `forwardedUrl("index.html")` em `/` e o conteúdo em `/index.html`. | O teste passou a distinguir corretamente roteamento de serving estático. |
| 14 | Asserções com acentos no HTML falharam por charset padrão do MockMvc. | Usar âncoras ASCII (`Core Flashcards`, `Listagem`) nas asserções de conteúdo. | Eliminou falso negativo de encoding. |
| 15 | O 400 de UUID inválido não executa o error dispatch no MockMvc; no HTTP real o corpo é o JSON padrão do Spring. | Testar o status 400 no MockMvc e registrar o formato real via HTTP em `execucao.md`; expectativa da spec ficou no teste desabilitado CT-INT-07b. | Separação clara entre comportamento observado e contrato desejado. |
| 16 | A asserção de CORS exigia eco exato da origem, mas respostas sem credenciais podem usar `*`. | Aceitar `Access-Control-Allow-Origin` igual à origem ou `*`. | Teste passou a funcionar tanto no mock quanto no Spring real. |

## 7. Limitações da experimentação

- Execução única com um modelo; não há comparação com outros modelos ou com um baseline humano.
- A avaliação de “qualidade” é qualitativa e baseada na experiência de geração/execução, não em
  métricas como mutation score.
- Os testes desabilitados não falham a suíte; a intenção é documentar a divergência até que a API
  seja corrigida.
- O ambiente de execução pode variar (versões de Java, Node, Playwright e H2), afetando tempo e
  disponibilidade dos navegadores.
- A cobertura não é medida por ferramenta (JaCoCo), pois o foco é integração comportamental e de
  contrato.

## 8. Conclusão

O Prompt 1 foi mais eficaz para **descobrir problemas de integração percebidos pelo usuário**:
CORS, carregamento, renderização, interações, XSS, falha de rede e responsividade. O Prompt 2 foi
mais eficaz para **descobrir problemas de contrato, persistência e semântica de erro**. A
combinação dos dois gerou uma suíte mais equilibrada do que qualquer um isoladamente.

Os ajustes mais importantes foram: fixar o contrato real, definir o tratamento de divergências,
separar o cenário de CORS e garantir isolamento de dados. Sem esses ajustes, os testes seriam mais
frágeis, menos reproduzíveis e teriam menor poder de diagnóstico.
