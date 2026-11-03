package com.mindlessducks.coreflashcard.services;

import com.mindlessducks.coreflashcard.dto.CollectionDetailResponse;
import com.mindlessducks.coreflashcard.dto.CardResponse;
import com.mindlessducks.coreflashcard.dto.CollectionDetailResponse;
import com.mindlessducks.coreflashcard.dto.CollectionResponse;
import com.mindlessducks.coreflashcard.dto.CreateCollectionRequest;
import com.mindlessducks.coreflashcard.dto.DeckResponse;
import com.mindlessducks.coreflashcard.entities.Collection;
import com.mindlessducks.coreflashcard.repositories.CollectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRepository collectionRepository;

    @Transactional
    public CollectionResponse createCollection(CreateCollectionRequest request) {
        Collection collection = Collection.builder()
                .id(UUID.randomUUID())
                .name(request.collectionName())
                .build();
        Collection saved = collectionRepository.save(collection);
        return new CollectionResponse(saved.getId(), saved.getName());
    }

    @Transactional(readOnly = true)
    public List<CollectionResponse> getCollectionsByUser(UUID userId) {
        return collectionRepository.findByUserId(userId).stream()
                .map(c -> new CollectionResponse(c.getId(), c.getName()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CollectionDetailResponse getCollection(UUID id) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Collection not found"));
        
        List<DeckResponse> deckResponses = collection.getDecks().stream()
                .map(deck -> new DeckResponse(
                        deck.getId(),
                        deck.getCollection().getId(),
                        deck.getName(),
                        deck.getCards().stream()
                                .map(card -> new CardResponse(card.getId(), deck.getId(), card.getFront(), card.getBack()))
                                .toList()
                ))
                .toList();

        return new CollectionDetailResponse(
                collection.getId(),
                collection.getName(),
                collection.getUserId(),
                collection.getCreatedAt(),
                collection.getUpdatedAt(),
                deckResponses
        );
    }

    @Transactional
    public CollectionResponse updateCollection(UUID id, String name) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Collection not found"));
        collection.setName(name);
        return new CollectionResponse(collection.getId(), collection.getName());
    }

    @Transactional
    public void deleteCollection(UUID id) {
        collectionRepository.deleteById(id);
    }
}
