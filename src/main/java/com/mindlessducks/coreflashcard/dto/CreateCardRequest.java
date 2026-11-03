package com.mindlessducks.coreflashcard.dto;
import java.util.UUID;
public record CreateCardRequest(UUID deckId, String cardFront, String cardBack) {}