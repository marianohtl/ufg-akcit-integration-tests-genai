package com.mindlessducks.coreflashcard.dto;

import java.util.List;
import java.util.UUID;

public record DeckResponse(UUID deckId, UUID collectionId, String deckName, List<CardResponse> cards) {}