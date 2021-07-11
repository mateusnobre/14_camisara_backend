CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    "name" text,
    email text,
    "password" text,
    created_at timestamp,
    CONSTRAINT email_unique UNIQUE (email)
)
