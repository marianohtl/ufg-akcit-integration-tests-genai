const { test, expect } = require("@playwright/test");

const {
  API_BASE_URL,
  abrirColecao,
  monitorConsole,
  seedCollection,
} = require("./support/api");

/**
 * Executado somente no projeto "cors" do Playwright, com o front-end servido
 * em http://localhost:5500 e a API em http://localhost:8080.
 */
test("CT-E2E-05 front-end em outra origem consegue consumir a API", async ({
  page,
  request,
}) => {
  const dados = await seedCollection(request);
  const erros = monitorConsole(page);

  await abrirColecao(page, dados.collection.collectionId);

  await expect(
    page.getByRole("heading", { level: 2, name: dados.collection.collectionName })
  ).toBeVisible();
  await expect(page.locator(".flashcard")).toHaveCount(3);
  expect(erros, `Erros de console: ${erros.join(" | ")}`).toEqual([]);

  const origem = new URL(page.url()).origin;
  const resposta = await request.get(
    `${API_BASE_URL}/api/collections/${dados.collection.collectionId}`,
    { headers: { Origin: origem } }
  );

  expect(resposta.ok()).toBeTruthy();

  // Válido para requisições sem credenciais: a API pode ecoar a origem
  // (allowedOriginPatterns) ou responder "*".
  const allowOrigin = resposta.headers()["access-control-allow-origin"];
  expect(allowOrigin === origem || allowOrigin === "*").toBeTruthy();
});
