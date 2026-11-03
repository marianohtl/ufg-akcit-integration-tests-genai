# Testes E2E — Listagem de coleção

Suíte Playwright gerada a partir do **Prompt 1** (`prompts/prompt-01-integracao-e2e-api-frontend.md`).

A suíte exercita o sistema de ponta a ponta: API Spring Boot real, H2 em memória e o front-end
estático em `frontend/`. Não há mocks no caminho feliz.

## Pré-requisitos

- Java 21 e Maven Wrapper (`./mvnw` ou `mvnw.cmd`).
- Node.js 18+ e npm.
- Backend em execução em `http://localhost:8080`.
- Para o cenário de CORS: `frontend/` servido em `http://localhost:5500`.

## Instalação

```bash
cd tests/e2e
npm install
npx playwright install chromium
```

## Execução

Na raiz do projeto, em um terminal:

```bash
./mvnw spring-boot:run
```

No Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Em outro terminal:

```bash
cd tests/e2e
npm test
```

O comando `npm test` executa o projeto `same-origin` (front-end e API em `http://localhost:8080`).

### Cenário CORS

Sirva o front-end em outra origem:

```bash
python -m http.server 5500 --directory frontend
```

Depois:

```bash
cd tests/e2e
npm run test:cors
```

### Todos os projetos

```bash
npm run test:all
```

## Variáveis de ambiente

| Variável           | Padrão                  | Uso                                              |
| ------------------ | ----------------------- | ------------------------------------------------ |
| `API_BASE_URL`     | `http://localhost:8080` | URL da API usada para criar os dados e validar CORS |
| `APP_BASE_URL`     | valor de `API_BASE_URL` | URL do front-end no projeto `same-origin`        |
| `DEV_APP_BASE_URL` | `http://localhost:5500` | URL do front-end no projeto `cors`               |

## Casos implementados

| ID        | Cenário                                                        |
| --------- | -------------------------------------------------------------- |
| CT-E2E-01 | Fluxo completo: criar dados, listar, revelar, filtrar e recarregar |
| CT-E2E-02 | Coleção sem decks exibe estado vazio                           |
| CT-E2E-03 | Coleção inexistente exibe erro amigável                        |
| CT-E2E-04 | UUID inválido é barrado no cliente                             |
| CT-E2E-05 | Front-end em outra origem consegue consumir a API (CORS)       |
| CT-E2E-06 | Conteúdo HTML hostil é renderizado como texto                  |
| CT-E2E-07 | Falha de rede exibe erro e permite tentar novamente            |
| CT-E2E-08 | Listagem utilizável em viewport móvel, sem overflow horizontal |

## Observações

- Os dados são criados via API com nomes únicos por execução, pois o H2 é compartilhado e não há
  endpoints de exclusão.
- Os testes usam asserções web-first e não dependem de `sleep`.
- Em caso de falha, Playwright mantém trace, screenshot e vídeo em `test-results/`.
- O cenário **CT-E2E-03** registra uma anotação com o status HTTP retornado para coleção inexistente.
  A especificação prevê 404, mas a implementação atual pode responder 500; a divergência está
  documentada em `docs/testes-integracao/`.
