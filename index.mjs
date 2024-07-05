import express from "express";
import cors from "cors";

import dotenv from 'dotenv';
dotenv.config();

import books from './routes/books.mjs';
import issues from './routes/issues.mjs';
import bookmarks from './routes/bookmarks.mjs';
import users from './routes/users.mjs';

const port = process.env.PORT || 3000;

const app = express();

app.use(cors({
    origin: 'http://localhost:5173'
}));
app.use(express.json());

app.use(books);
app.use(users);
app.use(issues);
app.use(bookmarks);

app.listen(port, () => console.log(`Listening on http://localhost:${port} !`))