package com.mindlessducks.coreflashcard.services;

import com.mindlessducks.coreflashcard.dto.CreateDeckRequest;
import com.mindlessducks.coreflashcard.dto.DeckResponse;
import com.mindlessducks.coreflashcard.entities.Collection;
import com.mindlessducks.coreflashcard.entities.Deck;
import com.mindlessducks.coreflashcard.repositories.CollectionRepository;
import com.mindlessducks.coreflashcard.repositories.DeckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeckService {

    private final DeckRepository deckRepository;
    private final CollectionRepository collectionRepository;

    @Transactional
    public DeckResponse createDeck(CreateDeckRequest request) {
        Collection collection = collectionRepository.findById(request.collectionId())
                .orElseThrow(() -> new RuntimeException("Collection not found"));

        Deck deck = Deck.builder()
                .id(UUID.randomUUID())
                .name(request.deckName())
                .collection(collection)
                .build();
        Deck saved = deckRepository.save(deck);
        return new DeckResponse(saved.getId(), saved.getCollection().getId(), saved.getName(), List.of());
    }

    @Transactional(readOnly = true)
    public List<DeckResponse> getDecksByCollection(UUID collectionId) {
        return deckRepository.findByCollectionId(collectionId).stream()
                .map(d -> new DeckResponse(d.getId(), d.getCollection().getId(), d.getName(), List.of()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Deck getDeck(UUID id) {
        return deckRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deck not found"));
    }

    @Transactional
    public DeckResponse updateDeck(UUID id, String name) {
        Deck deck = getDeck(id);
        deck.setName(name);
        return new DeckResponse(deck.getId(), deck.getCollection().getId(), deck.getName(), List.of());
    }

    @Transactional
    public void deleteDeck(UUID id) {
        deckRepository.deleteById(id);
    }
}
