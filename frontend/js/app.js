/**
 * Core Flashcards · Listagem de coleção
 * Consome GET /api/collections/{id} e renderiza a coleção, seus decks e cards.
 */
(function () {
  "use strict";

  const {
    apiBase,
    collectionUrl,
    extractCollectionId,
    fetchCollection,
    ApiError,
  } = window.FlashcardsApi;

  const STORAGE_KEY = "coreflashcards:last-collection-id";

  /* ------------------------------------------------------------------------
     Ícones (markup estático e confiável)
     ------------------------------------------------------------------------ */
  const ICON_PATHS = {
    chevron: '<path d="m6 9 6 6 6-6" />',
    chevrons: '<path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" />',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />',
    eyeOff:
      '<path d="m3 3 18 18" /><path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.1" /><path d="M6.6 6.6A18 18 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 5.4-1.4" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />',
    refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />',
    external:
      '<path d="M14 3h7v7" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />',
    folder:
      '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />',
    layers:
      '<path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" />',
    cards:
      '<rect x="3" y="7" width="14" height="14" rx="2" /><path d="M7 3h12a2 2 0 0 1 2 2v12" />',
    alert:
      '<path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />',
    info: '<circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" />',
    x: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
    sparkles:
      '<path d="m12 3 1.8 4.9L19 9.7l-5.2 1.8L12 16.4l-1.8-4.9L5 9.7l5.2-1.8L12 3Z" /><path d="M19 15.5 19.8 18l2.2.8-2.2.8L19 22l-.8-2.4-2.2-.8 2.2-.8.8-2.5Z" />',
  };

  function svgMarkup(name) {
    const paths = ICON_PATHS[name] || "";
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + paths + "</svg>"
    );
  }

  function setIcon(element, name) {
    if (element) {
      element.innerHTML = svgMarkup(name);
    }
  }

  function icon(name, className) {
    const span = document.createElement("span");
    span.className = "icon" + (className ? " " + className : "");
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = svgMarkup(name);
    return span;
  }

  /* ------------------------------------------------------------------------
     Helpers de DOM
     ------------------------------------------------------------------------ */
  function h(tag, attributes, children) {
    const node = document.createElement(tag);
    const attrs = attributes || {};

    Object.keys(attrs).forEach(function (key) {
      const value = attrs[key];

      if (value === undefined || value === null || value === false) {
        return;
      }

      if (key === "class") {
        node.className = value;
      } else if (key === "text") {
        node.textContent = value;
      } else if (key === "dataset") {
        Object.assign(node.dataset, value);
      } else if (key.slice(0, 2) === "on" && typeof value === "function") {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) {
        node.setAttribute(key, "");
      } else {
        node.setAttribute(key, value);
      }
    });

    [].concat(children || []).forEach(function (child) {
      if (child === undefined || child === null || child === false) {
        return;
      }
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    });

    return node;
  }

  /* ------------------------------------------------------------------------
     Estado e referências
     ------------------------------------------------------------------------ */
  const state = {
    phase: "idle",
    collection: null,
    collectionId: null,
    error: null,
    filter: "",
    collapsedDecks: new Set(),
    revealedCards: new Set(),
    controller: null,
  };

  const dom = {
    form: document.getElementById("collection-form"),
    input: document.getElementById("collection-id"),
    submit: document.getElementById("load-btn"),
    status: document.getElementById("status"),
    result: document.getElementById("result"),
    apiBadge: document.getElementById("api-badge"),
    apiLabel: document.getElementById("api-label"),
    swaggerLink: document.getElementById("swagger-link"),
    year: document.getElementById("year"),
    toast: document.getElementById("toast"),
  };

  /* ------------------------------------------------------------------------
     Formatação
     ------------------------------------------------------------------------ */
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
  }

  function countLabel(count, singular, plural) {
    return count + " " + (count === 1 ? singular : plural);
  }

  function normalizeText(value) {
    return String(value === undefined || value === null ? "" : value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function describeApiBase() {
    if (!apiBase) {
      return window.location.host || "mesma origem";
    }

    try {
      return new URL(apiBase).host;
    } catch (_ignored) {
      return apiBase;
    }
  }

  function swaggerHref() {
    return (apiBase || "") + "/swagger-ui/index.html";
  }

  /* ------------------------------------------------------------------------
     Feedback
     ------------------------------------------------------------------------ */
  function announce(message) {
    dom.status.textContent = message;
  }

  let toastTimer = null;

  function showToast(message, tone) {
    dom.toast.textContent = message;
    dom.toast.dataset.tone = tone === "error" ? "error" : "success";
    dom.toast.classList.add("is-visible");

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      dom.toast.classList.remove("is-visible");
    }, 2800);
  }

  function setApiState(online) {
    dom.apiBadge.classList.toggle("is-online", online);
    dom.apiBadge.classList.toggle("is-offline", !online);
  }

  function updateSubmitState(busy) {
    dom.submit.disabled = busy;
    dom.form.setAttribute("aria-busy", String(busy));

    const label = dom.submit.querySelector(".btn__label");

    if (label) {
      label.textContent = busy ? "Carregando…" : "Carregar coleção";
    }
  }

  function persistId(id) {
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch (_ignored) {
      /* armazenamento indisponível */
    }
  }

  function readStoredId() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || "";
    } catch (_ignored) {
      return "";
    }
  }

  function syncUrl(id) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("id", id);
      window.history.replaceState({}, "", url);
    } catch (_ignored) {
      /* histórico indisponível (ex.: file:// em alguns navegadores) */
    }
  }

  /* ------------------------------------------------------------------------
     Cópia para a área de transferência
     ------------------------------------------------------------------------ */
  function fallbackCopy(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";

    document.body.appendChild(area);
    area.select();

    const copied = document.execCommand("copy");

    area.remove();

    if (!copied) {
      throw new Error("Não foi possível copiar.");
    }
  }

  async function copyText(text, label) {
    if (!text) {
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
        } catch (_clipboardDenied) {
          fallbackCopy(text);
        }
      } else {
        fallbackCopy(text);
      }

      showToast(label + " copiado.");
    } catch (_ignored) {
      showToast("Não foi possível copiar. Tente selecionar o texto manualmente.", "error");
    }
  }

  /* ------------------------------------------------------------------------
     Renderização · estados
     ------------------------------------------------------------------------ */
  function renderIdle() {
    const section = h("section", { class: "panel panel--empty", "aria-labelledby": "idle-title" }, [
      h("div", { class: "empty__art", "aria-hidden": "true" }, [
        icon("sparkles", "icon--xl"),
      ]),
      h("div", { class: "panel__content" }, [
        h("p", { class: "eyebrow" }, "Comece por aqui"),
        h("h2", { class: "panel__title", id: "idle-title" }, "Informe o ID de uma coleção"),
        h("p", { class: "panel__text" }, [
          "A listagem consulta ",
          h("code", {}, "GET /api/collections/{id}"),
          " e apresenta todos os decks e flashcards da coleção.",
        ]),
        h("ol", { class: "steps" }, [
          h("li", {}, [
            h("span", { class: "steps__num", "aria-hidden": "true" }, "1"),
            h("div", {}, [
              h("strong", {}, "Suba o Flashcard Service"),
              h("p", {}, "Na raiz do projeto, execute ./mvnw spring-boot:run."),
            ]),
          ]),
          h("li", {}, [
            h("span", { class: "steps__num", "aria-hidden": "true" }, "2"),
            h("div", {}, [
              h("strong", {}, "Crie uma coleção com dados"),
              h("p", {}, "Use o Swagger para chamar POST /api/collection, /api/deck e /api/card."),
            ]),
          ]),
          h("li", {}, [
            h("span", { class: "steps__num", "aria-hidden": "true" }, "3"),
            h("div", {}, [
              h("strong", {}, "Cole o collectionId acima"),
              h("p", {}, "O UUID retornado na criação da coleção é o identificador da listagem."),
            ]),
          ]),
        ]),
        h(
          "a",
          {
            class: "btn btn--soft",
            href: swaggerHref(),
            target: "_blank",
            rel: "noopener",
          },
          ["Abrir Swagger", icon("external")]
        ),
      ]),
    ]);

    dom.result.replaceChildren(section);
  }

  function renderLoading() {
    const collectionSkeleton = h(
      "div",
      { class: "skeleton skeleton--collection", "aria-hidden": "true" },
      [
        h("div", { class: "skeleton-line skeleton-line--eyebrow" }),
        h("div", { class: "skeleton-line skeleton-line--title" }),
        h("div", { class: "skeleton-row" }, [
          h("div", { class: "skeleton-line skeleton-line--chip" }),
          h("div", { class: "skeleton-line skeleton-line--chip" }),
        ]),
        h("div", { class: "skeleton-row" }, [
          h("div", { class: "skeleton-card" }),
          h("div", { class: "skeleton-card" }),
          h("div", { class: "skeleton-card" }),
        ]),
      ]
    );

    const deckSkeleton = h("div", { class: "skeleton", "aria-hidden": "true" }, [
      h("div", { class: "skeleton-line skeleton-line--short" }),
      h("div", { class: "skeleton-row" }, [
        h("div", { class: "skeleton-card" }),
        h("div", { class: "skeleton-card" }),
        h("div", { class: "skeleton-card" }),
      ]),
    ]);

    const wrapper = h("div", { class: "loading", "aria-busy": "true" }, [
      h("p", { class: "loading__note" }, [icon("refresh", "icon--spin"), "Buscando decks e flashcards…"]),
      collectionSkeleton,
      deckSkeleton,
      deckSkeleton.cloneNode(true),
    ]);

    dom.result.replaceChildren(wrapper);
  }

  function describeError(error) {
    switch (error.code) {
      case "INVALID_ID":
        return {
          title: "Identificador inválido",
          message: "O valor informado não contém um UUID válido.",
          hint:
            "O ID deve ter o formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. " +
            "Copie o collectionId retornado ao criar a coleção.",
        };
      case "NETWORK":
        return {
          title: "API indisponível",
          message: error.message,
          hint:
            "Confirme se o backend está rodando na porta 8080 (./mvnw spring-boot:run) " +
            "e se o endereço da API está correto.",
        };
      case "TIMEOUT":
        return {
          title: "A API demorou demais para responder",
          message: error.message,
          hint: "Tente novamente em instantes e verifique os logs do serviço.",
        };
      case "HTTP_404":
        return {
          title: "Coleção não encontrada",
          message: "Nenhuma coleção corresponde ao identificador informado.",
          hint:
            "Confira se o UUID está completo. Lembre-se: o banco H2 é em memória, " +
            "então os dados são perdidos quando a API reinicia.",
        };
      case "HTTP_400":
        return {
          title: "Requisição inválida",
          message: "A API não aceitou o identificador enviado.",
          hint: "Verifique o formato do UUID e tente novamente.",
        };
      case "HTTP_500":
        return {
          title: "Erro ao carregar a coleção",
          message: "A API respondeu com um erro interno ao buscar a coleção.",
          hint:
            "Se o ID estiver correto, a coleção pode não existir no banco. " +
            "Como o H2 é em memória, recrie os dados após reiniciar o serviço.",
        };
      case "INVALID_JSON":
      case "INVALID_RESPONSE":
        return {
          title: "Resposta inesperada",
          message: error.message,
          hint: "Confirme se o endpoint está retornando JSON no formato esperado.",
        };
      default:
        return {
          title: "Não foi possível carregar a coleção",
          message: error.message,
          hint: "Tente novamente ou verifique os logs da API.",
        };
    }
  }

  function errorDetails(error) {
    const rows = [];

    if (error.endpoint) {
      rows.push(["Endpoint", error.endpoint]);
    }
    if (error.status) {
      rows.push(["Status HTTP", String(error.status)]);
    }
    if (error.code) {
      rows.push(["Código", error.code]);
    }

    if (error.details && typeof error.details === "object") {
      if (typeof error.details.code === "string") {
        rows.push(["Código da API", error.details.code]);
      }
      if (typeof error.details.message === "string") {
        rows.push(["Mensagem da API", error.details.message]);
      }
    }

    return rows;
  }

  function renderError(error) {
    const info = describeError(error);
    const rows = errorDetails(error);

    const actions = h("div", { class: "error__actions" });

    if (state.collectionId) {
      actions.append(
        h(
          "button",
          { class: "btn btn--primary", type: "button", "data-action": "retry" },
          [icon("refresh"), "Tentar novamente"]
        )
      );
    }

    actions.append(
      h(
        "button",
        {
          class: state.collectionId ? "btn btn--soft" : "btn btn--primary",
          type: "button",
          "data-action": "focus-input",
        },
        [icon("search"), "Informar outro ID"]
      )
    );

    const content = h("div", {}, [
      h("h2", { class: "error__title", id: "error-title" }, info.title),
      h("p", { class: "error__message" }, info.message),
      h("p", { class: "error__hint" }, info.hint),
      actions,
    ]);

    const panel = h(
      "section",
      { class: "panel panel--error", "aria-labelledby": "error-title" },
      [
        h("div", { class: "error__icon", "aria-hidden": "true" }, [icon("alert")]),
        content,
      ]
    );

    if (rows.length) {
      const list = h("dl");

      rows.forEach(function (row) {
        list.append(h("dt", {}, row[0]));
        list.append(h("dd", {}, row[1]));
      });

      panel.append(
        h("details", { class: "error__details" }, [
          h("summary", {}, "Detalhes técnicos"),
          list,
        ])
      );
    }

    dom.result.replaceChildren(panel);
  }

  function showInvalidId(rawValue) {
    state.phase = "error";
    state.collection = null;
    state.collectionId = null;
    state.error = new ApiError("O valor informado não contém um UUID válido.", {
      code: "INVALID_ID",
      details: { value: String(rawValue || "") },
    });

    dom.input.setAttribute("aria-invalid", "true");
    renderError(state.error);
    announce("Identificador inválido. Informe o UUID da coleção.");
    dom.input.focus();
    dom.input.select();
  }

  /* ------------------------------------------------------------------------
     Renderização · coleção
     ------------------------------------------------------------------------ */
  function metaItem(label, value) {
    return h("div", {}, [h("dt", {}, label), h("dd", {}, value)]);
  }

  function dateNode(value) {
    const formatted = formatDate(value);

    if (!formatted) {
      return h("span", { class: "muted" }, "Não disponível");
    }

    return h("time", { datetime: String(value) }, formatted);
  }

  function buildFilterBar() {
    const input = h("input", {
      id: "deck-filter",
      type: "search",
      class: "filter__input",
      placeholder: "Filtrar decks e flashcards…",
      "aria-label": "Filtrar decks e flashcards",
      autocomplete: "off",
      spellcheck: "false",
    });
    input.value = state.filter;

    const clearButton = h(
      "button",
      {
        class: "filter__clear",
        type: "button",
        "data-action": "clear-filter",
        "aria-label": "Limpar filtro",
        hidden: !state.filter,
      },
      [icon("x")]
    );

    return h("div", { class: "filter" }, [
      icon("search", "filter__icon"),
      input,
      clearButton,
    ]);
  }

  function buildDeckSection() {
    const toolbar = h("div", { class: "toolbar" }, [
      buildFilterBar(),
      h("div", { class: "toolbar__actions" }, [
        h(
          "button",
          {
            class: "btn btn--ghost btn--sm",
            type: "button",
            "data-action": "toggle-answers",
          },
          [icon("eye"), h("span", { class: "js-answers-label" }, "Mostrar respostas")]
        ),
        h(
          "button",
          {
            class: "btn btn--ghost btn--sm",
            type: "button",
            "data-action": "toggle-decks",
          },
          [icon("chevrons"), h("span", { class: "js-decks-label" }, "Recolher decks")]
        ),
      ]),
    ]);

    return h("section", { class: "decks-section", "aria-labelledby": "decks-title" }, [
      h("div", { class: "section-head" }, [
        h("div", {}, [
          h("h3", { class: "section-head__title", id: "decks-title" }, "Decks"),
          h("p", { class: "section-head__text" }, "Flashcards agrupados por deck."),
        ]),
        toolbar,
      ]),
      h("div", { class: "decks", id: "decks" }),
    ]);
  }

  function renderCollection(options) {
    const opts = options || {};
    const collection = state.collection;
    const cardCount = collection.decks.reduce(function (total, deck) {
      return total + deck.cards.length;
    }, 0);

    const title = h(
      "h2",
      {
        class: "collection__title",
        id: "collection-title",
        tabindex: "-1",
      },
      collection.name
    );

    const head = h("header", { class: "collection__head" }, [
      h("div", { class: "collection__intro" }, [
        h("p", { class: "eyebrow" }, [icon("folder"), "Coleção"]),
        title,
        h("div", { class: "chips" }, [
          h("span", { class: "chip" }, [
            icon("layers"),
            countLabel(collection.decks.length, "deck", "decks"),
          ]),
          h("span", { class: "chip" }, [
            icon("cards"),
            countLabel(cardCount, "flashcard", "flashcards"),
          ]),
        ]),
      ]),
      h("div", { class: "collection__actions" }, [
        h(
          "button",
          { class: "btn btn--soft", type: "button", "data-action": "refresh" },
          [icon("refresh"), "Atualizar"]
        ),
        h(
          "button",
          { class: "btn btn--soft", type: "button", "data-action": "copy-id" },
          [icon("copy"), "Copiar ID"]
        ),
        h(
          "a",
          {
            class: "btn btn--soft",
            href: collectionUrl(collection.id),
            target: "_blank",
            rel: "noopener",
            title: "Abrir a resposta JSON da API",
          },
          [icon("external"), "JSON"]
        ),
      ]),
    ]);

    const meta = h("dl", { class: "meta-grid" }, [
      metaItem("ID da coleção", h("code", {}, collection.id)),
      metaItem(
        "Usuário",
        collection.userId ? h("code", {}, collection.userId) : h("span", { class: "muted" }, "Não informado")
      ),
      metaItem("Criada em", dateNode(collection.createdAt)),
      metaItem("Atualizada em", dateNode(collection.updatedAt)),
    ]);

    const header = h("article", { class: "panel collection", "aria-labelledby": "collection-title" }, [
      head,
      meta,
    ]);

    dom.result.replaceChildren(header, buildDeckSection());
    renderDecks();

    const filter = document.getElementById("deck-filter");
    if (filter) {
      filter.value = state.filter;
      filter.addEventListener("input", handleFilterInput);
    }

    if (opts.focusTitle !== false) {
      title.focus();
    }
  }

  /* ------------------------------------------------------------------------
     Renderização · decks e cards
     ------------------------------------------------------------------------ */
  function filterDecks(decks, term) {
    if (!term) {
      return decks.map(function (deck) {
        return { deck: deck, cards: deck.cards };
      });
    }

    return decks.reduce(function (results, deck) {
      if (normalizeText(deck.deckName).indexOf(term) !== -1) {
        results.push({ deck: deck, cards: deck.cards });
        return results;
      }

      const cards = deck.cards.filter(function (card) {
        return (
          normalizeText(card.front).indexOf(term) !== -1 ||
          normalizeText(card.back).indexOf(term) !== -1
        );
      });

      if (cards.length) {
        results.push({ deck: deck, cards: cards });
      }

      return results;
    }, []);
  }

  function getVisibleDecks() {
    if (!state.collection) {
      return [];
    }

    return filterDecks(state.collection.decks, normalizeText(state.filter));
  }

  function getVisibleCards() {
    return getVisibleDecks().reduce(function (cards, entry) {
      return cards.concat(entry.cards);
    }, []);
  }

  function renderCard(card, deckIndex, cardIndex) {
    const revealed = state.revealedCards.has(card.key);
    const answerId = "flashcard-answer-" + deckIndex + "-" + cardIndex;

    const answer = h(
      "div",
      { class: "flashcard__answer", id: answerId, hidden: !revealed },
      [
        h("p", { class: "flashcard__label flashcard__label--answer" }, "Resposta"),
        h("p", { class: "flashcard__text" }, card.back || "Sem conteúdo"),
      ]
    );

    const revealButton = h(
      "button",
      {
        class: "flashcard__reveal",
        type: "button",
        "data-action": "toggle-card",
        "data-card-key": card.key,
        "aria-expanded": String(revealed),
        "aria-controls": answerId,
      },
      [
        icon(revealed ? "eyeOff" : "eye"),
        h("span", { class: "flashcard__reveal-label" }, revealed ? "Ocultar resposta" : "Mostrar resposta"),
      ]
    );

    return h("li", { class: "flashcard" }, [
      h("div", { class: "flashcard__top" }, [
        h("span", { class: "flashcard__num", "aria-hidden": "true" }, String(cardIndex + 1).padStart(2, "0")),
        revealButton,
      ]),
      h("div", { class: "flashcard__front" }, [
        h("p", { class: "flashcard__label" }, "Pergunta"),
        h("p", { class: "flashcard__text" }, card.front || "Sem conteúdo"),
      ]),
      answer,
    ]);
  }

  function renderDeck(deck, cards, index) {
    const collapsed = state.collapsedDecks.has(deck.key);
    const panelId = "deck-panel-" + index;
    const nameId = "deck-name-" + index;
    const total = deck.cards.length;
    const countText =
      state.filter.trim() && cards.length !== total
        ? cards.length + " de " + countLabel(total, "flashcard", "flashcards")
        : countLabel(total, "flashcard", "flashcards");

    const toggle = h(
      "button",
      {
        class: "deck__toggle",
        type: "button",
        "data-action": "toggle-deck",
        "data-deck-key": deck.key,
        "aria-expanded": String(!collapsed),
        "aria-controls": panelId,
      },
      [
        h("span", { class: "deck__chevron", "aria-hidden": "true" }, [icon("chevron")]),
        h("span", { class: "deck__identity" }, [
          h("span", { class: "deck__name", id: nameId }, deck.deckName),
          h("span", { class: "deck__id" }, ["ID ", h("code", {}, deck.deckId || "—")]),
        ]),
      ]
    );

    const body = h(
      "div",
      { class: "deck__body", id: panelId, hidden: collapsed },
      [
        cards.length
          ? h(
              "ul",
              { class: "flashcards" },
              cards.map(function (card, cardIndex) {
                return renderCard(card, index, cardIndex);
              })
            )
          : h("p", { class: "deck__empty" }, [icon("info"), "Nenhum flashcard neste deck."]),
      ]
    );

    return h("article", { class: "deck", "data-deck-key": deck.key, "aria-labelledby": nameId }, [
      h("div", { class: "deck__header" }, [
        h("h4", { class: "deck__heading" }, [toggle]),
        h("span", { class: "chip chip--muted" }, countText),
      ]),
      body,
    ]);
  }

  function renderEmptyDecks() {
    return h("div", { class: "no-results" }, [
      h("span", { class: "no-results__icon", "aria-hidden": "true" }, [icon("layers")]),
      h("p", { class: "no-results__title" }, "Esta coleção ainda não possui decks"),
      h(
        "p",
        { class: "no-results__text" },
        "Crie um deck com POST /api/deck informando o collectionId e recarregue a listagem."
      ),
      h(
        "button",
        { class: "btn btn--soft", type: "button", "data-action": "refresh" },
        [icon("refresh"), "Recarregar"]
      ),
    ]);
  }

  function renderNoResults() {
    return h("div", { class: "no-results" }, [
      h("span", { class: "no-results__icon", "aria-hidden": "true" }, [icon("search")]),
      h("p", { class: "no-results__title" }, "Nenhum resultado para este filtro"),
      h(
        "p",
        { class: "no-results__text" },
        "Nenhum deck ou flashcard corresponde a “" + state.filter.trim() + "”."
      ),
      h(
        "button",
        { class: "btn btn--soft", type: "button", "data-action": "clear-filter" },
        [icon("x"), "Limpar filtro"]
      ),
    ]);
  }

  function renderDecks() {
    const container = document.getElementById("decks");

    if (!container || !state.collection) {
      return;
    }

    if (!state.collection.decks.length) {
      container.replaceChildren(renderEmptyDecks());
      syncToolbar();
      return;
    }

    const results = getVisibleDecks();

    if (!results.length) {
      container.replaceChildren(renderNoResults());
      syncToolbar();
      return;
    }

    const fragment = document.createDocumentFragment();

    results.forEach(function (entry, index) {
      fragment.appendChild(renderDeck(entry.deck, entry.cards, index));
    });

    container.replaceChildren(fragment);
    syncToolbar();
  }

  /* ------------------------------------------------------------------------
     Interações
     ------------------------------------------------------------------------ */
  function applyCardState(button, revealed) {
    const answer = document.getElementById(button.getAttribute("aria-controls"));

    if (answer) {
      answer.hidden = !revealed;
    }

    button.setAttribute("aria-expanded", String(revealed));
    setIcon(button.querySelector(".icon"), revealed ? "eyeOff" : "eye");

    const label = button.querySelector(".flashcard__reveal-label");

    if (label) {
      label.textContent = revealed ? "Ocultar resposta" : "Mostrar resposta";
    }
  }

  function applyDeckState(button, expanded) {
    button.setAttribute("aria-expanded", String(expanded));

    const body = document.getElementById(button.getAttribute("aria-controls"));

    if (body) {
      body.hidden = !expanded;
    }
  }

  function toggleCard(button) {
    const key = button.dataset.cardKey;
    const revealed = state.revealedCards.has(key);

    if (revealed) {
      state.revealedCards.delete(key);
    } else {
      state.revealedCards.add(key);
    }

    applyCardState(button, !revealed);
    syncToolbar();
  }

  function toggleDeck(button) {
    const key = button.dataset.deckKey;
    const expanded = button.getAttribute("aria-expanded") === "true";

    if (expanded) {
      state.collapsedDecks.add(key);
    } else {
      state.collapsedDecks.delete(key);
    }

    applyDeckState(button, !expanded);
    syncToolbar();
  }

  function toggleAllAnswers() {
    const cards = getVisibleCards();

    if (!cards.length) {
      return;
    }

    const allRevealed = cards.every(function (card) {
      return state.revealedCards.has(card.key);
    });

    cards.forEach(function (card) {
      if (allRevealed) {
        state.revealedCards.delete(card.key);
      } else {
        state.revealedCards.add(card.key);
      }
    });

    dom.result.querySelectorAll('[data-action="toggle-card"]').forEach(function (button) {
      applyCardState(button, !allRevealed);
    });

    syncToolbar();
  }

  function toggleAllDecks() {
    const buttons = Array.from(dom.result.querySelectorAll('[data-action="toggle-deck"]'));

    if (!buttons.length) {
      return;
    }

    const allExpanded = buttons.every(function (button) {
      return button.getAttribute("aria-expanded") === "true";
    });

    buttons.forEach(function (button) {
      applyDeckState(button, !allExpanded);

      if (allExpanded) {
        state.collapsedDecks.add(button.dataset.deckKey);
      } else {
        state.collapsedDecks.delete(button.dataset.deckKey);
      }
    });

    syncToolbar();
  }

  function clearFilter() {
    state.filter = "";

    const input = document.getElementById("deck-filter");
    const clearButton = dom.result.querySelector('[data-action="clear-filter"]');

    if (input) {
      input.value = "";
      input.focus();
    }

    if (clearButton) {
      clearButton.hidden = true;
    }

    renderDecks();
  }

  function handleFilterInput(event) {
    state.filter = event.target.value;

    const clearButton = dom.result.querySelector('[data-action="clear-filter"]');

    if (clearButton) {
      clearButton.hidden = !state.filter;
    }

    // Novos resultados devem ficar visíveis ao filtrar.
    state.collapsedDecks.clear();
    renderDecks();
  }

  function syncToolbar() {
    const answersButton = dom.result.querySelector('[data-action="toggle-answers"]');
    const cards = getVisibleCards();
    const hasCards = cards.length > 0;

    if (answersButton) {
      answersButton.disabled = !hasCards;

      const allRevealed =
        hasCards &&
        cards.every(function (card) {
          return state.revealedCards.has(card.key);
        });

      const answersLabel = answersButton.querySelector(".js-answers-label");

      if (answersLabel) {
        answersLabel.textContent = allRevealed ? "Ocultar respostas" : "Mostrar respostas";
      }

      setIcon(answersButton.querySelector(".icon"), allRevealed ? "eyeOff" : "eye");
    }

    const decksButton = dom.result.querySelector('[data-action="toggle-decks"]');
    const deckButtons = Array.from(dom.result.querySelectorAll('[data-action="toggle-deck"]'));
    const allExpanded =
      deckButtons.length > 0 &&
      deckButtons.every(function (button) {
        return button.getAttribute("aria-expanded") === "true";
      });

    if (decksButton) {
      decksButton.disabled = deckButtons.length === 0;

      const decksLabel = decksButton.querySelector(".js-decks-label");

      if (decksLabel) {
        decksLabel.textContent = allExpanded ? "Recolher decks" : "Expandir decks";
      }
    }
  }

  function handleResultClick(event) {
    const trigger = event.target.closest("[data-action]");

    if (!trigger || !dom.result.contains(trigger)) {
      return;
    }

    switch (trigger.dataset.action) {
      case "toggle-card":
        toggleCard(trigger);
        break;
      case "toggle-deck":
        toggleDeck(trigger);
        break;
      case "toggle-answers":
        toggleAllAnswers();
        break;
      case "toggle-decks":
        toggleAllDecks();
        break;
      case "clear-filter":
        clearFilter();
        break;
      case "refresh":
        if (state.collectionId) {
          loadCollection(state.collectionId, { focusTitle: false });
        }
        break;
      case "retry":
        if (state.collectionId) {
          loadCollection(state.collectionId);
        }
        break;
      case "copy-id":
        if (state.collection) {
          copyText(state.collection.id, "ID da coleção");
        }
        break;
      case "focus-input":
        dom.input.focus();
        dom.input.select();
        break;
      default:
        break;
    }
  }

  /* ------------------------------------------------------------------------
     Normalização da resposta
     ------------------------------------------------------------------------ */
  function normalizeCollection(payload, fallbackId) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new ApiError("A API retornou uma resposta inesperada ao buscar a coleção.", {
        code: "INVALID_RESPONSE",
        endpoint: collectionUrl(fallbackId),
      });
    }

    const decksSource = Array.isArray(payload.decks) ? payload.decks : [];

    const decks = decksSource.map(function (rawDeck, deckIndex) {
      const deck = rawDeck && typeof rawDeck === "object" ? rawDeck : {};
      const deckId = typeof deck.deckId === "string" ? deck.deckId : "";
      const deckKey = deckId || "deck-" + deckIndex;
      const cardsSource = Array.isArray(deck.cards) ? deck.cards : [];

      const cards = cardsSource.map(function (rawCard, cardIndex) {
        const card = rawCard && typeof rawCard === "object" ? rawCard : {};
        const cardId = typeof card.cardId === "string" ? card.cardId : "";

        return {
          cardId: cardId,
          key: cardId || deckKey + "-card-" + cardIndex,
          front: typeof card.front === "string" ? card.front : "",
          back: typeof card.back === "string" ? card.back : "",
        };
      });

      return {
        deckId: deckId,
        key: deckKey,
        deckName:
          typeof deck.deckName === "string" && deck.deckName.trim()
            ? deck.deckName
            : "Deck sem nome",
        cards: cards,
      };
    });

    return {
      id: typeof payload.id === "string" ? payload.id : fallbackId,
      name:
        typeof payload.name === "string" && payload.name.trim()
          ? payload.name
          : "Coleção sem nome",
      userId: typeof payload.userId === "string" ? payload.userId : null,
      createdAt: payload.createdAt || null,
      updatedAt: payload.updatedAt || null,
      decks: decks,
    };
  }

  /* ------------------------------------------------------------------------
     Carga da coleção
     ------------------------------------------------------------------------ */
  async function loadCollection(rawId, options) {
    const opts = options || {};
    const id = extractCollectionId(rawId);

    if (!id) {
      if (state.controller) {
        state.controller.abort();
        state.controller = null;
      }

      updateSubmitState(false);
      showInvalidId(rawId);
      return;
    }

    if (state.controller) {
      state.controller.abort();
    }

    const controller = new AbortController();
    state.controller = controller;
    state.phase = "loading";
    state.collection = null;
    state.collectionId = id;
    state.error = null;
    state.filter = "";
    state.collapsedDecks.clear();
    state.revealedCards.clear();

    dom.input.value = id;
    dom.input.removeAttribute("aria-invalid");
    updateSubmitState(true);
    syncUrl(id);
    renderLoading();
    announce("Carregando a coleção " + id + ".");

    try {
      const payload = await fetchCollection(id, { signal: controller.signal });

      if (state.controller !== controller) {
        return;
      }

      state.collection = normalizeCollection(payload, id);
      state.phase = "success";

      persistId(id);
      setApiState(true);
      renderCollection({ focusTitle: opts.focusTitle });

      const cardCount = state.collection.decks.reduce(function (total, deck) {
        return total + deck.cards.length;
      }, 0);

      announce(
        "Coleção " +
          state.collection.name +
          " carregada com " +
          state.collection.decks.length +
          " decks e " +
          cardCount +
          " flashcards."
      );
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }

      if (state.controller !== controller) {
        return;
      }

      state.phase = "error";
      state.error = error;

      if (error.status) {
        setApiState(true);
      } else if (error.code === "NETWORK" || error.code === "TIMEOUT") {
        setApiState(false);
      }

      renderError(error);
      announce(describeError(error).title + ": " + error.message);
    } finally {
      if (state.controller === controller) {
        state.controller = null;
        updateSubmitState(false);
      }
    }
  }

  /* ------------------------------------------------------------------------
     Bootstrap
     ------------------------------------------------------------------------ */
  function handleSubmit(event) {
    event.preventDefault();

    if (state.phase === "loading") {
      return;
    }

    loadCollection(dom.input.value, { focusTitle: true });
  }

  function init() {
    dom.year.textContent = String(new Date().getFullYear());
    dom.swaggerLink.href = swaggerHref();
    dom.apiLabel.textContent = describeApiBase();
    dom.apiBadge.title = "API: " + (apiBase || window.location.origin || "mesma origem");

    dom.form.addEventListener("submit", handleSubmit);
    dom.result.addEventListener("click", handleResultClick);

    dom.input.addEventListener("input", function () {
      dom.input.removeAttribute("aria-invalid");
    });

    dom.input.value = readStoredId();

    const idFromUrl = new URLSearchParams(window.location.search).get("id");

    if (idFromUrl && idFromUrl.trim()) {
      const normalized = extractCollectionId(idFromUrl);

      if (normalized) {
        dom.input.value = normalized;
        loadCollection(normalized, { focusTitle: false });
      } else {
        dom.input.value = idFromUrl;
        showInvalidId(idFromUrl);
      }

      return;
    }

    renderIdle();
  }

  init();
})();
