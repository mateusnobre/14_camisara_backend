CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    "name" TEXT,
    email TEXT,
    "password" TEXT,
    created_at TIMESTAMP,
    CONSTRAINT email_unique UNIQUE (email)
)
