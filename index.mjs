import express from "express";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import pool from "./db.mjs";
import connectPgSimple from 'connect-pg-simple';
import dotenv from 'dotenv';
import './google-strategy.mjs';
import books from './routes/books.mjs';
import issues from './routes/issues.mjs';
import bookmarks from './routes/bookmarks.mjs';
import users from './routes/users.mjs';
import authentication from './routes/authentication.mjs';

dotenv.config();

const PgSession = connectPgSimple(session);
const port = process.env.PORT || 3000;

const app = express();

app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
  }),
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === 'production', // Ensure this is true in production
    httpOnly: true,
    sameSite: 'none'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
  origin: process.env.FRONTEND,
  credentials: true
}));

app.set('trust proxy', 1); // Enable trust proxy for secure cookies behind proxies
app.use(express.json());

app.use(books);
app.use(users);
app.use(issues);
app.use(bookmarks);
app.use(authentication);

app.get("/api/auth/status", (request, response) => {
  console.log("Session cookie:", request.headers.cookie); // Log cookie headers
  if (request.user) {
    console.log("User authenticated:", request.user);
    response.send({ status: "authorised", user: request.user });
  } else {
    console.log("User not authenticated");
    response.status(401).send({ status: "unauthorised" });
  }
});

app.listen(port, () => console.log(`Listening on http://localhost:${port} !`));
