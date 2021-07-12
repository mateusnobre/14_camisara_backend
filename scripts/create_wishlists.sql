CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    product_id INTEGER,
    CONSTRAINT wishlist_unique UNIQUE(user_id, product_id)
)
