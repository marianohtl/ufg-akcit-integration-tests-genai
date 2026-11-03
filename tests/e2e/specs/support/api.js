const { randomUUID } = require("node:crypto");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8080";

function uniqueName(prefix) {
  return `${prefix} ${Date.now()} ${randomUUID().slice(0, 8)}`;
}

async function apiPost(request, path, data) {
  const response = await request.post(`${API_BASE_URL}${path}`, {
    data,
    headers: { Accept: "application/json" },
  });

  if (!response.ok()) {
    const corpo = await response.text();
    throw new Error(`POST ${path} falhou com HTTP ${response.status()}: ${corpo}`);
  }

  return response.json();
}

async function createCollection(request, nome) {
  return apiPost(request, "/api/collection", {
    collectionName: nome || uniqueName("Coleção E2E"),
  });
}

async function createDeck(request, collectionId, nome) {
  return apiPost(request, "/api/deck", {
    collectionId,
    deckName: nome,
  });
}

async function createCard(request, deckId, front, back) {
  return apiPost(request, "/api/card", {
    deckId,
    cardFront: front,
    cardBack: back,
  });
}

/**
 * Cria uma coleção com dois decks e três cards, usada na maioria dos cenários.
 * Os nomes dos decks são fixos para facilitar as asserções; a coleção é única
 * por execução para evitar colisão no H2 compartilhado.
 */
async function seedCollection(request) {
  const collection = await createCollection(request);
  const citologia = await createDeck(request, collection.collectionId, "Citologia");
  const genetica = await createDeck(request, collection.collectionId, "Genética");

  const respostaMitocondria =
    "Organela responsável pela respiração celular e produção de ATP.";

  const cardMitocondria = await createCard(
    request,
    citologia.deckId,
    "O que é a mitocôndria?",
    respostaMitocondria
  );

  const cardRibossomo = await createCard(
    request,
    citologia.deckId,
    "Qual a função do ribossomo?",
    "Sintetizar proteínas."
  );

  const cardDna = await createCard(
    request,
    genetica.deckId,
    "O que é DNA?",
    "Ácido desoxirribonucleico, responsável pela informação genética."
  );

  return {
    collection,
    decks: { citologia, genetica },
    cards: [cardMitocondria, cardRibossomo, cardDna],
    respostaMitocondria,
  };
}

function monitorConsole(page) {
  const erros = [];

  page.on("pageerror", (erro) => {
    erros.push(`pageerror: ${erro.message}`);
  });

  page.on("console", (mensagem) => {
    if (mensagem.type() === "error") {
      erros.push(`console: ${mensagem.text()}`);
    }
  });

  return erros;
}

async function abrirColecao(page, collectionId) {
  await page.goto(`/?id=${encodeURIComponent(collectionId)}`);
}

module.exports = {
  API_BASE_URL,
  abrirColecao,
  createCard,
  createCollection,
  createDeck,
  monitorConsole,
  seedCollection,
  uniqueName,
  apiPost,
};
