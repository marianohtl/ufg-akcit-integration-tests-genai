-- deck
INSERT INTO deck (id, collection_id, name, metadata)
VALUES ('deck_1', 'f1', '10221', '{"count": 2}');

-- flashcard
INSERT INTO card (id, deck_id, type, metadata)
VALUES ('c1', 'deck_1', 'flashcard', '{"last_update":"onte"}');

INSERT INTO card_flashcard (card_id, front, back)
VALUES ('c1', '10221', '10221');

-- multiple choice
INSERT INTO card (id, deck_id, type, metadata)
VALUES ('c2', 'deck_1', 'multiple_choice', '{"last_update":"onte"}');

INSERT INTO card_multiple_choice (card_id)
VALUES ('c2');

INSERT INTO card_option (card_id, option_text)
VALUES 
('c2', '10221'),
('c2', '10221'),
('c2', '10221');
