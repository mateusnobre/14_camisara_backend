CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    created_ad TIMESTAMP,
    CONSTRAINT purchase_unique UNIQUE(user_id, product_id)
)
