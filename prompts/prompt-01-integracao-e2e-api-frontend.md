# Prompt 1 — Testes de integração ponta a ponta (API real + front-end)

**Abordagem:** caixa-preta, orientada ao comportamento do usuário. A suíte deve exercitar o sistema completo por HTTP e por um navegador real — backend Spring Boot, H2 em memória e front-end estático — sem mocks ou stubs no caminho feliz. Esta abordagem é complementar à do Prompt 2, que atua em caixa-branca dentro do contexto Spring.

---

## Contexto do projeto

Repositório: `C:\projetinhos\akcit\genaiTestesIntegracao`

- Backend: Java 21, Spring Boot 3.4, Maven Wrapper, H2 em memória (`jdbc:h2:mem:flashcards-db`).
- Front-end: HTML/CSS/JavaScript puro em `frontend/`, servido pelo próprio Spring em `http://localhost:8080/`.
- Endpoint principal: `GET /api/collections/{id}`.
- Endpoints de preparação de dados:
  - `POST /api/collection` com `{"collectionName":"..."}` → `{"collectionId":"uuid","collectionName":"..."}`
  - `POST /api/deck` com `{"collectionId":"uuid","deckName":"..."}` → `{"deckId":"uuid","collectionId":"uuid","deckName":"...","cards":[]}`
  - `POST /api/card` com `{"deckId":"uuid","cardFront":"...","cardBack":"..."}` → `{"cardId":"uuid","deckId":"uuid","front":"...","back":"..."}`
- O front-end aceita o ID por formulário ou pela URL: `http://localhost:8080/?id=<UUID>`.
- A pasta `frontend/` também pode ser servida separadamente (ex.: `http://localhost:5500`) para validar CORS.

## Objetivo

Criar e executar uma suíte de testes E2E automatizada que valide a jornada completa de criação de uma coleção, decks e flashcards, a resposta de `GET /api/collections/{id}` e a renderização/interações da listagem no navegador.

## Stack e premissas

- Use **Playwright** como ferramenta de E2E, preferencialmente com JavaScript ou TypeScript.
- Crie a infraestrutura de testes isolada em `tests/e2e/` (por exemplo `tests/e2e/package.json`, `tests/e2e/playwright.config.js` e `tests/e2e/specs/`).
- Não altere `frontend/`, `src/main/` nem o contrato da API. Adições permitidas: arquivos de teste, configuração do Playwright, fixtures/helpers e documentação dentro de `tests/e2e/`.
- Não use mocks, stubs ou respostas fixas para os cenários de sucesso. Use a API real para criar os dados.
- O backend deve estar em execução em `http://localhost:8080`. A suíte deve falhar com mensagem clara se ele não estiver disponível.
- Configure `API_BASE_URL` (padrão `http://localhost:8080`) e `APP_BASE_URL` (padrão `http://localhost:8080`).
- Para o cenário de CORS, configure `DEV_APP_BASE_URL` (padrão `http://localhost:5500`); o servidor estático deve ser iniciado separadamente.
- Gere dados únicos por execução (timestamp + UUID curto) para evitar colisão, pois o H2 é compartilhado durante a execução do backend e não há endpoints de exclusão.
- Use seletores por papel, label ou texto visível (`getByRole`, `getByLabel`, `getByText`). Evite depender de classes CSS internas.
- Não use `waitForTimeout`/sleep fixo. Use asserções web-first do Playwright (`expect(locator).toBeVisible()`, `toHaveText()`, `toHaveCount()` etc.).
- Configure workers para execução estável (por exemplo `workers: 1`) e capture `trace`/`screenshot` em caso de falha.

## Cenários obrigatórios

Implemente, no mínimo, os casos abaixo. Use IDs de teste no nome dos testes para rastreabilidade.

### CT-E2E-01 — Fluxo feliz completo

1. Crie uma coleção com nome único.
2. Crie dois decks: `Citologia` e `Genética`.
3. Crie dois flashcards no primeiro deck e um no segundo, incluindo acentos, quebra de linha e caracteres especiais.
4. Consulte `GET /api/collections/{id}` e valide:
   - status 200 e `Content-Type` JSON;
   - nome e ID da coleção;
   - quantidade de decks e de cards;
   - conteúdo de `front` e `back` preservado.
5. Abra `APP_BASE_URL/?id=<id>` e valide na interface:
   - título da coleção, chips de totais e metadados;
   - nomes dos decks e contagem de cards;
   - ausência de erros no console do navegador.
6. Interaja com a listagem:
   - revelar a resposta de um card e conferir o texto;
   - “Mostrar respostas” e “Ocultar respostas” em lote;
   - filtrar por termo presente em uma pergunta e conferir deck/card exibidos;
   - filtrar por termo com acento usando a forma sem acento (ex.: `genetica` → `Genética`);
   - validar o estado “nenhum resultado” e limpar o filtro;
   - recolher e expandir todos os decks.
7. Recarregue a página com `?id=<id>` e valide que a coleção é carregada automaticamente.

### CT-E2E-02 — Coleção sem decks

Crie apenas a coleção, abra a listagem e valide o estado vazio (“Esta coleção ainda não possui decks”), sem cards e sem erros de console.

### CT-E2E-03 — Coleção inexistente

Use um UUID válido que não foi criado. Valide que a interface apresenta o estado de erro de forma amigável, sem quebrar a página e sem erro JavaScript não tratado. Registre como divergência o status retornado pelo backend: a especificação do projeto (`spec.md`, seção 8) prevê “Resource not found”, mas a implementação atual pode retornar HTTP 500. **Não altere o backend para o teste passar.** O teste deve validar o comportamento observável atual e a divergência deve constar no relatório.

### CT-E2E-04 — UUID inválido

Informe um valor como `abc` no formulário e valide:

- mensagem “Identificador inválido”;
- `aria-invalid="true"` no campo;
- foco retornando ao campo de ID;
- nenhuma requisição à API é necessária para esse caso.

### CT-E2E-05 — CORS com front-end em outra origem

Com a API em `http://localhost:8080` e `frontend/` servido em `http://localhost:5500`:

- carregue a página servida em 5500 e execute uma consulta com um ID válido;
- valide que a listagem é renderizada (requisição cross-origin bem-sucedida);
- opcionalmente, valide via `request` que a resposta traz cabeçalhos CORS adequados para uma requisição `Origin: http://localhost:5500`.

Documente o comando para iniciar o servidor estático e como rodar essa suíte separadamente (por exemplo, um projeto/tag `cors` no Playwright).

### CT-E2E-06 — Escape de conteúdo hostil

Crie um card cujo `front` contenha HTML/JS, por exemplo `<img src=x onerror="window.__xss=true">`. Abra a listagem e valide que o conteúdo aparece como texto, que não existe elemento `img` injetado e que `window.__xss` não foi definido.

### CT-E2E-07 — Falha de rede simulada

Intercepte apenas a chamada de coleção com `page.route()` e aborte a requisição. Valide que a interface exibe o estado “API indisponível” e o botão “Tentar novamente”, sem erro JavaScript não tratado. Em seguida, remova a interceptação e valide que a tentativa seguinte funciona. Essa injeção de falha é permitida somente neste cenário.

### CT-E2E-08 — Responsividade básica

Em viewport móvel (390×844), com uma coleção carregada, valide:

- ausência de overflow horizontal (`document.documentElement.scrollWidth <= window.innerWidth + 1`);
- campo de ID e botão de carga visíveis e utilizáveis;
- decks e filtros acessíveis;
- cards não ultrapassam a largura da tela.

## Regras de implementação

1. Testes independentes e executáveis em qualquer ordem. Não dependa do estado deixado por outro teste.
2. Não use dados fixos de coleções/decks/cards criados manualmente; crie tudo via API dentro da suíte.
3. Não mascare falhas com `test.skip`, `try/catch` ou asserções permissivas. Divergências devem ser reportadas com evidência.
4. Não altere código de produção para acomodar testes. Se algo precisar mudar, apenas proponha a mudança no relatório.
5. Preserve `trace`, screenshot e mensagens de erro em `tests/e2e/test-results/` (ou diretório equivalente) para falhas.
6. Adicione um `tests/e2e/README.md` com pré-requisitos, comandos e variáveis de ambiente.

## Entregáveis

- Estrutura Playwright em `tests/e2e/` com todos os cenários acima.
- Configuração para execução local (backend obrigatório; servidor estático opcional para CORS).
- `tests/e2e/README.md` com instruções reproduzíveis.
- Relatório final contendo:
  - quantidade de testes executados, aprovados, falhos e ignorados;
  - comandos utilizados;
  - tabela de divergências encontradas (ID, esperado, obtido, evidência e impacto);
  - riscos ou lacunas não cobertas.

## Critérios de aceite

- `npm test` (ou comando equivalente documentado) executa a suíte E2E de mesma origem com o backend rodando.
- A suíte CORS executa com o servidor estático em 5500.
- Todos os cenários obrigatórios estão implementados e passam, exceto divergências explicitamente documentadas e justificadas.
- Nenhum arquivo em `frontend/` ou `src/main/` foi alterado.
- O relatório permite reproduzir os resultados sem conhecimento prévio do projeto.

## Comandos de referência

```bash
# Backend (na raiz do projeto)
./mvnw spring-boot:run

# Infraestrutura de testes
cd tests/e2e
npm install
npx playwright install chromium
npm test

# Front-end em outra origem (opcional, para CORS)
python -m http.server 5500 --directory frontend
npm run test:cors
```
