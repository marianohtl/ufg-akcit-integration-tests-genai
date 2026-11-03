package com.mindlessducks.coreflashcard.services;

import com.mindlessducks.coreflashcard.dto.CreateCardRequest;
import com.mindlessducks.coreflashcard.dto.CardResponse;
import com.mindlessducks.coreflashcard.entities.Card;
import com.mindlessducks.coreflashcard.entities.Deck;
import com.mindlessducks.coreflashcard.repositories.CardRepository;
import com.mindlessducks.coreflashcard.repositories.DeckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CardService {

    private final CardRepository cardRepository;
    private final DeckRepository deckRepository;

    @Transactional
    public CardResponse createCard(CreateCardRequest request) {
        Deck deck = deckRepository.findById(request.deckId())
                .orElseThrow(() -> new RuntimeException("Deck not found"));

        Card card = Card.builder()
                .id(UUID.randomUUID())
                .deck(deck)
                .front(request.cardFront())
                .back(request.cardBack())
                .build();
        Card saved = cardRepository.save(card);
        return new CardResponse(saved.getId(), saved.getDeck().getId(), saved.getFront(), saved.getBack());
    }

    @Transactional(readOnly = true)
    public List<CardResponse> getCardsByDeck(UUID deckId) {
        return cardRepository.findByDeckId(deckId).stream()
                .map(c -> new CardResponse(c.getId(), c.getDeck().getId(), c.getFront(), c.getBack()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Card getCard(UUID id) {
        return cardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Card not found"));
    }

    @Transactional
    public CardResponse updateCard(UUID id, String front, String back) {
        Card card = getCard(id);
        card.setFront(front);
        card.setBack(back);
        return new CardResponse(card.getId(), card.getDeck().getId(), card.getFront(), card.getBack());
    }

    @Transactional
    public void deleteCard(UUID id) {
        cardRepository.deleteById(id);
    }
}
