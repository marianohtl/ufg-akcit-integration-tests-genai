package com.mindlessducks.coreflashcard.services;

import com.mindlessducks.coreflashcard.dto.CreateCardRequest;
import com.mindlessducks.coreflashcard.dto.CardResponse;
import com.mindlessducks.coreflashcard.entities.Card;
import com.mindlessducks.coreflashcard.entities.Deck;
import com.mindlessducks.coreflashcard.repositories.CardRepository;
import com.mindlessducks.coreflashcard.repositories.DeckRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CardServiceTest {

    @Mock
    private CardRepository cardRepository;

    @Mock
    private DeckRepository deckRepository;

    @InjectMocks
    private CardService cardService;

    private Card sampleCard;
    private Deck sampleDeck;
    private UUID cardId;
    private UUID deckId;

    @BeforeEach
    void setUp() {
        cardId = UUID.randomUUID();
        deckId = UUID.randomUUID();

        sampleDeck = new Deck();
        sampleDeck.setId(deckId);
        sampleDeck.setName("Test Deck");

        sampleCard = new Card();
        sampleCard.setId(cardId);
        sampleCard.setFront("Front");
        sampleCard.setBack("Back");
        sampleCard.setDeck(sampleDeck);
    }

    @Test
    void createCard_WhenDeckExists_ShouldReturnCardResponse() {
        // Arrange
        CreateCardRequest request = new CreateCardRequest(deckId, "New Front", "New Back");
        when(deckRepository.findById(deckId)).thenReturn(Optional.of(sampleDeck));
        
        Card savedCard = new Card();
        savedCard.setId(cardId);
        savedCard.setFront("New Front");
        savedCard.setBack("New Back");
        savedCard.setDeck(sampleDeck);
        
        when(cardRepository.save(any(Card.class))).thenReturn(savedCard);

        // Act
        CardResponse response = cardService.createCard(request);

        // Assert
        assertNotNull(response);
        assertEquals("New Front", response.front());
        assertEquals("New Back", response.back());
        assertEquals(deckId, response.deckId());
        verify(deckRepository, times(1)).findById(deckId);
        verify(cardRepository, times(1)).save(any(Card.class));
    }

    @Test
    void createCard_WhenDeckDoesNotExist_ShouldThrowException() {
        // Arrange
        CreateCardRequest request = new CreateCardRequest(deckId, "Front", "Back");
        when(deckRepository.findById(deckId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> cardService.createCard(request));
        verify(cardRepository, never()).save(any(Card.class));
    }

    @Test
    void getCardsByDeck_ShouldReturnList() {
        // Arrange
        when(cardRepository.findByDeckId(deckId)).thenReturn(List.of(sampleCard));

        // Act
        List<CardResponse> response = cardService.getCardsByDeck(deckId);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals(cardId, response.get(0).cardId());
        verify(cardRepository, times(1)).findByDeckId(deckId);
    }

    @Test
    void getCard_WhenExists_ShouldReturnCard() {
        // Arrange
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(sampleCard));

        // Act
        Card result = cardService.getCard(cardId);

        // Assert
        assertNotNull(result);
        assertEquals(cardId, result.getId());
        verify(cardRepository, times(1)).findById(cardId);
    }

    @Test
    void getCard_WhenNotExists_ShouldThrowException() {
        // Arrange
        when(cardRepository.findById(cardId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> cardService.getCard(cardId));
    }

    @Test
    void updateCard_WhenExists_ShouldReturnUpdatedResponse() {
        // Arrange
        String newFront = "Updated Front";
        String newBack = "Updated Back";
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(sampleCard));

        // Act
        CardResponse response = cardService.updateCard(cardId, newFront, newBack);

        // Assert
        assertEquals(newFront, response.front());
        assertEquals(newBack, response.back());
        assertEquals(deckId, response.deckId());
        verify(cardRepository, times(1)).findById(cardId);
    }

    @Test
    void deleteCard_ShouldCallRepository() {
        // Act
        cardService.deleteCard(cardId);

        // Assert
        verify(cardRepository, times(1)).deleteById(cardId);
    }
}
