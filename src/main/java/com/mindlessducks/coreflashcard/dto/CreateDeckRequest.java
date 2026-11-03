package com.mindlessducks.coreflashcard.dto;
import java.util.UUID;
public record CreateDeckRequest(UUID collectionId, String deckName) {}