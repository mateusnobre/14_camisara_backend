CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    title TEXT,
    price DOUBLE PRECISION,
    description TEXT,
    rating DOUBLE PRECISION,
    sizes TEXT[],
    main_image TEXT,
    images TEXT[],
    CONSTRAINT price_unique UNIQUE (title)
)
