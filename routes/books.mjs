import { Router } from "express";
import pool from "../db.mjs";

const router = Router();

router.get("/api/books", async (request, response) => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM books');
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error });
    } finally {
        client.release();
    }
})


// get recently added books
router.get("/api/books/recently-added", async (request, response) => {
    const { limit } = request.query;
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT id, title, cover_img
            FROM recently_added
            ORDER BY added DESC
            ${limit ? `LIMIT ${limit}` : ``};`);
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error });
    } finally {
        client.release();
    }
})


// books by genre
router.get("/api/books/genre", async (request, response) => {
    const { genre } = request.query;
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT id, title, cover_img FROM books
            WHERE genre=$1`
            , [genre]);
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error.message });
    } finally {
        client.release();
    }
})


router.get("/api/books/:id", async (request, response) => {
    const id = request.params.id;
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM books WHERE id=$1', [id]);
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error.message });
    } finally {
        client.release();
    }
})

router.get('/api/genre', async (request, response) => {
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT DISTINCT genre AS name FROM books ORDER BY genre;`);
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error.message });
    } finally {
        client.release();
    }
});

// filter-books
router.get('/api/filter-books', async (request, response) => {
    const { available, genre } = request.query;

    const client = await pool.connect();

    let query = `SELECT * FROM books WHERE `;
    let conditions = [];

    if (available === 'true') {
        conditions.push(`remaining > 0`);
    }

    let selectedGenres;
    if (genre && Array.isArray(genre)) {
        selectedGenres = genre.filter(g => g.selected === 'true').map(g => g.name);
        if (selectedGenres.length > 0) {
            conditions.push(`genre = ANY($1)`);
        }
    }

    if (conditions.length === 0) {
        try {
            const res = await client.query(
                `SELECT id, title, cover_img
            FROM recently_added
            ORDER BY added DESC
            LIMIT 20;`);
            return response.status(200).send(res.rows);
        } catch (error) {
            return response.status(500).send({ error: error });
        } finally {
            client.release();
        }
    }

    query += conditions.join(' AND ');

    try {
        const res = selectedGenres.length > 0
            ? await client.query(query, [selectedGenres])
            : await client.query(query);
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error.message });
    } finally {
        client.release();
    }
});

// search books
router.get('/api/search-books', async (request, response) => {
    const { search } = request.query;
    const { limit } = request.query;
    const { title } = request.query;
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT ${title ? `title` : `*`}
            FROM search_books($1)
            ${limit ? `LIMIT ${limit}` : ``};`,
            [search]);
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error.message });
    } finally {
        client.release();
    }
});


router.post('/api/books', async (request, response) => {
    const { books } = request.body;
    const client = await pool.connect();
    try {
        const values = books.map(book => [
            book.title,
            book.description,
            book.cover_img,
            book.genre,
            book.quantity,
            book.quantity
        ]);

        const queryText = `
            INSERT INTO books (title, description, cover_img, genre, quantity, remaining)
            VALUES ${values.map((_, index) => `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`).join(',')}
        `;

        const flattenedValues = values.flat();

        await client.query(queryText, flattenedValues);

        response.status(201).send({ message: 'Books inserted successfully' });
    } catch (error) {
        console.error('Error inserting books:', error.message);
        response.status(500).send({ error: 'Error inserting books' });
    } finally {
        client.release();
    }
});


export default router;