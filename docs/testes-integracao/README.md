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
| [Casos de teste](casos-de-teste.md) | Catálogo completo dos 21 casos, cobertura por dimensão e divergências. |
| [Análise e ajustes](analise-e-ajustes.md) | Como cada tipo de prompt influenciou qualidade/diversidade e quais ajustes foram necessários. |
| [Execução](execucao.md) | Ambiente, comandos, resultados das suítes e observações de execução. |

## Registro em repositório GitHub

O experimento foi estruturado para ser versionado como um repositório GitHub contendo:

- a aplicação original;
- os dois prompts em `prompts/`;
- as duas suítes de teste;
- esta documentação.

O repositório Git local foi inicializado neste diretório. A publicação em `github.com` depende de
credenciais de uma conta GitHub (`gh` autenticado ou token/SSH configurado), que não estão
disponíveis no ambiente de execução. O procedimento para concluir a publicação está descrito em
[Execução > Publicação no GitHub](execucao.md#publicação-no-github).

> Não foi inventada uma URL de repositório. Quando o remoto for configurado, este documento deve
> ser atualizado com o link público/privado e o hash do commit correspondente.

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
5. A experimentação revelou quatro divergências entre a API e a especificação, mantidas como
   testes `@Disabled` documentados para não mascarar os bugs.
