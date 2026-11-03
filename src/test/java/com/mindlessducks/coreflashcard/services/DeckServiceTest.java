package com.mindlessducks.coreflashcard.services;

import com.mindlessducks.coreflashcard.dto.CreateDeckRequest;
import com.mindlessducks.coreflashcard.dto.DeckResponse;
import com.mindlessducks.coreflashcard.entities.Collection;
import com.mindlessducks.coreflashcard.entities.Deck;
import com.mindlessducks.coreflashcard.repositories.CollectionRepository;
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
class DeckServiceTest {

    @Mock
    private DeckRepository deckRepository;

    @Mock
    private CollectionRepository collectionRepository;

    @InjectMocks
    private DeckService deckService;

    private Deck sampleDeck;
    private Collection sampleCollection;
    private UUID deckId;
    private UUID collectionId;

    @BeforeEach
    void setUp() {
        collectionId = UUID.randomUUID();
        deckId = UUID.randomUUID();

        sampleCollection = new Collection();
        sampleCollection.setId(collectionId);
        sampleCollection.setName("Test Collection");

        sampleDeck = new Deck();
        sampleDeck.setId(deckId);
        sampleDeck.setName("Test Deck");
        sampleDeck.setCollection(sampleCollection);
        sampleDeck.setCards(new ArrayList<>());
    }

    @Test
    void createDeck_WhenCollectionExists_ShouldReturnDeckResponse() {
        // Arrange
        CreateDeckRequest request = new CreateDeckRequest(collectionId, "New Deck");
        when(collectionRepository.findById(collectionId)).thenReturn(Optional.of(sampleCollection));
        
        Deck savedDeck = new Deck();
        savedDeck.setId(deckId);
        savedDeck.setName("New Deck");
        savedDeck.setCollection(sampleCollection);
        
        when(deckRepository.save(any(Deck.class))).thenReturn(savedDeck);

        // Act
        DeckResponse response = deckService.createDeck(request);

        // Assert
        assertNotNull(response);
        assertEquals("New Deck", response.deckName());
        assertEquals(collectionId, response.collectionId());
        assertEquals(deckId, response.deckId());
        verify(collectionRepository, times(1)).findById(collectionId);
        verify(deckRepository, times(1)).save(any(Deck.class));
    }

    @Test
    void createDeck_WhenCollectionDoesNotExist_ShouldThrowException() {
        // Arrange
        CreateDeckRequest request = new CreateDeckRequest(collectionId, "New Deck");
        when(collectionRepository.findById(collectionId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> deckService.createDeck(request));
        verify(deckRepository, never()).save(any(Deck.class));
    }

    @Test
    void getDecksByCollection_ShouldReturnList() {
        // Arrange
        when(deckRepository.findByCollectionId(collectionId)).thenReturn(List.of(sampleDeck));

        // Act
        List<DeckResponse> response = deckService.getDecksByCollection(collectionId);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals(sampleDeck.getName(), response.get(0).deckName());
        verify(deckRepository, times(1)).findByCollectionId(collectionId);
    }

    @Test
    void getDeck_WhenExists_ShouldReturnDeck() {
        // Arrange
        when(deckRepository.findById(deckId)).thenReturn(Optional.of(sampleDeck));

        // Act
        Deck result = deckService.getDeck(deckId);

        // Assert
        assertNotNull(result);
        assertEquals(deckId, result.getId());
        verify(deckRepository, times(1)).findById(deckId);
    }

    @Test
    void getDeck_WhenNotExists_ShouldThrowException() {
        // Arrange
        when(deckRepository.findById(deckId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> deckService.getDeck(deckId));
    }

    @Test
    void updateDeck_WhenExists_ShouldReturnUpdatedResponse() {
        // Arrange
        String newName = "Updated Deck Name";
        when(deckRepository.findById(deckId)).thenReturn(Optional.of(sampleDeck));

        // Act
        DeckResponse response = deckService.updateDeck(deckId, newName);

        // Assert
        assertEquals(newName, response.deckName());
        assertEquals(deckId, response.deckId());
        verify(deckRepository, times(1)).findById(deckId);
    }

    @Test
    void deleteDeck_ShouldCallRepository() {
        // Act
        deckService.deleteDeck(deckId);

        // Assert
        verify(deckRepository, times(1)).deleteById(deckId);
    }
}
