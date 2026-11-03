package com.mindlessducks.coreflashcard.dto;

import java.util.UUID;

public record CardResponse(UUID cardId, UUID deckId, String front, String back) {}