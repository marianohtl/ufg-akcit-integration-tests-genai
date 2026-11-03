# Flashcard Service Specification

## 1. Overview

The **Flashcard Service** is responsible for managing collections, decks, and cards within the study platform.

This service operates within a microservices architecture and is consumed by multiple BFFs (Deck and Review) via HTTP/JSON. It persists data in a relational database and follows a hierarchical domain model:

**Collection → Deck → Card**

This repository focuses exclusively on this service.

---

## 2. Responsibilities

* Create, update, delete, and retrieve:

  * Collections
  * Decks
  * Cards
* Provide structured data for frontend consumption via BFFs
* Maintain relational integrity between entities
* Persist and retrieve data from the database

---

## 3. Non-Responsibilities

* Authentication and authorization (Auth Service)
* User profile management (User Service)
* Frontend orchestration (BFF layer)
* Review logic (handled by Review MFE/BFF)
* Notifications or analytics

---

## 4. Architecture Context

The Flashcard Service is consumed by:

* Deck BFF (management flows)
* Review BFF (study flows)

Communication is synchronous via HTTP/JSON.

```
[MFE Deck / Review]
        |
        v
      [BFF]
        |
        v
[Flashcard Service] ---> [Relational Database]
```

---

## 5. API Design

### Base URL

```
/api
```

---

### 5.1 Create Collection

**POST** `/collection`

#### Request

```json
{
  "collectionName": "string"
}
```

#### Response

```json
{
  "collectionId": "uuid",
  "collectionName": "string"
}
```

---

### 5.2 Create Deck

**POST** `/deck`

#### Request

```json
{
  "collectionId": "uuid",
  "deckName": "string"
}
```

#### Response

```json
{
  "deckId": "uuid",
  "collectionId": "uuid",
  "deckName": "string"
}
```

---

### 5.3 Create Card

**POST** `/card`

#### Request

```json
{
  "deckId": "uuid",
  "cardFront": "string",
  "cardBack": "string"
}
```

#### Response

```json
{
  "cardId": "uuid",
  "deckId": "uuid"
}
```

---

### 5.4 List all by collection id

**GET** `/collections/{id}`

#### Response

```json
{
  "id": "uuid",
  "name": "string",
  "userId": "uuid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "decks": [
    {
      "deckId": "uuid",
      "collectionId": "uuid",
      "deckName": "string",
      "cards": [
        {
          "cardId": "uuid",
          "deckId": "uuid",
          "front": "string",
          "back": "string"
        }
      ]
    }
  ]
}
```

---

## 6. Data Model

### 6.1 Domain Structure

* A **Collection** contains multiple **Decks**
* A **Deck** contains multiple **Cards**

---

### 6.2 Relational Tables

#### collections

| Field      | Type      | Description           |
| ---------- | --------- | --------------------- |
| id         | UUID      | Primary key           |
| name       | STRING    | Collection name       |
| user_id    | UUID      | Owner reference       |
| created_at | TIMESTAMP | Creation timestamp    |
| updated_at | TIMESTAMP | Last update timestamp |

---

#### decks

| Field         | Type      | Description           |
| ------------- | --------- | --------------------- |
| id            | UUID      | Primary key           |
| name          | STRING    | Deck name             |
| collection_id | UUID      | FK → collections.id   |
| created_at    | TIMESTAMP | Creation timestamp    |
| updated_at    | TIMESTAMP | Last update timestamp |

---

#### cards

| Field      | Type      | Description           |
| ---------- | --------- | --------------------- |
| id         | UUID      | Primary key           |
| front      | TEXT      | Card front content    |
| back       | TEXT      | Card back content     |
| deck_id    | UUID      | FK → decks.id         |
| created_at | TIMESTAMP | Creation timestamp    |
| updated_at | TIMESTAMP | Last update timestamp |

---

### 6.3 Relationships

* `decks.collection_id` → `collections.id`
* `cards.deck_id` → `decks.id`

---

### 6.4 JSON Representation (Aggregated View)

```json
{
  "collectionId": "uuid",
  "collectionName": "string",
  "decks": [
    {
      "deckId": "uuid",
      "deckName": "string",
      "cards": [
        {
          "cardId": "uuid",
          "cardFront": "string",
          "cardBack": "string"
        }
      ]
    }
  ]
}
```

---

## 7. Data Integrity Rules

* A deck must always belong to a collection
* A card must always belong to a deck
* Deleting a collection should cascade delete decks and cards
* Deleting a deck should cascade delete cards

---

## 8. Error Handling

Standard format:

```json
{
  "code": "FLASHCARD_001",
  "message": "Resource not found"
}
```

### Common Errors

| Code          | Description                  |
| ------------- | ---------------------------- |
| FLASHCARD_001 | Resource not found           |
| FLASHCARD_002 | Invalid request data         |
| FLASHCARD_003 | Relationship constraint fail |

---

## 9. Observability

* Logs: Structured JSON

---

## 10. Tech Stack

* Java 21
* Spring Boot 3.4.0
* Maven
* Relational Database (H2 Database will be used for local development and demonstrations)

---

## 11. Package Structure

Base package:

```
com.mindlessducks.coreflashcard
```

Suggested modules:

* controllers
* services
* repositories
* entities
* dto
* config

---

## 12. Versioning

* Versioned endpoints recommended (`/v1`)
* Backward compatibility required for public APIs
