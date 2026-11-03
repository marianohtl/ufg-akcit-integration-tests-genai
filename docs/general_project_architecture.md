# General Project Architecture

**DISCLAIMER: This repository focuses EXCLUSIVELY on the 'Flashcard Service' (highlighted in yellow in the diagram below). The other components are part of the broader system context but are not within the scope of this specific project.**

This document describes the high-level architecture of the study platform, which utilizes a Microfrontend (MFE) architecture on the frontend and a Microservices architecture on the backend, coordinated through a Backend for Frontend (BFF) pattern within each MFE.

```mermaid

flowchart LR
    %% Frontend Layer
    subgraph Frontend["Frontend (Microfrontends Architecture)"]
        Shell["Platform Shell (Core)"]

        subgraph MFE_Deck["MFE - Deck & Flashcard Management"]
            DeckUI["UI"]
            DeckBFF["BFF - Deck"]
        end

        subgraph MFE_User["MFE - User & Profile Management"]
            UserUI["UI"]
            UserBFF["BFF - User"]
        end

        subgraph MFE_Review["MFE - Flashcard Review"]
            ReviewUI["UI"]
            ReviewBFF["BFF - Review"]
        end

        Shell --> DeckUI
        Shell --> UserUI
        Shell --> ReviewUI

        DeckUI -- HTTP/JSON --> DeckBFF
        UserUI -- HTTP/JSON --> UserBFF
        ReviewUI -- HTTP/JSON --> ReviewBFF
    end

    %% Backend Layer
    subgraph Backend["Backend Microservices"]
        AuthService["Auth Service"]
        UserService["User Service"]
        FlashcardService["Flashcard Service"]
    end

    %% Database Layer
    subgraph Database["Database"]
        DB[(Relational Database)]
    end

    %% BFFs -> Backend
    DeckBFF -- HTTP/JSON --> FlashcardService
    DeckBFF -- HTTP/JSON --> AuthService

    UserBFF -- HTTP/JSON --> UserService
    UserBFF -- HTTP/JSON --> AuthService

    ReviewBFF -- HTTP/JSON --> FlashcardService
    ReviewBFF -- HTTP/JSON --> AuthService

    %% Backend -> Database
    AuthService -- SQL --> DB
    UserService -- SQL --> DB
    FlashcardService -- SQL --> DB

    %% Highlight Flashcard Service
    style FlashcardService fill:#ffd700,stroke:#000,stroke-width:2px,color:#000
```
