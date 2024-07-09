import { Router } from "express";
import pool from "../db.mjs";

const router = Router();

// get bookmarked books
router.get("/api/bookmarks", async (request, response) => {
    const { user_id } = request.query;
    const client = await pool.connect();
    try {
        const res = await client.query(`select * from get_bookmarks($1);`, [user_id]);
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error.message });
    } finally {
        client.release();
    }
})

//check bookmark
router.get("/api/check-bookmark", async (request, response) => {
    const { book_id } = request.query;
    const { user_id } = request.query;

    const client = await pool.connect();
    try {
        const res = await client.query(`select * from bookmarks 
            where user_id=$1 and book_id=$2;`, [user_id, book_id]);
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error.message });
    } finally {
        client.release();
    }
})

// add bookmark
router.post("/api/add-bookmark", async (request, response) => {
    const { user_id } = request.body;
    const { book_id } = request.body;
    const client = await pool.connect();
    try {
        const res = await client.query(
            `insert into bookmarks
            (user_id,book_id)
            values
            ($1,$2);`,
            [user_id, book_id]);
        return response.status(200).send({ message: 'Bookmark added successfully' });
    } catch (error) {
        console.log({ error: error.message });
        return response.status(500).send({ error: 'Error adding bookmark' });
    } finally {
        client.release();
    }
})

// remove bookmark
router.post("/api/remove-bookmark", async (request, response) => {
    const { user_id } = request.body;
    const { book_id } = request.body;
    const client = await pool.connect();
    try {
        const res = await client.query(`select remove_bookmark($1, $2);`, [user_id, book_id]);
        return response.status(200).send({ message: 'Bookmark removed successfully' });
    } catch (error) {
        console.log({ error: error.message });
        return response.status(500).send({ error: 'Error removing bookmark' });
    } finally {
        client.release();
    }
})

export default router;