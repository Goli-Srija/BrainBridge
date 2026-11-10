// Database connection module.
// Uses a single pg connection pool shared by the whole backend.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { Pool, types } = require('pg');

// Return DATE columns as plain 'YYYY-MM-DD' strings. By default pg converts them to JS Dates at the
// server's local midnight, which shifts the day for students in time zones like IST (UTC+5:30).
types.setTypeParser(1082, (value) => value);

if (!process.env.DATABASE_URL) {
  console.error('\n[BrainBridge] DATABASE_URL is not set.');
  console.error('Copy .env.example to .env and paste your Neon connection string.\n');
}

// Neon (and most hosted Postgres) requires SSL. Local databases usually do not.
const url = process.env.DATABASE_URL || '';
const isLocal = /localhost|127\.0\.0\.1/.test(url);
const useSsl = process.env.DATABASE_SSL ? process.env.DATABASE_SSL === 'true' : !isLocal;

const pool = new Pool({
  connectionString: url,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on('error', (err) => console.error('[db] idle client error:', err.message));

// Small helpers so controllers read nicely.
const query = (text, params) => pool.query(text, params);
const one = async (text, params) => (await pool.query(text, params)).rows[0] || null;
const many = async (text, params) => (await pool.query(text, params)).rows;

// Run several statements in one transaction: await tx(async (client) => {...})
async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, one, many, tx };
