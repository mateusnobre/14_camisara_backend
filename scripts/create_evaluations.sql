CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    user_id INTEGER,
    evaluated_at TIMESTAMP,
    rating INTEGER,
    title TEXT,
    opinion TEXT
)