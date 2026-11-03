/**
 * Cliente HTTP do Flashcard Service.
 * Exposto em window.FlashcardsApi para uso pelo app.js (scripts clássicos,
 * permitindo abrir o index.html diretamente via file://).
 */
(function () {
  "use strict";

  const DEFAULT_API_PORT = "8080";
  const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  function stripTrailingSlashes(value) {
    return value.replace(/\/+$/, "");
  }

  /**
   * Resolve a base da API nesta ordem:
   * 1. <meta name="api-base-url" content="...">, quando preenchida;
   * 2. abertura via file:// -> http://localhost:8080;
   * 3. dev server em localhost (ex.: :5500) -> http://localhost:8080;
   * 4. qualquer outro cenário -> mesma origem da página.
   */
  function resolveApiBase() {
    const meta = document.querySelector('meta[name="api-base-url"]');
    const configured = meta && meta.content ? meta.content.trim() : "";

    if (configured) {
      return stripTrailingSlashes(configured);
    }

    if (window.location.protocol === "file:") {
      return "http://localhost:" + DEFAULT_API_PORT;
    }

    const host = window.location.hostname;
    const isLoopback = host === "localhost" || host === "127.0.0.1" || host === "[::1]";

    if (isLoopback && window.location.port !== DEFAULT_API_PORT) {
      return "http://localhost:" + DEFAULT_API_PORT;
    }

    return "";
  }

  const apiBase = resolveApiBase();

  class ApiError extends Error {
    constructor(message, options) {
      const opts = options || {};
      super(message);
      this.name = "ApiError";
      this.status = opts.status || 0;
      this.code = opts.code || "UNKNOWN";
      this.details = opts.details || null;
      this.endpoint = opts.endpoint || "";
      this.cause = opts.cause || null;
    }
  }

  /**
   * Extrai um UUID de um texto livre. Aceita o ID puro, um ID entre aspas
   * ou até a URL completa do endpoint (útil para colar direto do Swagger).
   */
  function extractCollectionId(rawValue) {
    if (typeof rawValue !== "string") {
      return null;
    }

    const value = rawValue.trim().replace(/^["']+|["']+$/g, "");
    const match = value.match(UUID_PATTERN);

    return match ? match[0].toLowerCase() : null;
  }

  function collectionPath(id) {
    return "/api/collections/" + encodeURIComponent(id);
  }

  function collectionUrl(id) {
    return apiBase + collectionPath(id);
  }

  function httpErrorMessage(status) {
    switch (status) {
      case 400:
        return "A API considerou o identificador inválido.";
      case 403:
        return "O acesso à API foi negado.";
      case 404:
        return "A coleção informada não foi encontrada.";
      case 409:
        return "A requisição entrou em conflito com o estado atual da API.";
      case 500:
        return "A API encontrou um erro interno ao buscar a coleção.";
      case 502:
      case 503:
      case 504:
        return "A API está temporariamente indisponível.";
      default:
        return "A API respondeu com o status HTTP " + status + ".";
    }
  }

  /**
   * Busca uma coleção completa (decks + cards) em GET /api/collections/{id}.
   * Resolve com o JSON da API ou rejeita com uma ApiError descritiva.
   */
  async function fetchCollection(id, options) {
    const opts = options || {};
    const timeoutMs = opts.timeoutMs || 15000;
    const externalSignal = opts.signal || null;
    const endpoint = collectionUrl(id);

    const controller = new AbortController();
    let timedOut = false;

    const timer = window.setTimeout(function () {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    function abortFromOutside() {
      controller.abort();
    }

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener("abort", abortFromOutside, { once: true });
      }
    }

    try {
      let response;

      try {
        response = await fetch(endpoint, {
          method: "GET",
          headers: { Accept: "application/json" },
          mode: "cors",
          cache: "no-store",
          signal: controller.signal,
        });
      } catch (error) {
        if (timedOut) {
          throw new ApiError(
            "A requisição demorou mais de " + Math.round(timeoutMs / 1000) + " segundos para responder.",
            { code: "TIMEOUT", endpoint: endpoint, cause: error }
          );
        }

        if (error && error.name === "AbortError") {
          throw error;
        }

        throw new ApiError(
          "Não foi possível conectar ao Flashcard Service. Verifique se a API está em execução.",
          { code: "NETWORK", endpoint: endpoint, cause: error }
        );
      }

      if (!response.ok) {
        let payload = null;

        try {
          payload = await response.json();
        } catch (_ignored) {
          payload = null;
        }

        throw new ApiError(httpErrorMessage(response.status), {
          status: response.status,
          code: "HTTP_" + response.status,
          details: payload,
          endpoint: endpoint,
        });
      }

      try {
        return await response.json();
      } catch (error) {
        throw new ApiError("A API retornou um conteúdo que não é um JSON válido.", {
          status: response.status,
          code: "INVALID_JSON",
          endpoint: endpoint,
          cause: error,
        });
      }
    } finally {
      window.clearTimeout(timer);

      if (externalSignal) {
        externalSignal.removeEventListener("abort", abortFromOutside);
      }
    }
  }

  window.FlashcardsApi = {
    apiBase: apiBase,
    collectionUrl: collectionUrl,
    extractCollectionId: extractCollectionId,
    fetchCollection: fetchCollection,
    ApiError: ApiError,
  };
})();
