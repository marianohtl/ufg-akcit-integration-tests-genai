# Data Model

## Relational Model

**Entities:**

- Collection (1) → (N) Deck
- Deck (1) → (N) Card

**Tables:**

- `collections`
- `decks`
- `cards`

**Relationships:**

- `decks.collection_id` → `collections.id`
- `cards.deck_id` → `decks.id`

```mermaid
erDiagram
    COLLECTIONS {
        string collection_id PK
        string collection_name
    }

    DECKS {
        string deck_id PK
        string deck_name
        string collection_id FK
    }

    CARDS {
        string card_id PK
        string card_front
        string card_back
        string deck_id FK
    }

    COLLECTIONS ||--o{ DECKS : has
    DECKS ||--o{ CARDS : contains
```
