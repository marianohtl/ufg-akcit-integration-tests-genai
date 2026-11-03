-- DECK
CREATE TABLE deck (
    id VARCHAR(50) PRIMARY KEY,
    collection_id VARCHAR(50),
    name VARCHAR(255),
    metadata JSONB
);

-- CARD (base)
CREATE TABLE card (
    id VARCHAR(50) PRIMARY KEY,
    deck_id VARCHAR(50),
    type VARCHAR(50), -- 'flashcard' | 'multiple_choice'
    metadata JSONB,
    FOREIGN KEY (deck_id) REFERENCES deck(id)
);

-- FLASHCARD TYPE
CREATE TABLE card_flashcard (
    card_id VARCHAR(50) PRIMARY KEY,
    front TEXT,
    back TEXT,
    FOREIGN KEY (card_id) REFERENCES card(id)
);

-- MULTIPLE CHOICE TYPE
CREATE TABLE card_multiple_choice (
    card_id VARCHAR(50) PRIMARY KEY,
    FOREIGN KEY (card_id) REFERENCES card(id)
);

CREATE TABLE card_option (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(50),
    option_text TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (card_id) REFERENCES card(id)
);
