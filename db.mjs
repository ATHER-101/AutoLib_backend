import pkg from 'pg';
const { Pool } = pkg;

import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    port: 5432,
    database: process.env.PG_DATABASE,
    ssl: {
        rejectUnauthorized: false
    },
    log: (msg) => console.log(msg)
})

pool.on('connect', client => {
    console.log('Database connected');
});

pool.on('remove', client => {
    console.log('Database connection removed');
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;

// PGPASSWORD=GmQw95SH3S4SZ2eREJQ8waYIsMNSvbGP psql -h dpg-cq2hho56l47c73b5vjpg-a.singapore-postgres.render.com -U atharva_tijare autolib_db