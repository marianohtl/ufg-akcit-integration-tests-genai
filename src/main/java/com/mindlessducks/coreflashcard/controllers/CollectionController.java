package com.mindlessducks.coreflashcard.controllers;

import com.mindlessducks.coreflashcard.dto.CollectionDetailResponse;
import com.mindlessducks.coreflashcard.dto.CollectionResponse;
import com.mindlessducks.coreflashcard.dto.CreateCollectionRequest;
import com.mindlessducks.coreflashcard.services.CollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @PostMapping("/collection")
    public ResponseEntity<CollectionResponse> createCollection(@RequestBody CreateCollectionRequest request) {
        return ResponseEntity.ok(collectionService.createCollection(request));
    }

    @GetMapping("/collections/{id}")
    public ResponseEntity<CollectionDetailResponse> getCollection(@PathVariable UUID id) {
        return ResponseEntity.ok(collectionService.getCollection(id));
    }
}
