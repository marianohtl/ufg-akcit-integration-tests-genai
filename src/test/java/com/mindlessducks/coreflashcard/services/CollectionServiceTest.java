package com.mindlessducks.coreflashcard.services;

import com.mindlessducks.coreflashcard.dto.CardResponse;
import com.mindlessducks.coreflashcard.dto.CollectionDetailResponse;
import com.mindlessducks.coreflashcard.dto.CollectionResponse;
import com.mindlessducks.coreflashcard.dto.CreateCollectionRequest;
import com.mindlessducks.coreflashcard.dto.DeckResponse;
import com.mindlessducks.coreflashcard.entities.Card;
import com.mindlessducks.coreflashcard.entities.Collection;
import com.mindlessducks.coreflashcard.entities.Deck;
import com.mindlessducks.coreflashcard.repositories.CollectionRepository;
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
class CollectionServiceTest {

    @Mock
    private CollectionRepository collectionRepository;

    @InjectMocks
    private CollectionService collectionService;

    private Collection sampleCollection;
    private UUID collectionId;

    @BeforeEach
    void setUp() {
        collectionId = UUID.randomUUID();
        sampleCollection = new Collection();
        sampleCollection.setId(collectionId);
        sampleCollection.setName("Test Collection");
        sampleCollection.setUserId(UUID.randomUUID());
        sampleCollection.setDecks(new ArrayList<>());
    }

    @Test
    void createCollection_ShouldReturnCollectionResponse() {
        // Arrange
        CreateCollectionRequest request = new CreateCollectionRequest("New Collection");
        
        Collection saved = new Collection();
        saved.setId(collectionId);
        saved.setName("New Collection");
        
        when(collectionRepository.save(any(Collection.class))).thenReturn(saved);

        // Act
        CollectionResponse response = collectionService.createCollection(request);

        // Assert
        assertNotNull(response);
        assertEquals("New Collection", response.collectionName());
        assertEquals(collectionId, response.collectionId());
        verify(collectionRepository, times(1)).save(any(Collection.class));
    }

    @Test
    void getCollection_WhenExists_ShouldReturnDetailResponse() {
        // Arrange
        UUID deckId = UUID.randomUUID();
        UUID cardId = UUID.randomUUID();

        Card card = new Card();
        card.setId(cardId);
        card.setFront("Front");
        card.setBack("Back");

        Deck deck = new Deck();
        deck.setId(deckId);
        deck.setName("Test Deck");
        deck.setCards(new ArrayList<>(List.of(card)));
        deck.setCollection(sampleCollection); 

        sampleCollection.getDecks().add(deck);

        when(collectionRepository.findById(collectionId)).thenReturn(Optional.of(sampleCollection));

        // Act
        CollectionDetailResponse response = collectionService.getCollection(collectionId);

        // Assert
        assertNotNull(response);
        assertEquals(sampleCollection.getId(), response.id());
        assertEquals(sampleCollection.getName(), response.name());
        assertEquals(1, response.decks().size());
        assertEquals("Test Deck", response.decks().get(0).deckName());
        assertEquals(1, response.decks().get(0).cards().size());
        assertEquals("Front", response.decks().get(0).cards().get(0).front());
        verify(collectionRepository, times(1)).findById(collectionId);
    }

    @Test
    void getCollection_WhenNotExists_ShouldThrowException() {
        // Arrange
        when(collectionRepository.findById(collectionId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> collectionService.getCollection(collectionId));
    }

    @Test
    void updateCollection_WhenExists_ShouldReturnUpdatedResponse() {
        // Arrange
        String newName = "Updated Name";
        sampleCollection.setName("Old Name");
        when(collectionRepository.findById(collectionId)).thenReturn(Optional.of(sampleCollection));

        // Act
        CollectionResponse response = collectionService.updateCollection(collectionId, newName);

        // Assert
        assertEquals(newName, response.collectionName());
        assertEquals(collectionId, response.collectionId());
        verify(collectionRepository, times(1)).findById(collectionId);
    }

    @Test
    void deleteCollection_ShouldCallRepository() {
        // Act
        collectionService.deleteCollection(collectionId);

        // Assert
        verify(collectionRepository, times(1)).deleteById(collectionId);
    }
}
