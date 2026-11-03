package com.mindlessducks.coreflashcard.controllers;

import com.mindlessducks.coreflashcard.dto.CreateCardRequest;
import com.mindlessducks.coreflashcard.dto.CardResponse;
import com.mindlessducks.coreflashcard.services.CardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;

    @PostMapping("/card")
    public ResponseEntity<CardResponse> createCard(@RequestBody CreateCardRequest request) {
        return ResponseEntity.ok(cardService.createCard(request));
    }
}
