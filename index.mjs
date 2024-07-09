import express from "express";
import cors from "cors";

import passport from "passport";
import session from "express-session";
import pool from "./db.mjs";

import connectPgSimple from 'connect-pg-simple';
const PgSession = connectPgSimple(session);


import dotenv from 'dotenv';
dotenv.config();

import './google-strategy.mjs';

import books from './routes/books.mjs';
import issues from './routes/issues.mjs';
import bookmarks from './routes/bookmarks.mjs';
import users from './routes/users.mjs';
import authentication from './routes/authentication.mjs'

const port = process.env.PORT || 3000;

const app = express();

app.use(session({
    store: new PgSession({
        pool: pool,
        tableName: 'session',
      }),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
  }))

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
    origin: process.env.FRONTEND,
    credentials:true
}));
app.use(express.json());

app.use(books);
app.use(users);
app.use(issues);
app.use(bookmarks);

app.use(authentication);

app.listen(port, () => console.log(`Listening on http://localhost:${port} !`))