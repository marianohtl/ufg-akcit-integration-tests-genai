# Prompt 2 — Testes de integração server-side (Spring Boot + MockMvc + H2)

**Abordagem:** caixa-branca, in-process. A suíte sobe o contexto Spring completo e exercita a camada web com `MockMvc`, os serviços e os repositórios JPA contra o H2 real — sem mocks de banco, sem servidor externo e sem navegador. Esta abordagem é complementar à do Prompt 1, que valida o sistema ponta a ponta pela interface.

---

## Contexto do projeto

Repositório: `C:\projetinhos\akcit\genaiTestesIntegracao`

- Stack: Java 21, Spring Boot 3.4, Maven Wrapper, Spring Web, Spring Data JPA, H2 em memória.
- Pacote base: `com.mindlessducks.coreflashcard`.
- Contrato relevante:
  - `POST /api/collection` → `201/200` com `collectionId` e `collectionName`;
  - `POST /api/deck` → `200` com `deckId`, `collectionId`, `deckName` e `cards: []`;
  - `POST /api/card` → `200` com `cardId`, `deckId`, `front` e `back`;
  - `GET /api/collections/{id}` → coleção com `id`, `name`, `userId`, `createdAt`, `updatedAt` e `decks`, cada deck com `deckId`, `collectionId`, `deckName` e `cards`, cada card com `cardId`, `deckId`, `front` e `back`.
- Configuração de teste já disponível: `spring.datasource.url=jdbc:h2:mem:flashcards-db;MODE=PostgreSQL` e `spring.jpa.hibernate.ddl-auto=create`.
- Testes unitários existentes usam Mockito; **esta suíte não deve usar mocks**.
- `WebConfig` habilita CORS para `/api/**`.
- `application.properties` serve `frontend/` como conteúdo estático em `/`.

## Objetivo

Criar e executar uma suíte de testes de integração server-side que valide, com o contexto Spring real:

1. o contrato HTTP dos endpoints de criação e da listagem agregada;
2. a serialização JSON (nomes de campos, tipos, datas e arrays vazios);
3. a persistência e a integridade hierárquica Collection → Deck → Card no H2;
4. o comportamento de CORS;
5. a exposição do front-end estático pelo Spring.

## Stack e premissas

- Use JUnit 5, `@SpringBootTest`, `@AutoConfigureMockMvc`, `MockMvc`, `ObjectMapper` e asserções Hamcrest/AssertJ.
- Use o H2 real configurado no projeto. Não substitua o datasource, não use H2 em memória isolado por teste sem necessidade e não use `@MockBean`, Mockito ou stubs de repositório.
- Crie os testes em `src/test/java/com/mindlessducks/coreflashcard/integration/` (por exemplo `CollectionApiIntegrationTest.java`).
- Se precisar de propriedades específicas, crie `src/test/resources/application-integration.properties` e ative com `@ActiveProfiles("integration")`. Não altere `src/main/resources/application.properties`.
- Não altere código de produção. A única alteração permitida fora dos testes é configuração de teste e documentação do relatório.
- Garanta isolamento entre testes: limpe os dados em ordem de FK no `@BeforeEach` (`cardRepository.deleteAll()`, `deckRepository.deleteAll()`, `collectionRepository.deleteAll()`) ou use dados únicos por teste. Não dependa da ordem de execução.
- Evite `@Transactional` no teste envolvendo chamadas `MockMvc`: prefira limpeza explícita para que cada requisição tenha seu próprio limite transacional.
- Não assuma ordem de decks ou cards retornados. Valide por conteúdo (nome/ID) ou use `containsInAnyOrder`.
- Não use `Thread.sleep`. `MockMvc` é síncrono.
- Testes devem ser determinísticos e legíveis, com nomes descritivos em português.

## Cenários obrigatórios

Implemente, no mínimo, os casos abaixo.

### CT-INT-01 — Contexto e front-end estático

- O contexto Spring carrega sem falhas.
- `GET /` retorna `200`, `Content-Type` compatível com `text/html` e conteúdo contendo “Core Flashcards”.
- `GET /js/app.js` e `GET /css/styles.css` retornam `200` com os respectivos content types.
- Caso o welcome page não seja resolvido pelo `MockMvc`, valide `GET /index.html` diretamente e registre a observação; não remova a expectativa de servir o front-end em `/`.

### CT-INT-02 — Criar coleção e consultar a listagem

- Faça `POST /api/collection` com um nome único.
- Valide status, `collectionId` no formato UUID e `collectionName` igual ao enviado.
- Faça `GET /api/collections/{collectionId}`.
- Valide status 200, `id` e `name` corretos, `decks` como array vazio e `createdAt`/`updatedAt` presentes e em formato ISO-8601 (sem afirmar o valor exato).
- Repita o `GET` e confirme que a leitura é idempotente e não lança `LazyInitializationException`.

### CT-INT-03 — Criar deck vinculado à coleção

- Crie uma coleção e um deck com nome único.
- Valide o corpo de `POST /api/deck`: `deckId` UUID, `collectionId` igual ao da coleção, `deckName` correto e `cards` vazio.
- Consulte a coleção e valide que o deck aparece com os mesmos dados e `cards: []`.

### CT-INT-04 — Criar cards e validar a serialização agregada

- Crie uma coleção, um deck e pelo menos dois cards.
- Inclua acentos, quebra de linha e caracteres especiais em `front`/`back`.
- Consulte `GET /api/collections/{id}` e valide:
  - cada card com `cardId`, `deckId`, `front` e `back` corretos;
  - conteúdo preservado exatamente como enviado;
  - cards dentro do deck correto;
  - `Content-Type: application/json`.
- Valide que os nomes dos campos JSON correspondem ao contrato (`id`, `name`, `decks`, `deckId`, `collectionId`, `deckName`, `cards`, `cardId`, `front`, `back`).

### CT-INT-05 — Isolamento entre coleções

- Crie duas coleções, cada uma com um deck e cards distintos.
- Consulte cada coleção e valide que a resposta contém somente seus próprios decks e cards, sem vazamento de dados da outra.
- Valide que a contagem total de decks/cards é consistente.

### CT-INT-06 — Deck sem cards

- Crie uma coleção com um deck e nenhum card.
- Valide que o deck aparece na listagem com `cards: []` e que a coleção continua com os demais campos válidos.

### CT-INT-07 — UUID inválido no path

- Faça `GET /api/collections/nao-e-um-uuid`.
- Valide status 400 (erro de conversão de `UUID`) e que a API não retorna 500.
- Verifique que o corpo de erro é JSON e que a aplicação permanece funcional após a requisição.

### CT-INT-08 — CORS para o front-end em outra origem

- Envie um `OPTIONS /api/collections/{id}` com:
  - `Origin: http://localhost:5500`;
  - `Access-Control-Request-Method: GET`.
- Valide resposta de preflight bem-sucedida e presença de `Access-Control-Allow-Origin` com a origem informada.
- Envie um `GET /api/collections/{id}` com `Origin: http://localhost:5500` e valide o mesmo cabeçalho na resposta.
- Confirme que a configuração não exige credenciais.

### CT-INT-09 — Divergência: coleção inexistente

- A especificação (`spec.md`, seção 8) prevê erro de recurso não encontrado (404, código `FLASHCARD_001`).
- Escreva o teste com a expectativa da especificação e marque-o com `@Disabled` e justificativa clara caso a implementação atual retorne 500 por lançar `RuntimeException`.
- Registre no relatório o comportamento observado e a evidência, sem alterar código de produção para fazer o teste passar.

### CT-INT-10 — Cascade de exclusão (integração de serviço/JPA)

- Crie uma coleção com deck e cards.
- Invoque `collectionService.deleteCollection(id)` ou `collectionRepository.delete(collection)` e faça `flush`.
- Valide que o deck e os cards foram removidos pelos repositórios, comprovando a integridade/cascade no banco.
- Deixe claro no nome do teste que ele valida a camada de serviço/JPA, não um endpoint HTTP.

### CT-INT-11 — Verificações exploratórias de integridade

Investigue e reporte (sem necessariamente manter testes verdes para comportamentos incorretos):

- `POST /api/deck` com `collectionId` inexistente;
- `POST /api/card` com `deckId` inexistente;
- `POST /api/collection` sem `collectionName` ou com nome vazio.

Para cada caso, registre o status e o corpo retornados e compare com a especificação (`FLASHCARD_001`, `FLASHCARD_002`, `FLASHCARD_003`). Não codifique o comportamento incorreto como se fosse o esperado; use `@Disabled` com justificativa ou apenas documente no relatório.

## Regras de implementação

1. Proibido usar mocks, `@MockBean`, Mockito ou dados pré-fabricados que não passem pela aplicação.
2. Não altere o código de produção para acomodar os testes. Divergências devem ser reportadas, não corrigidas silenciosamente.
3. Não deixe dados residuais que afetem outros testes ou a suíte existente.
4. Execute também a suíte completa (`./mvnw test`) para garantir que os novos testes não quebram os existentes.
5. Evite asserções frágeis: não valide IDs gerados, timestamps exatos ou ordem não garantida.
6. Use nomes de teste descritivos e comentários apenas quando necessários para explicar regras de negócio.

## Entregáveis

- Testes de integração em `src/test/java/com/mindlessducks/coreflashcard/integration/`.
- Configuração de teste adicional, se indispensável, em `src/test/resources/`.
- Relatório final contendo:
  - testes criados e resultado de cada um;
  - comandos executados;
  - divergências entre implementação e especificação, com status obtido, status esperado e evidência;
  - análise dos casos exploratórios (CT-INT-11);
  - riscos e lacunas restantes.

## Critérios de aceite

- `./mvnw test -Dtest=CollectionApiIntegrationTest` (ou nome equivalente) executa com sucesso os testes ativos.
- Nenhum mock de repositório/serviço é usado.
- Os testes podem rodar em qualquer ordem e repetidamente sem falhas intermitentes.
- A suíte completa `./mvnw test` continua passando.
- Nenhum arquivo de `src/main/` foi alterado.
- Divergências (por exemplo, 404 esperado versus 500 atual) estão documentadas com evidência e testes `@Disabled` quando aplicável.

## Comandos de referência

```bash
# Executar apenas a nova suíte
./mvnw test -Dtest=CollectionApiIntegrationTest

# Executar toda a suíte
./mvnw test
```
