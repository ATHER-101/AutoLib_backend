import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import pool from './db.mjs';

dotenv.config();

passport.use(
    new GoogleStrategy({
        clientID: process.env.OAUTH_CLIENT_ID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        callbackURL: process.env.OAUTH_REDIRECT_URL,
        proxy: true,
        scope: ['email', 'profile'],
    },
        async (accessToken, refreshToken, profile, done) => {

            // domain limiting
            // const email = profile.emails[0].value;
            // const domain = email.split('@')[1];

            // if (domain !== 'iitdh.ac.in') {
            //     return done(null, false);
            // }

            const client = await pool.connect();

            try {
                const findUser = await client.query(
                    `SELECT * FROM users WHERE id = $1;`,
                    [profile.id]
                );

                if (findUser.rows.length === 0) {
                    const newUser = await client.query(
                        `INSERT INTO users (id, name, email) VALUES ($1, $2, $3) RETURNING *;`,
                        [profile.id, profile.displayName, profile.emails[0].value]
                    );
                    client.release();
                    return done(null, newUser.rows[0]);
                } else {
                    client.release();
                    return done(null, findUser.rows[0]);
                }
            } catch (error) {
                client.release();
                console.log(error);
                return done(error, null);
            }
        })
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const client = await pool.connect();
    try {
        const findUser = await client.query(`SELECT * FROM users WHERE id = $1;`, [id]);
        client.release();

        let role;
        if (findUser.rows[0].email === 'atharvatijare04@gmail.com') {
            role = "admin";
        } else {
            role = "student";
        }

        const user = { ...findUser.rows[0], role }
        done(null, user);
    } catch (error) {
        client.release();
        done(error, null);
    }
});
