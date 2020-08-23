DROP TABLE IF EXISTS books ;
CREATE TABLE books(
    id SERIAL PRIMARY KEY,
    author VARCHAR(255),
    title VARCHAR(255),
    isbn VARCHAR(255),
    img VARCHAR(3000),
    description VARCHAR(3000),
    bookshelf VARCHAR(255)
);