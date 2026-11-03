# Catálogo dos casos de teste gerados

Este documento registra os casos produzidos na experimentação dos dois prompts com a LLM
(DeepSeek V4.1 Flash, via OpenCode, em 02/11/2026). Cada caso indica a abordagem de origem, o
arquivo onde foi implementado e o status.

## Legenda

| Status | Significado |
| ------ | ----------- |
| **Implementado** | Teste ativo e executável. |
| **Desabilitado** | Teste mantido no código com `@Disabled`, documentando uma divergência entre a especificação e a implementação atual. |
| **CORS** | Executado em projeto Playwright separado, com o front-end em outra origem. |

## Prompt 1 — E2E caixa-preta (API real + navegador)

Arquivos:

- `tests/e2e/specs/collection-listing.spec.js`
- `tests/e2e/specs/cors.spec.js`

| ID | Caso de teste | Objetivo | Status |
| -- | ------------- | -------- | ------ |
| CT-E2E-01 | Fluxo completo: criar dados, listar, revelar, filtrar e recarregar | Validar a jornada completa de criação via API e consumo visual da listagem, incluindo filtros, respostas, recolhimento de decks e recarga por URL. | Implementado |
| CT-E2E-02 | Coleção sem decks exibe estado vazio | Garantir que uma coleção recém-criada não quebre a listagem e apresente o estado vazio correto. | Implementado |
| CT-E2E-03 | Coleção inexistente exibe erro amigável | Validar o tratamento de erro na UI e registrar o status HTTP real da API para coleção inexistente. | Implementado |
| CT-E2E-04 | UUID inválido é barrado no cliente | Verificar validação no formulário, foco no campo, `aria-invalid` e ausência de requisição desnecessária. | Implementado |
| CT-E2E-05 | Front-end em outra origem consegue consumir a API | Validar CORS de verdade, com página em `localhost:5500` e API em `localhost:8080`. | CORS |
| CT-E2E-06 | Conteúdo HTML hostil é renderizado como texto | Verificar que dados da API não são interpretados como HTML/JS (proteção contra XSS). | Implementado |
| CT-E2E-07 | Falha de rede exibe erro e permite tentar novamente | Verificar recuperação da UI após falha de transporte e retry bem-sucedido. | Implementado |
| CT-E2E-08 | Listagem utilizável em viewport móvel, sem overflow horizontal | Verificar responsividade básica em 390×844. | Implementado |

### Cobertura do Prompt 1 por dimensão

| Dimensão | Casos |
| -------- | ----- |
| Jornada funcional | CT-E2E-01, CT-E2E-02 |
| Erros e exceções | CT-E2E-03, CT-E2E-04, CT-E2E-07 |
| Integração cross-origin | CT-E2E-05 |
| Segurança de saída | CT-E2E-06 |
| Responsividade | CT-E2E-08 |
| Persistência de estado na URL | CT-E2E-01 |
| Interações de UI | CT-E2E-01, CT-E2E-08 |

## Prompt 2 — Integração server-side caixa-branca (Spring + MockMvc + H2)

Arquivo:

- `src/test/java/com/mindlessducks/coreflashcard/integration/CollectionApiIntegrationTest.java`

| ID | Caso de teste | Objetivo | Status |
| -- | ------------- | -------- | ------ |
| CT-INT-01 | Servir o front-end estático a partir de `/` | Verificar que `index.html`, `app.js` e `styles.css` são expostos pelo Spring. | Implementado |
| CT-INT-02 | Criar coleção e retornar listagem agregada vazia | Validar contrato, campos, datas ISO, `decks: []`, `userId` nulo e leitura idempotente. | Implementado |
| CT-INT-03 | Criar deck vinculado e exibi-lo na coleção | Validar vínculo `collectionId`, campos do deck e `cards: []`. | Implementado |
| CT-INT-04 | Criar cards e preservar conteúdo na serialização | Validar acentos, quebra de linha, IDs, vínculo com deck e nomes dos campos JSON. | Implementado |
| CT-INT-05 | Isolar decks e cards entre coleções | Garantir que a consulta agregada não vaza dados de outra coleção. | Implementado |
| CT-INT-06 | Representar deck sem cards com array vazio | Validar o formato de um deck sem flashcards. | Implementado |
| CT-INT-07 | Retornar 400 para UUID inválido no path | Verificar rejeição de identificador malformado e continuidade da aplicação. | Implementado |
| CT-INT-07b | Retornar erro JSON padronizado para UUID inválido (spec) | Registrar a expectativa do formato de erro com `FLASHCARD_002`. | Desabilitado — BUG-005 |
| CT-INT-08 | Permitir CORS para o front-end em outra origem | Validar preflight e cabeçalho `Access-Control-Allow-Origin`. | Implementado |
| CT-INT-09 | Retornar 404 para coleção inexistente (spec) | Registrar a expectativa da especificação (`FLASHCARD_001`/404). | Desabilitado — BUG-001 |
| CT-INT-10 | Remover decks e cards em cascata ao excluir a coleção | Validar cascade JPA/serviço no H2 real. | Implementado |
| CT-INT-11a | Rejeitar deck com coleção inexistente (spec) | Registrar a expectativa de erro de relacionamento (`FLASHCARD_003`). | Desabilitado — BUG-002 |
| CT-INT-11b | Rejeitar card com deck inexistente (spec) | Registrar a expectativa de erro de relacionamento (`FLASHCARD_003`). | Desabilitado — BUG-003 |
| CT-INT-11c | Rejeitar coleção sem nome (spec) | Registrar a expectativa de validação de dados (`FLASHCARD_002`). | Desabilitado — BUG-004 |

### Cobertura do Prompt 2 por dimensão

| Dimensão | Casos |
| -------- | ----- |
| Contrato HTTP/JSON | CT-INT-02, CT-INT-03, CT-INT-04, CT-INT-06 |
| Persistência e integridade | CT-INT-03, CT-INT-04, CT-INT-05, CT-INT-10 |
| Validação de entrada | CT-INT-07, CT-INT-07b, CT-INT-11a, CT-INT-11b, CT-INT-11c |
| CORS | CT-INT-08 |
| Recursos estáticos | CT-INT-01 |
| Semântica de erro vs. spec | CT-INT-09, CT-INT-07b, CT-INT-11a, CT-INT-11b, CT-INT-11c |
| Leitura idempotente | CT-INT-02 |

## Divergências registradas

| ID | Esperado pela spec | Comportamento atual | Evidência |
| -- | ------------------ | ------------------- | --------- |
| BUG-001 | `404` + `FLASHCARD_001` para coleção inexistente | `CollectionService#getCollection` lança `RuntimeException`; sem tratamento global, a API tende a responder `500`. | CT-INT-09 (desabilitado) e CT-E2E-03 (anotação de status). |
| BUG-002 | Erro de relacionamento (`FLASHCARD_003`) ao criar deck com `collectionId` inexistente | `RuntimeException("Collection not found")`; tende a responder `500`. | CT-INT-11a (desabilitado). |
| BUG-003 | Erro de relacionamento (`FLASHCARD_003`) ao criar card com `deckId` inexistente | `RuntimeException("Deck not found")`; tende a responder `500`. | CT-INT-11b (desabilitado). |
| BUG-004 | Erro de validação (`FLASHCARD_002`) para `collectionName` ausente | Sem validação de entrada; o `NOT NULL` do banco tende a gerar `500`. | CT-INT-11c (desabilitado). |
| BUG-005 | Erro JSON padronizado (`FLASHCARD_002`) para UUID inválido | HTTP 400 com o JSON padrão do Spring, sem o contrato `{code, message}` da spec. | CT-INT-07b (desabilitado); verificado também via HTTP real em `execucao.md`. |

Os testes desabilitados preservam a expectativa da especificação sem mascará-la e sem alterar o
código de produção. Quando os bugs forem corrigidos, basta remover a anotação `@Disabled`.

## Totais

| Origem | Casos | Ativos | Desabilitados |
| ------ | ----: | -----: | ------------: |
| Prompt 1 — E2E | 8 | 8 | 0 |
| Prompt 2 — Spring | 14 | 9 | 5 |
| **Total** | **22** | **17** | **5** |

> Observação: CT-E2E-05 é contabilizado como ativo, mas roda em um projeto Playwright separado
> (`npm run test:cors`) porque depende de um servidor estático na porta 5500.
