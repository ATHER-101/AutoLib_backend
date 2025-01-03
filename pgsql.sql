CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users
create table users(
	id varchar(50) PRIMARY KEY,
	name varchar(50),
	email varchar(50),
	recent_genres varchar(25)[5] DEFAULT '{}'
);

drop table users;

select * from users;

-- books
create table books(
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
title varchar(50),
description varchar(500),
cover_img varchar(50),
genre varchar(25),
quantity smallint,
remaining smallint,
added DATE DEFAULT CURRENT_DATE
);


insert into books
(title,description,cover_img,genre,quantity,remaining)
values
('Physics with Atharva','Short description!','http://localhost:5173/student','physics',10,10);

select * from books;


-- issues
create table issues(
id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
user_id varchar(50) NOT NULL,
book_id UUID NOT NULL,
issue_date DATE DEFAULT CURRENT_DATE,
FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);

select * from issues;

drop table issues;

-- current issues function
CREATE FUNCTION get_current_issues(_user_id varchar(50))
RETURNS TABLE (
    id UUID,
    title VARCHAR(50),
    cover_img VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        books.id AS id,
        books.title AS title,
        books.cover_img AS cover_img
    FROM issues
    JOIN users ON issues.user_id = users.id
    JOIN books ON issues.book_id = books.id
    WHERE users.id = _user_id;
END;
$$ LANGUAGE plpgsql;

drop function get_current_issues;

SELECT * FROM get_current_issues('ebf6cc5a-077a-4401-9858-4cb9e4d34173');

-- recently added view
CREATE VIEW recently_added AS
SELECT id, title, cover_img, added
FROM books
WHERE added >= CURRENT_DATE - INTERVAL '1 month';

drop view recently_added;

SELECT id, title, cover_img
FROM recently_added
ORDER BY added DESC;

-- issue book function
CREATE FUNCTION issue_book(user_id varchar(50), book_id UUID)
RETURNS VOID AS $$
DECLARE
    issued_genre VARCHAR(25);
BEGIN
    -- Insert into issues table
    INSERT INTO issues (user_id, book_id)
    VALUES (user_id, book_id);

    -- Get the genre of the issued book
    SELECT genre INTO issued_genre
    FROM books
    WHERE id = book_id;

    -- Update recent_genres array in users table if genre doesn't already exist
    UPDATE users
    SET recent_genres = (
        SELECT CASE
                   WHEN array_length(recent_genres, 1) < 5 AND NOT issued_genre = ANY(recent_genres)
                   THEN array_append(recent_genres, issued_genre)
                   WHEN NOT issued_genre = ANY(recent_genres)
                   THEN array_append(array_remove(recent_genres, recent_genres[1]), issued_genre)
                   ELSE recent_genres
               END
        FROM users
        WHERE id = user_id
    )
    WHERE id = user_id;

    -- Decrement the remaining count of the book
    UPDATE books
    SET remaining = remaining - 1
    WHERE id = book_id;

END;
$$ LANGUAGE plpgsql;


SELECT issue_book('2054c0c5-1ec4-4dc7-b8bf-6ecebdd643b5', '535ba7b5-4a27-4a02-a578-8ef34710eb1e');

drop function issue_book;

-- return book function
CREATE FUNCTION return_book(_user_id varchar(50), _book_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete from issues table
	DELETE FROM issues
	WHERE user_id = _user_id AND book_id= _book_id;

    -- Increment the remaining count of the book
    UPDATE books
    SET remaining = remaining + 1
    WHERE id = _book_id;

END;
$$ LANGUAGE plpgsql;

SELECT return_book('2054c0c5-1ec4-4dc7-b8bf-6ecebdd643b5', '535ba7b5-4a27-4a02-a578-8ef34710eb1e');

drop function return_book;

delete from books
where genre != 'physics';

-- bookmarks
create table bookmarks(
	user_id varchar(50),
	book_id UUID,
FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);

select * from bookmarks;

drop table bookmarks;

insert into bookmarks
(user_id,book_id)
values
('2054c0c5-1ec4-4dc7-b8bf-6ecebdd643b5', '535ba7b5-4a27-4a02-a578-8ef34710eb1e');

-- get bookmarks function
CREATE FUNCTION get_bookmarks(_user_id varchar(50))
RETURNS TABLE (
	id UUID,
	title varchar(50),
	cover_img varchar(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        books.id as id,
		books.title as title,
		books.cover_img as cover_img	
    FROM bookmarks
    JOIN books ON bookmarks.book_id = books.id
    WHERE bookmarks.user_id = _user_id;
END;
$$ LANGUAGE plpgsql;

drop function get_bookmarks;

select * from get_bookmarks('ebf6cc5a-077a-4401-9858-4cb9e4d34173');

-- remove bookmark function
CREATE FUNCTION remove_bookmark(_user_id varchar(50), _book_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Delete from bookmarks table
	DELETE FROM bookmarks
	WHERE user_id = _user_id AND book_id= _book_id;
END;
$$ LANGUAGE plpgsql;

drop function remove_bookmark;

select remove_bookmark('2054c0c5-1ec4-4dc7-b8bf-6ecebdd643b5', '535ba7b5-4a27-4a02-a578-8ef34710eb1e');


-- Function to get books matching user's recent genres
CREATE FUNCTION get_books_by_recent_genres(user_id varchar(50))
RETURNS TABLE (
    genre varchar(25),
    id UUID,
    title VARCHAR(50),
    cover_img VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_books AS (
        SELECT 
            b.genre AS genre,
            b.id AS id,
            b.title AS title,
            b.cover_img AS cover_img,
            ROW_NUMBER() OVER (PARTITION BY b.genre ORDER BY b.added DESC) as rn
        FROM 
            books b
        JOIN 
            users u ON b.genre = ANY(u.recent_genres)
        WHERE 
            u.id = user_id
    )
    SELECT 
        ranked_books.genre,
        ranked_books.id,
        ranked_books.title,
        ranked_books.cover_img
    FROM 
        ranked_books
    WHERE 
        ranked_books.rn <= 12;
END;
$$ LANGUAGE plpgsql;



drop function get_books_by_recent_genres;

-- Call the function
SELECT * FROM get_books_by_recent_genres('ebf6cc5a-077a-4401-9858-4cb9e4d34173');

-- Ensure the pg_trgm extension is enabled for more advanced string similarity matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Query to find 7 books that closely match a given string in the title
CREATE OR REPLACE FUNCTION search_books(search_string VARCHAR)
RETURNS TABLE (
    id UUID,
    title VARCHAR(50),
    cover_img VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT b.id, b.title, b.cover_img
    FROM books b
    WHERE b.title ILIKE '%' || search_string || '%'
       OR b.description ILIKE '%' || search_string || '%'
       OR b.genre ILIKE '%' || search_string || '%'
    ORDER BY 
        (CASE 
            WHEN b.title ILIKE '%' || search_string || '%' THEN 1
            WHEN b.description ILIKE '%' || search_string || '%' THEN 2
            ELSE 3
        END),
        similarity(b.title, search_string) DESC,
        similarity(b.description, search_string) DESC,
        similarity(b.genre, search_string) DESC;
END;
$$ LANGUAGE plpgsql;

drop function search_books;

SELECT * FROM search_books('n');


-- session store
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

select * from session;

delete from session;
