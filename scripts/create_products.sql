CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    title TEXT,
    price DOUBLE PRECISION,
    description TEXT,
    sizes TEXT[],
    main_image TEXT,
    images TEXT[],
    CONSTRAINT price_unique UNIQUE (title)
)
