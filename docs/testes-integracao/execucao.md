# Execução dos testes e registro no GitHub

## 1. Ambiente utilizado

| Item | Versão / observação |
| ---- | ------------------- |
| Sistema | Windows 11 (win32) |
| JDK | Eclipse Temurin 21.0.13+9 (LTS) |
| Maven | Apache Maven 3.9.9 (via Maven Wrapper) |
| Node.js | v22.23.4 |
| npm | 10.9.9 |
| Playwright | 1.64.1 |
| Chromium | Chrome for Testing 156.0.8078.4 |
| Banco | H2 2.3.232 em memória |
| Modelo | DeepSeek V4.1 Flash |

O JDK e o Node.js foram baixados como distribuições portáteis para a pasta temporária do ambiente,
sem instalação global, apenas para permitir a execução das suítes.

## 2. Comandos executados

### Testes server-side

```bash
./mvnw test -Dtest=CollectionApiIntegrationTest
./mvnw test
```

### Testes E2E — mesma origem

```bash
./mvnw spring-boot:run
cd tests/e2e
npm install
npx playwright install chromium
npm test
```

### Testes E2E — CORS

```bash
# front-end em outra origem
python -m http.server 5500 --directory frontend

# API já em execução na porta 8080
cd tests/e2e
npm run test:cors
```

## 3. Resultados

### 3.1 Suíte de integração Spring

| Métrica | Resultado |
| ------- | --------- |
| Casos executados | 14 |
| Aprovados | 9 |
| Falhas | 0 |
| Desabilitados | 5 |
| Tempo | ~7,3 s |

Testes desabilitados: CT-INT-07b, CT-INT-09, CT-INT-11a, CT-INT-11b e CT-INT-11c.

### 3.2 Suíte completa do backend

| Métrica | Resultado |
| ------- | --------- |
| Casos executados | 34 |
| Aprovados | 29 |
| Falhas | 0 |
| Desabilitados | 5 |
| Build | `BUILD SUCCESS` |

A suíte existente (`CardServiceTest`, `CollectionServiceTest`, `DeckServiceTest` e
`CoreflashcardApplicationTests`) continua passando.

### 3.3 Suíte E2E Playwright — mesma origem

| Caso | Resultado |
| ---- | --------- |
| CT-E2E-01 — fluxo completo | Aprovado |
| CT-E2E-02 — coleção sem decks | Aprovado |
| CT-E2E-03 — coleção inexistente | Aprovado |
| CT-E2E-04 — UUID inválido no cliente | Aprovado |
| CT-E2E-06 — conteúdo HTML hostil | Aprovado |
| CT-E2E-07 — falha de rede e retry | Aprovado |
| CT-E2E-08 — responsividade móvel | Aprovado |
| **Total** | **7 aprovados, 0 falhas (~5,0 s)** |

### 3.4 Suíte E2E Playwright — CORS

| Caso | Resultado |
| ---- | --------- |
| CT-E2E-05 — front-end em outra origem | Aprovado (~1,2 s) |

## 4. Evidências do comportamento real da API

As verificações abaixo foram feitas contra o backend Spring em execução na porta 8080.

| Verificação | Resultado observado |
| ----------- | ------------------- |
| `GET /api/collections/{uuid-inexistente}` | HTTP **500** com `Content-Type: application/json` (a spec prevê 404/`FLASHCARD_001`). |
| `GET /api/collections/nao-e-um-uuid` | HTTP **400** com `Content-Type: application/json`, usando o formato padrão do Spring (sem `{code, message}` da spec). |
| `GET /api/collections/{id}` com `Origin: http://localhost:5500` | HTTP 200 com `Access-Control-Allow-Origin: http://localhost:5500`. |
| `GET /` no MockMvc | HTTP 200 com forward para `index.html`. |
| `GET /index.html` | HTTP 200 com `Content-Type: text/html`. |
| [`/` no servidor real](http://localhost:8080/) | Front-end servido corretamente pelo Spring. |

Os resultados confirmam as divergências BUG-001 a BUG-005 catalogadas em
[casos-de-teste.md](casos-de-teste.md).

## 5. Ajustes feitos durante a execução

1. **Maven Wrapper incompleto:** o repositório não tinha `.mvn/wrapper/maven-wrapper.properties`.
   O arquivo foi restaurado com Maven 3.9.9 para que `./mvnw` funcionasse.
2. **Welcome page no MockMvc:** `/` responde com forward para `index.html`; o teste passou a
   validar `forwardedUrl("index.html")` e o conteúdo em `/index.html`.
3. **Charset nas asserções:** o MockMvc lê o HTML com charset padrão diferente de UTF-8; as
   asserções de conteúdo passaram a usar trechos ASCII.
4. **Error dispatch:** o MockMvc não executa o dispatch de erro como o servidor real; o teste ativo
   valida o status 400 e a expectativa do formato de erro ficou em CT-INT-07b (`@Disabled`).
5. **CORS:** o teste E2E passou a aceitar `Access-Control-Allow-Origin` igual à origem ou `*`,
   embora o Spring real ecoe a origem.
6. **Dados únicos:** como o H2 é compartilhado e não há endpoints de exclusão, os testes E2E criam
   coleções com nomes únicos por execução.

## 6. Publicação no GitHub

O experimento foi registrado no repositório público:

**https://github.com/marianohtl/ufg-akcit-integration-tests-genai**

- Branch: `main`.
- Commit inicial: `ebd9136` — `feat: add integration test suites and prompt experiment docs`.
- Commit de documentação/resultados: `cf31d6d` — `docs: record GitHub repository and execution results`.
- Repositório público utilizado para receber o projeto, as duas suítes de teste, os prompts e esta
  documentação.
- Push confirmado em 03/11/2026 (`main -> main`).

```text
$ git log --oneline -2
cf31d6d docs: record GitHub repository and execution results
ebd9136 feat: add integration test suites and prompt experiment docs
```

### Conteúdo publicado

- aplicação Spring Boot e front-end;
- `prompts/` com os dois prompts;
- `src/test/java/.../integration/CollectionApiIntegrationTest.java`;
- `tests/e2e/` com Playwright;
- `docs/testes-integracao/` com este relatório;
- `.mvn/wrapper/maven-wrapper.properties` e `.gitignore`.

### Reprodução a partir do repositório

```bash
git clone https://github.com/marianohtl/ufg-akcit-integration-tests-genai.git
cd ufg-akcit-integration-tests-genai
./mvnw test
```

## 7. Limitações da execução

- As versões de JDK e Node foram portáteis e temporárias; em outra máquina é necessário ter Java 21
  e Node 18+ instalados.
- O H2 é em memória: os dados criados nos testes E2E não persistem após reiniciar o backend.
- A suíte E2E usa um worker para manter estabilidade e evitar concorrência sobre o H2 compartilhado.
- O relatório não mede cobertura de linhas (por exemplo, JaCoCo); o foco é integração comportamental
  e de contrato.
