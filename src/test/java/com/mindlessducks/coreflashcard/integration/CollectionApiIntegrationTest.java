package com.mindlessducks.coreflashcard.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindlessducks.coreflashcard.repositories.CardRepository;
import com.mindlessducks.coreflashcard.repositories.CollectionRepository;
import com.mindlessducks.coreflashcard.repositories.DeckRepository;
import com.mindlessducks.coreflashcard.services.CollectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de integração server-side gerados a partir do Prompt 2.
 *
 * <p>Sobe o contexto Spring completo, usa o H2 real e exercita a camada web com
 * MockMvc. Não usa mocks de repositório ou serviço.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Integração da API de coleções (Spring + MockMvc + H2)")
class CollectionApiIntegrationTest {

    private static final String ORIGEM_FRONTEND = "http://localhost:5500";
    private static final String REGEX_DATA_ISO = "\\d{4}-\\d{2}-\\d{2}T.*";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CollectionRepository collectionRepository;

    @Autowired
    private DeckRepository deckRepository;

    @Autowired
    private CardRepository cardRepository;

    @Autowired
    private CollectionService collectionService;

    @BeforeEach
    void limparDados() {
        // Ordem de FK: cards -> decks -> collections.
        cardRepository.deleteAll();
        deckRepository.deleteAll();
        collectionRepository.deleteAll();
    }

    // ------------------------------------------------------------------
    // CT-INT-01 — front-end estático
    // ------------------------------------------------------------------
    @Test
    @DisplayName("CT-INT-01 deve servir o front-end estático a partir de /")
    void deveServirFrontendEstaticoNaRaiz() throws Exception {
        // O MockMvc resolve a welcome page como forward para index.html; o
        // conteúdo real é validado diretamente em /index.html (ver README do
        // Prompt 2 e docs/testes-integracao/execucao.md).
        mockMvc.perform(get("/"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("index.html"));

        mockMvc.perform(get("/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("Core Flashcards")))
                .andExpect(content().string(containsString("Listagem")));

        mockMvc.perform(get("/js/app.js"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Listagem")));

        mockMvc.perform(get("/css/styles.css"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("--primary")));
    }

    // ------------------------------------------------------------------
    // CT-INT-02 — criação e consulta de coleção vazia
    // ------------------------------------------------------------------
    @Test
    @DisplayName("CT-INT-02 deve criar coleção e retornar a listagem agregada vazia")
    void deveCriarColecaoEConsultarListagemVazia() throws Exception {
        String nome = nomeUnico("Coleção vazia");
        UUID collectionId = criarColecao(nome);

        MvcResult resultado = mockMvc.perform(get("/api/collections/{id}", collectionId))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(collectionId.toString()))
                .andExpect(jsonPath("$.name").value(nome))
                .andExpect(jsonPath("$.createdAt").value(matchesPattern(REGEX_DATA_ISO)))
                .andExpect(jsonPath("$.updatedAt").value(matchesPattern(REGEX_DATA_ISO)))
                .andExpect(jsonPath("$.decks").isArray())
                .andExpect(jsonPath("$.decks", hasSize(0)))
                .andReturn();

        JsonNode corpo = lerCorpo(resultado);

        assertThat(corpo.has("userId")).as("campo userId deve existir no contrato").isTrue();
        assertThat(corpo.path("userId").isNull()).as("userId deve ser nulo quando não informado").isTrue();

        // Segunda leitura: idempotente e sem LazyInitializationException.
        mockMvc.perform(get("/api/collections/{id}", collectionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(nome))
                .andExpect(jsonPath("$.decks", hasSize(0)));
    }

    // ------------------------------------------------------------------
    // CT-INT-03 — deck vinculado
    // ------------------------------------------------------------------
    @Test
    @DisplayName("CT-INT-03 deve criar deck vinculado e exibi-lo na coleção")
    void deveCriarDeckVinculadoAColecao() throws Exception {
        UUID collectionId = criarColecao(nomeUnico("Coleção com deck"));
        String nomeDeck = nomeUnico("Deck");
        UUID deckId = criarDeck(collectionId, nomeDeck);

        mockMvc.perform(get("/api/collections/{id}", collectionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decks", hasSize(1)))
                .andExpect(jsonPath("$.decks[0].deckId").value(deckId.toString()))
                .andExpect(jsonPath("$.decks[0].collectionId").value(collectionId.toString()))
                .andExpect(jsonPath("$.decks[0].deckName").value(nomeDeck))
                .andExpect(jsonPath("$.decks[0].cards").isArray())
                .andExpect(jsonPath("$.decks[0].cards", hasSize(0)));
    }

    // ------------------------------------------------------------------
    // CT-INT-04 — cards e serialização
    // ------------------------------------------------------------------
    @Test
    @DisplayName("CT-INT-04 deve criar cards e preservar conteúdo na serialização")
    void deveCriarCardsEPreservarConteudoNaSerializacao() throws Exception {
        UUID collectionId = criarColecao(nomeUnico("Coleção com cards"));
        UUID deckId = criarDeck(collectionId, nomeUnico("Deck de Biologia"));

        String frente1 = "O que é a mitocôndria? Acentuação: ção, ã, é.";
        String verso1 = "Organela responsável pela respiração celular.\nProduz ATP.";
        String frente2 = "Qual a função do ribossomo?";
        String verso2 = "Sintetizar proteínas.";

        UUID card1 = criarCard(deckId, frente1, verso1);
        UUID card2 = criarCard(deckId, frente2, verso2);

        MvcResult resultado = mockMvc.perform(get("/api/collections/{id}", collectionId))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.decks", hasSize(1)))
                .andExpect(jsonPath("$.decks[0].cards", hasSize(2)))
                .andReturn();

        JsonNode cards = lerCorpo(resultado).path("decks").get(0).path("cards");

        assertThat(cards.size()).isEqualTo(2);

        JsonNode cardNode1 = encontrarCardPorFrente(cards, frente1);
        JsonNode cardNode2 = encontrarCardPorFrente(cards, frente2);

        assertThat(cardNode1).isNotNull();
        assertThat(cardNode2).isNotNull();
        assertThat(cardNode1.path("cardId").asText()).isEqualTo(card1.toString());
        assertThat(cardNode1.path("deckId").asText()).isEqualTo(deckId.toString());
        assertThat(cardNode1.path("back").asText()).isEqualTo(verso1);
        assertThat(cardNode2.path("cardId").asText()).isEqualTo(card2.toString());
        assertThat(cardNode2.path("back").asText()).isEqualTo(verso2);

        for (JsonNode card : cards) {
            assertThat(card.has("cardId")).isTrue();
            assertThat(card.has("deckId")).isTrue();
            assertThat(card.has("front")).isTrue();
            assertThat(card.has("back")).isTrue();
        }
    }

    // ------------------------------------------------------------------
    // CT-INT-05 — isolamento entre coleções
    // ------------------------------------------------------------------
    @Test
    @DisplayName("CT-INT-05 deve isolar decks e cards entre coleções")
    void deveIsolarDadosEntreColecoes() throws Exception {
        UUID colecaoA = criarColecao(nomeUnico("Coleção A"));
        UUID deckA = criarDeck(colecaoA, "Deck A");
        criarCard(deckA, "Pergunta A", "Resposta A");

        UUID colecaoB = criarColecao(nomeUnico("Coleção B"));
        UUID deckB = criarDeck(colecaoB, "Deck B");
        criarCard(deckB, "Pergunta B", "Resposta B");

        JsonNode corpoA = lerCorpo(mockMvc.perform(get("/api/collections/{id}", colecaoA))
                .andExpect(status().isOk())
                .andReturn());
        JsonNode corpoB = lerCorpo(mockMvc.perform(get("/api/collections/{id}", colecaoB))
                .andExpect(status().isOk())
                .andReturn());

        assertThat(nomesDosDecks(corpoA)).containsExactly("Deck A");
        assertThat(frentesDosCards(corpoA)).containsExactly("Pergunta A");
        assertThat(frentesDosCards(corpoA)).doesNotContain("Pergunta B");

        assertThat(nomesDosDecks(corpoB)).containsExactly("Deck B");
        assertThat(frentesDosCards(corpoB)).containsExactly("Pergunta B");
        assertThat(frentesDosCards(corpoB)).doesNotContain("Pergunta A");
    }

    // ------------------------------------------------------------------
    // CT-INT-06 — deck sem cards
    // ------------------------------------------------------------------
    @Test
    @DisplayName("CT-INT-06 deve representar deck sem cards com array vazio")
    void deveRetornarDeckSemCards() throws Exception {
        UUID collectionId = criarColecao(nomeUnico("Coleção com deck vazio"));
        criarDeck(collectionId, "Deck sem cards");

        mockMvc.perform(get("/api/collections/{id}", collectionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decks", hasSize(1)))
                .andExpect(jsonPath("$.decks[0].cards").isArray())
                .andExpect(jsonPath("$.decks[0].cards", hasSize(0)));
    }

    // ------------------------------------------------------------------
    // CT-INT-07 — UUID inválido
    // ------------------------------------------------------------------
    @Test
    @DisplayName("CT-INT-07 deve retornar 400 para UUID inválido no path")
    void deveRejeitarUuidInvalidoComBadRequest() throws Exception {
        // No MockMvc o 400 não executa o error dispatch e vem sem corpo/Content-Type.
        // No servidor real o Spring responde JSON padrão (timestamp/status/error/path),
        // que ainda não é o formato da spec. O contrato é coberto pelo CT-INT-07b.
        mockMvc.perform(get("/api/collections/nao-e-um-uuid"))
                .andExpect(status().isBadRequest());

        // A aplicação deve continuar funcional após a requisição inválida.
        UUID collectionId = criarColecao(nomeUnico("Após erro de UUID"));
        mockMvc.perform(get("/api/collections/{id}", collectionId))
                .andExpect(status().isOk());
    }

    @Test
    @Disabled("BUG-005: UUID inválido retorna 400 sem corpo JSON; a spec exige o "
            + "formato padrão de erro com code FLASHCARD_002.")
    @DisplayName("CT-INT-07b [spec] deve retornar erro JSON padronizado para UUID inválido")
    void deveRetornarErroJsonParaUuidInvalido() throws Exception {
        mockMvc.perform(get("/api/collections/nao-e-um-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.code").value("FLASHCARD_002"));
    }

    // ------------------------------------------------------------------
    // CT-INT-08 — CORS
    // ------------------------------------------------------------------
    @Test
    @DisplayName("CT-INT-08 deve permitir CORS para o front-end em outra origem")
    void devePermitirCorsParaFrontendEmOutraOrigem() throws Exception {
        UUID collectionId = criarColecao(nomeUnico("Coleção CORS"));

        mockMvc.perform(options("/api/collections/{id}", collectionId)
                        .header(HttpHeaders.ORIGIN, ORIGEM_FRONTEND)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().is2xxSuccessful())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ORIGEM_FRONTEND))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS, containsString("GET")));

        mockMvc.perform(get("/api/collections/{id}", collectionId)
                        .header(HttpHeaders.ORIGIN, ORIGEM_FRONTEND))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, ORIGEM_FRONTEND));
    }

    // ------------------------------------------------------------------
    // CT-INT-09 — divergência conhecida (404 x 500)
    // ------------------------------------------------------------------
    @Test
    @Disabled("BUG-001: a spec exige 404 com FLASHCARD_001; a implementação atual "
            + "lança RuntimeException em CollectionService e responde 500.")
    @DisplayName("CT-INT-09 [spec] deve retornar 404 para coleção inexistente")
    void deveRetornar404ParaColecaoInexistente() throws Exception {
        mockMvc.perform(get("/api/collections/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FLASHCARD_001"));
    }

    // ------------------------------------------------------------------
    // CT-INT-10 — cascade
    // ------------------------------------------------------------------
    @Test
    @DisplayName("CT-INT-10 deve remover decks e cards em cascata ao excluir a coleção")
    void deveRemoverCascadeAoExcluirColecao() throws Exception {
        UUID collectionId = criarColecao(nomeUnico("Coleção para cascade"));
        UUID deckId = criarDeck(collectionId, "Deck para cascade");
        criarCard(deckId, "Pergunta para cascade", "Resposta para cascade");

        assertThat(collectionRepository.count()).isEqualTo(1);
        assertThat(deckRepository.count()).isEqualTo(1);
        assertThat(cardRepository.count()).isEqualTo(1);

        collectionService.deleteCollection(collectionId);
        collectionRepository.flush();

        assertThat(collectionRepository.count()).isZero();
        assertThat(deckRepository.count()).isZero();
        assertThat(cardRepository.count()).isZero();
    }

    // ------------------------------------------------------------------
    // CT-INT-11 — verificações exploratórias (divergências)
    // ------------------------------------------------------------------
    @Test
    @Disabled("BUG-002: POST /api/deck com collectionId inexistente responde 500; "
            + "a spec prevê erro de relacionamento (FLASHCARD_003).")
    @DisplayName("CT-INT-11a [spec] deve rejeitar deck com coleção inexistente")
    void deveRejeitarDeckComColecaoInexistente() throws Exception {
        mockMvc.perform(post("/api/deck")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("collectionId", UUID.randomUUID().toString(), "deckName", "Órfão"))))
                .andExpect(status().is4xxClientError())
                .andExpect(jsonPath("$.code").value("FLASHCARD_003"));
    }

    @Test
    @Disabled("BUG-003: POST /api/card com deckId inexistente responde 500; "
            + "a spec prevê erro de relacionamento (FLASHCARD_003).")
    @DisplayName("CT-INT-11b [spec] deve rejeitar card com deck inexistente")
    void deveRejeitarCardComDeckInexistente() throws Exception {
        mockMvc.perform(post("/api/card")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "deckId", UUID.randomUUID().toString(),
                                "cardFront", "Pergunta órfã",
                                "cardBack", "Resposta órfã"))))
                .andExpect(status().is4xxClientError())
                .andExpect(jsonPath("$.code").value("FLASHCARD_003"));
    }

    @Test
    @Disabled("BUG-004: POST /api/collection sem collectionName viola o NOT NULL do banco "
            + "e responde 500; a spec prevê validação de dados inválidos (FLASHCARD_002).")
    @DisplayName("CT-INT-11c [spec] deve rejeitar coleção sem nome")
    void deveRejeitarColecaoSemNome() throws Exception {
        mockMvc.perform(post("/api/collection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("FLASHCARD_002"));
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    private UUID criarColecao(String nome) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/collection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("collectionName", nome))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.collectionName").value(nome))
                .andReturn();

        String collectionId = lerCorpo(resultado).path("collectionId").asText();
        assertThat(collectionId).isNotBlank();
        return UUID.fromString(collectionId);
    }

    private UUID criarDeck(UUID collectionId, String nome) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/deck")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "collectionId", collectionId.toString(),
                                "deckName", nome))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.collectionId").value(collectionId.toString()))
                .andExpect(jsonPath("$.deckName").value(nome))
                .andExpect(jsonPath("$.cards").isArray())
                .andExpect(jsonPath("$.cards", hasSize(0)))
                .andReturn();

        String deckId = lerCorpo(resultado).path("deckId").asText();
        assertThat(deckId).isNotBlank();
        return UUID.fromString(deckId);
    }

    private UUID criarCard(UUID deckId, String frente, String verso) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/card")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "deckId", deckId.toString(),
                                "cardFront", frente,
                                "cardBack", verso))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deckId").value(deckId.toString()))
                .andExpect(jsonPath("$.front").value(frente))
                .andExpect(jsonPath("$.back").value(verso))
                .andReturn();

        String cardId = lerCorpo(resultado).path("cardId").asText();
        assertThat(cardId).isNotBlank();
        return UUID.fromString(cardId);
    }

    private String json(Object valor) throws Exception {
        return objectMapper.writeValueAsString(valor);
    }

    private JsonNode lerCorpo(MvcResult resultado) throws Exception {
        return objectMapper.readTree(resultado.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private String nomeUnico(String prefixo) {
        return prefixo + " " + UUID.randomUUID();
    }

    private JsonNode encontrarCardPorFrente(JsonNode cards, String frente) {
        for (JsonNode card : cards) {
            if (frente.equals(card.path("front").asText())) {
                return card;
            }
        }
        return null;
    }

    private List<String> nomesDosDecks(JsonNode corpo) {
        List<String> nomes = new ArrayList<>();
        corpo.path("decks").forEach(deck -> nomes.add(deck.path("deckName").asText()));
        return nomes;
    }

    private List<String> frentesDosCards(JsonNode corpo) {
        List<String> frentes = new ArrayList<>();
        corpo.path("decks").forEach(deck ->
                deck.path("cards").forEach(card -> frentes.add(card.path("front").asText())));
        return frentes;
    }
}
