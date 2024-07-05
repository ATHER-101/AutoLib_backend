import { Router } from "express";
import pool from "../db.mjs";

const router = Router();

// get currently issued books
router.get("/api/issues/current-issues", async (request, response) => {
    const {limit} = request.query;
    const {user_id} =  request.query;
    const client = await pool.connect();
    try {
        const res = await client.query(
            `SELECT * FROM get_current_issues($1)
            ${limit?`LIMIT ${limit}`:``};`,
            [user_id]);
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error.message });
    } finally {
        client.release();
    }
})

//check issue
router.get("/api/issues/check-issue", async (request, response) => {
    const { book_id } = request.query;
    const {user_id} = request.query;

    const client = await pool.connect();
    try {
        const res = await client.query(`select * from issues 
            where user_id=$1 and book_id=$2;`, [user_id,book_id]);
        return response.status(200).send(res.rows);
    } catch (error) {
        return response.status(500).send({ error: error.message });
    } finally {
        client.release();
    }
})

// issue book
router.post("/api/issues/issue-book", async (request, response) => {
    const {user_id} =  request.body;
    const {book_id} = request.body;
    console.log(user_id,book_id)
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT issue_book($1,$2);`,[user_id,book_id]);
        return response.status(200).send({ message: 'Book issued successfully' });
    } catch (error) {
        console.log({ error: error.message });
        return response.status(500).send({ error: 'Error issueing books' });
    } finally {
        client.release();
    }
})

// return book
router.post("/api/issues/return-book", async (request, response) => {
    const {user_id} =  request.body;
    const {book_id} = request.body;
    console.log(user_id,book_id)
    const client = await pool.connect();
    try {
        const res = await client.query(`SELECT return_book($1,$2);`,[user_id,book_id]);
        return response.status(200).send({ message: 'Book returned successfully' });
    } catch (error) {
        console.log({ error: error.message });
        return response.status(500).send({ error: 'Error returning books' });
    } finally {
        client.release();
    }
})

export default router;