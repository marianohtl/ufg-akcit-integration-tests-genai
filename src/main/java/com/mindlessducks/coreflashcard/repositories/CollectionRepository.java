package com.mindlessducks.coreflashcard.repositories;

import com.mindlessducks.coreflashcard.entities.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, UUID> {
    List<Collection> findByUserId(UUID userId);
}
