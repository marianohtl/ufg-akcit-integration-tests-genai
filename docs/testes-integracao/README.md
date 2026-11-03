# Experimentação de prompts para testes de integração

Esta pasta reúne a documentação do experimento de uso dos dois prompts de testes de integração do
projeto **Core Flashcards / Flashcard Service**.

## Resumo

- **Prompts avaliados:**
  - [Prompt 1 — E2E caixa-preta](../../prompts/prompt-01-integracao-e2e-api-frontend.md)
  - [Prompt 2 — Spring/MockMvc caixa-branca](../../prompts/prompt-02-integracao-backend-spring-mockmvc.md)
- **Modelo:** DeepSeek V4.1 Flash (OpenCode).
- **Data:** 02/11/2026.
- **Casos gerados:** 22 (8 E2E + 14 Spring), sendo 17 ativos e 5 desabilitados por divergências com
  a especificação.
- **Suítes implementadas:**
  - `tests/e2e/` — Playwright (API real + navegador).
  - `src/test/java/com/mindlessducks/coreflashcard/integration/` — Spring Boot + MockMvc + H2.

## Documentos

| Documento | Conteúdo |
| --------- | -------- |
| [Casos de teste](casos-de-teste.md) | Catálogo completo dos 22 casos, cobertura por dimensão e divergências. |
| [Análise e ajustes](analise-e-ajustes.md) | Como cada tipo de prompt influenciou qualidade/diversidade e quais ajustes foram necessários. |
| [Execução](execucao.md) | Ambiente, comandos, resultados das suítes e observações de execução. |

## Registro em repositório GitHub

O experimento foi publicado no repositório público:

**https://github.com/marianohtl/ufg-akcit-integration-tests-genai**

- Branch: `main`.
- Commit inicial: `ebd9136` — `feat: add integration test suites and prompt experiment docs`.
- O repositório contém a aplicação, os dois prompts, as duas suítes de teste, o catálogo de casos,
  a análise dos prompts e as evidências de execução.

Detalhes do ambiente e da publicação estão em [Execução](execucao.md#6-publicação-no-github).

## Como reproduzir

### Testes server-side

```bash
./mvnw test -Dtest=CollectionApiIntegrationTest
```

### Testes E2E

```bash
# terminal 1, na raiz
./mvnw spring-boot:run

# terminal 2
cd tests/e2e
npm install
npx playwright install chromium
npm test
```

### CORS

```bash
# terminal 2, na raiz
python -m http.server 5500 --directory frontend

# terminal 3
cd tests/e2e
npm run test:cors
```

## Principais conclusões

1. O Prompt 1 (caixa-preta) gerou casos mais **realistas e diversos em contexto de uso**, cobrindo
   UI, CORS real, XSS, falha de rede e responsividade.
2. O Prompt 2 (caixa-branca) gerou casos mais **precisos e determinísticos**, cobrindo contrato,
   serialização, persistência, cascade e semântica de erro.
3. A sobreposição entre as suítes é pequena; elas se complementam.
4. Os ajustes mais importantes foram: contrato explícito, política para divergências (spec ×
   implementação), separação do cenário CORS e isolamento de dados.
5. A experimentação revelou cinco divergências entre a API e a especificação, mantidas como
   testes `@Disabled` documentados para não mascarar os bugs.
