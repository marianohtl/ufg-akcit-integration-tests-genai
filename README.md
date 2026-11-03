# ms-api-core-cards

Microservice core to flashcards.

> **Note:** This repository focuses exclusively on the **Flashcard Service** component of the broader study platform.
> **Database:** **H2 Database** will be used for local development and demonstrations.

## Project Overview

Build a platform that helps users study by allowing them to create and review personalized flashcards.

<img width="1617" height="977" alt="image" src="https://github.com/user-attachments/assets/4ea447ad-6a80-4e19-9c75-173bf942a2d6" />
<img width="1588" height="974" alt="image" src="https://github.com/user-attachments/assets/0e69d07b-4a8d-4114-a518-fcde8f6f80ec" />


## Features

### Hierarchical Flashcard Management
The service provides a hierarchical data model: **Collection → Deck → Card**.
- **Collections**: Grouping mechanism for multiple decks.
- **Decks**: Containers for specific study topics.
- **Cards**: The individual flashcards containing a front (question) and back (answer).

### API Documentation (Swagger/OpenAPI)
Interactive API documentation is provided via Swagger, allowing you to explore and test endpoints directly in your browser.

## Getting Started

### Prerequisites

To build and run this project, you need the following installed on your system:

- **Java 21** (JDK)
- **Maven** (for dependency management and building)

### Local Setup and Running

Follow these steps to get the project up and running locally:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ms-api-core-cards
    ```

2.  **Build the project:**
    Use the Maven wrapper to compile the application and download dependencies.
    ```bash
    ./mvnw clean compile
    ```

3.  **Run the application:**
    Start the Spring Boot application.
    ```bash
    ./mvnw spring-boot:run
    ```

### Testing the API

Once the application is running (default port is `8080`), you can interact with the service using the following tools:

#### 1. Swagger UI (Recommended)
The easiest way to test the endpoints is through the Swagger interface:
- **URL:** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)

From Swagger, you can:
- View all available endpoints (Create Collection, Create Deck, Create Card, and List Collection Details).
- Execute `POST` requests to populate the database.
- Execute `GET` requests to verify the hierarchical structure.

### Frontend (Collection Listing)

The static front-end lives in [`frontend/`](frontend/) and consumes `GET /api/collections/{id}` using only HTML, CSS, and JavaScript.

1. Start the API with `./mvnw spring-boot:run`.
2. Open [http://localhost:8080/](http://localhost:8080/) — the `frontend/` folder is served as static content.
3. Paste a `collectionId` (returned by `POST /api/collection`) into the page.

The front-end can also be served separately (for example with `python -m http.server 5500 --directory frontend`) or opened directly from the file system. See [frontend/README.md](frontend/README.md) for details.

### Integration Tests

This repository includes two complementary integration test suites generated from the prompts in
[`prompts/`](prompts/):

- **Server-side:** Spring Boot + MockMvc + H2 — `./mvnw test -Dtest=CollectionApiIntegrationTest`.
- **End-to-end:** Playwright — see [`tests/e2e/README.md`](tests/e2e/README.md).

The experiment report, test-case catalog, prompt analysis and execution evidence are in
[`docs/testes-integracao/`](docs/testes-integracao/README.md), also published at
[marianohtl/ufg-akcit-integration-tests-genai](https://github.com/marianohtl/ufg-akcit-integration-tests-genai).

---

## IDE Setup & Running

If you prefer using an Integrated Development Environment (IDE), follow these instructions:

### IntelliJ IDEA (Recommended)
1.  **Open Project:** Select the `ms-api-core-cards` folder.
2.  **Wait for Sync:** Allow IntelliJ to import the Maven project and download dependencies.
3.  **Run Application:** 
    - Navigate to `src/main/java/com/mindlessducks/coreflashcard/CoreFlashcardApplication.java`.
    - Right-click the file and select **Run 'CoreFlashcardApplication'**.
    - Alternatively, use the **Maven tool window** $\rightarrow$ `Plugins` $\rightarrow$ `spring-boot` $\rightarrow$ `spring-boot:run`.

### VS Code
1.  **Install Extensions:** Ensure the "Extension Pack for Java" and "Spring Boot Extension Pack" are installed.
2.  **Open Project:** Open the `ms-api-core-cards` folder.
3.  **Run Application:**
    - Open the `CoreFlashcardApplication.java` file.
    - Click the **Run** button appearing above the `main` method.
    - Or, use the **Spring Boot Dashboard** in the side bar.

### Eclipse
1.  **Import Project:** `File` $\rightarrow$ `Import...` $\rightarrow$ `Maven` $\rightarrow$ `Existing Maven Projects`.
2.  **Run Application:**
    - Right-click on the project $\rightarrow$ `Run As` $\rightarrow$ `Spring Boot App`.
    - Or, `Run As` $\rightarrow$ `Maven build...` $\rightarrow$ Goals: `spring-boot:run`.

---

## Architecture

See [General Project Architecture](docs/general_project_architecture.md) for the system overview.

## MVP Requirements

### System Description
The system consists of a general platform with a main dashboard and user management features, including user profiles. It also provides a deck management section, where users can create and manage flashcards, and a review section dedicated to studying those flashcards.

### Functional Requirements

#### User Management
- Users must be able to sign up, log in, and securely access their own data.

#### Deck Management
- Users must be able to create, edit, and delete decks.
- Each user must have a main page displaying their own decks.

#### Flashcard Management
- Users must be able to create, edit, and delete flashcards within a deck.
- Each flashcard must include:
  - A front side (concept or question)
  - A back side (answer)

#### Review System
- Users must be able to start a review session for a selected deck.
- During the session:
  - A flashcard is displayed with the front side first.
  - The user can flip the card to view the answer.
- *Note: The platform should support additional review methods in the future, but only a basic review flow is required for the MVP.*
