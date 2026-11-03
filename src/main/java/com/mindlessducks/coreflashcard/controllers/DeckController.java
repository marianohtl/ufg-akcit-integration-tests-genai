package com.mindlessducks.coreflashcard.controllers;

import com.mindlessducks.coreflashcard.dto.CreateDeckRequest;
import com.mindlessducks.coreflashcard.dto.DeckResponse;
import com.mindlessducks.coreflashcard.services.DeckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;

    @PostMapping("/deck")
    public ResponseEntity<DeckResponse> createDeck(@RequestBody CreateDeckRequest request) {
        return ResponseEntity.ok(deckService.createDeck(request));
    }
}
