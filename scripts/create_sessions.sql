CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    token TEXT,
    created_at timestamp
)
