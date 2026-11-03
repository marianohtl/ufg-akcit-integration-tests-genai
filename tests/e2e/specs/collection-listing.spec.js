const { randomUUID } = require("node:crypto");
const { test, expect } = require("@playwright/test");

const {
  abrirColecao,
  createCard,
  createCollection,
  createDeck,
  monitorConsole,
  seedCollection,
} = require("./support/api");

test.describe("Listagem de coleção — fluxos principais", () => {
  test("CT-E2E-01 fluxo completo: criar dados, listar, revelar, filtrar e recarregar", async ({
    page,
    request,
  }) => {
    const dados = await seedCollection(request);
    const erros = monitorConsole(page);

    await abrirColecao(page, dados.collection.collectionId);

    await expect(
      page.getByRole("heading", { level: 2, name: dados.collection.collectionName })
    ).toBeVisible();

    await expect(page.locator(".chips")).toContainText("2 decks");
    await expect(page.locator(".chips")).toContainText("3 flashcards");
    await expect(page.locator(".meta-grid dd").first()).toHaveText(
      dados.collection.collectionId
    );

    await expect(page.locator('[data-action="toggle-deck"]')).toHaveCount(2);
    await expect(page.locator(".flashcard")).toHaveCount(3);

    const deckCitologia = page.locator(".deck").filter({ hasText: "Citologia" });
    const deckGenetica = page.locator(".deck").filter({ hasText: "Genética" });

    await expect(deckCitologia.locator(".flashcard")).toHaveCount(2);
    await expect(deckCitologia).toContainText("Qual a função do ribossomo?");
    await expect(deckGenetica.locator(".flashcard")).toHaveCount(1);

    // Revela a resposta de um card específico.
    const cardMitocondria = page
      .locator(".flashcard")
      .filter({ hasText: "O que é a mitocôndria?" });

    await cardMitocondria
      .getByRole("button", { name: "Mostrar resposta" })
      .click();

    await expect(cardMitocondria.getByText(dados.respostaMitocondria)).toBeVisible();
    await expect(
      cardMitocondria.getByRole("button", { name: "Ocultar resposta" })
    ).toBeVisible();

    // Revela e oculta todas as respostas pelo toolbar.
    await page
      .locator(".toolbar")
      .getByRole("button", { name: "Mostrar respostas" })
      .click();
    await expect(page.locator(".flashcard__answer[hidden]")).toHaveCount(0);

    await page
      .locator(".toolbar")
      .getByRole("button", { name: "Ocultar respostas" })
      .click();
    await expect(page.locator(".flashcard__answer[hidden]")).toHaveCount(3);

    // Filtro por conteúdo de card.
    const filtro = page.getByRole("searchbox", {
      name: "Filtrar decks e flashcards",
    });

    await filtro.fill("ribossomo");
    await expect(page.locator('[data-action="toggle-deck"]')).toHaveCount(1);
    await expect(page.locator(".flashcard")).toHaveCount(1);
    await expect(page.getByText("Qual a função do ribossomo?")).toBeVisible();

    // Filtro sem acento encontra "Genética".
    await filtro.fill("genetica");
    await expect(page.locator('[data-action="toggle-deck"]')).toHaveCount(1);
    await expect(page.locator(".deck")).toContainText("Genética");

    // Estado sem resultados e limpeza do filtro.
    await filtro.fill("zzzz");
    await expect(page.getByText("Nenhum resultado para este filtro")).toBeVisible();
    await page
      .locator(".no-results")
      .getByRole("button", { name: "Limpar filtro" })
      .click();
    await expect(page.locator('[data-action="toggle-deck"]')).toHaveCount(2);

    // Recolher e expandir todos os decks.
    await page
      .locator(".toolbar")
      .getByRole("button", { name: "Recolher decks" })
      .click();
    await expect(
      page.locator('[data-action="toggle-deck"][aria-expanded="false"]')
    ).toHaveCount(2);

    await page
      .locator(".toolbar")
      .getByRole("button", { name: "Expandir decks" })
      .click();
    await expect(
      page.locator('[data-action="toggle-deck"][aria-expanded="true"]')
    ).toHaveCount(2);

    // Recarregar mantém a coleção via query string.
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 2, name: dados.collection.collectionName })
    ).toBeVisible();
    await expect(page.locator(".flashcard")).toHaveCount(3);

    expect(erros, `Erros de console: ${erros.join(" | ")}`).toEqual([]);
  });

  test("CT-E2E-02 coleção sem decks exibe estado vazio", async ({ page, request }) => {
    const collection = await createCollection(request);
    const erros = monitorConsole(page);

    await abrirColecao(page, collection.collectionId);

    await expect(
      page.getByRole("heading", { level: 2, name: collection.collectionName })
    ).toBeVisible();
    await expect(page.locator(".chips")).toContainText("0 decks");
    await expect(page.locator(".chips")).toContainText("0 flashcards");
    await expect(
      page.getByText("Esta coleção ainda não possui decks")
    ).toBeVisible();
    await expect(page.locator(".flashcard")).toHaveCount(0);

    expect(erros, `Erros de console: ${erros.join(" | ")}`).toEqual([]);
  });

  test("CT-E2E-03 coleção inexistente exibe erro amigável", async ({ page }) => {
    const idInexistente = randomUUID();

    const [resposta] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/collections/${idInexistente}`) &&
          response.request().method() === "GET"
      ),
      page.goto(`/?id=${idInexistente}`),
    ]);

    test.info().annotations.push({
      type: "status-api",
      description: `GET /api/collections/{id} inexistente retornou HTTP ${resposta.status()}`,
    });

    expect(resposta.status()).toBeGreaterThanOrEqual(400);
    await expect(page.locator(".panel--error")).toBeVisible();
    await expect(page.locator(".error__title")).toContainText(
      /Coleção não encontrada|Erro ao carregar a coleção/
    );
    await expect(
      page.getByRole("button", { name: "Tentar novamente" })
    ).toBeVisible();
  });

  test("CT-E2E-04 UUID inválido é barrado no cliente", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Informe o ID de uma coleção")).toBeVisible();

    const input = page.getByRole("textbox", { name: "ID da coleção" });
    const requisicoesApi = [];

    page.on("request", (request) => {
      if (request.url().includes("/api/collections/")) {
        requisicoesApi.push(request.url());
      }
    });

    await input.fill("abc");
    await page.getByRole("button", { name: "Carregar coleção" }).click();

    await expect(page.locator(".error__title")).toHaveText("Identificador inválido");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toBeFocused();
    expect(requisicoesApi).toEqual([]);
  });

  test("CT-E2E-06 conteúdo HTML hostil é renderizado como texto", async ({
    page,
    request,
  }) => {
    const payload = '<img src=x onerror="window.__xss=true">';
    const collection = await createCollection(request);
    const deck = await createDeck(request, collection.collectionId, "Segurança");
    await createCard(request, deck.deckId, payload, "Resposta segura");

    const erros = monitorConsole(page);
    await abrirColecao(page, collection.collectionId);

    await expect(
      page.getByRole("heading", { level: 2, name: collection.collectionName })
    ).toBeVisible();
    await expect(
      page.locator(".flashcard__text").filter({ hasText: payload }).first()
    ).toBeVisible();
    await expect(page.locator(".flashcard img")).toHaveCount(0);

    const xss = await page.evaluate(() => window.__xss);
    expect(xss).toBeUndefined();
    expect(erros, `Erros de console: ${erros.join(" | ")}`).toEqual([]);
  });

  test("CT-E2E-07 falha de rede exibe erro e permite tentar novamente", async ({
    page,
    request,
  }) => {
    const dados = await seedCollection(request);
    await abrirColecao(page, dados.collection.collectionId);

    const titulo = page.getByRole("heading", {
      level: 2,
      name: dados.collection.collectionName,
    });
    await expect(titulo).toBeVisible();

    await page.route("**/api/collections/**", (route) => route.abort("failed"));
    await page.getByRole("button", { name: "Atualizar" }).click();

    await expect(page.locator(".error__title")).toHaveText("API indisponível");
    await expect(
      page.getByRole("button", { name: "Tentar novamente" })
    ).toBeVisible();

    await page.unroute("**/api/collections/**");
    await page.getByRole("button", { name: "Tentar novamente" }).click();

    await expect(titulo).toBeVisible();
    await expect(page.locator(".flashcard")).toHaveCount(3);
  });
});

test.describe("CT-E2E-08 responsividade móvel", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("listagem permanece utilizável sem overflow horizontal", async ({
    page,
    request,
  }) => {
    const dados = await seedCollection(request);
    await abrirColecao(page, dados.collection.collectionId);

    await expect(
      page.getByRole("heading", { level: 2, name: dados.collection.collectionName })
    ).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    await expect(
      page.getByRole("textbox", { name: "ID da coleção" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Carregar coleção" })
    ).toBeVisible();

    const filtro = page.getByRole("searchbox", {
      name: "Filtrar decks e flashcards",
    });
    await expect(filtro).toBeVisible();
    await expect(page.locator('[data-action="toggle-deck"]')).toHaveCount(2);

    await filtro.fill("genetica");
    await expect(page.locator('[data-action="toggle-deck"]')).toHaveCount(1);
    await expect(page.locator(".deck")).toContainText("Genética");
  });
});
