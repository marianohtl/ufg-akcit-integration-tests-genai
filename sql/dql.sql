SELECT 
    d.id AS deck_id,
    d.name,
    c.id AS card_id,
    c.type,
    cf.front,
    cf.back,
    o.option_text
FROM deck d
JOIN card c ON d.id = c.deck_id
LEFT JOIN card_flashcard cf ON c.id = cf.card_id
LEFT JOIN card_option o ON c.id = o.card_id
WHERE d.id = 'deck_1';
