package com.mindlessducks.coreflashcard.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CollectionDetailResponse(
    UUID id,
    String name,
    UUID userId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<DeckResponse> decks
) {}
