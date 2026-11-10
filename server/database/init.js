// Database initialization script.
//   npm run db:init          -> drops & recreates all tables (schema.sql) and loads seed.sql
//   npm run db:init -- --seed-only  -> reloads only seed content (keeps schema)
// seed.sql is split into chunks (marker "-- @@CHUNK") so big inserts work well over the network to Neon.
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const SCHEMA = path.join(__dirname, '..', '..', 'database', 'schema.sql');
const SEED = path.join(__dirname, '..', '..', 'database', 'seed.sql');

async function run() {
  const seedOnly = process.argv.includes('--seed-only');
  const started = Date.now();
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT version()');
    console.log('Connected:', rows[0].version.split(',')[0]);

    if (!seedOnly) {
      console.log('Creating schema ...');
      await client.query(fs.readFileSync(SCHEMA, 'utf8'));
    }

    if (!fs.existsSync(SEED)) throw new Error('database/seed.sql not found. Run: npm run db:build-seed');
    const chunks = fs.readFileSync(SEED, 'utf8').split('-- @@CHUNK').map((c) => c.trim()).filter(Boolean);
    console.log(`Loading seed content (${chunks.length} chunks) ...`);
    await client.query('BEGIN');
    for (let i = 0; i < chunks.length; i++) {
      await client.query(chunks[i]);
      if ((i + 1) % 10 === 0 || i === chunks.length - 1) process.stdout.write(`  ${i + 1}/${chunks.length}\r`);
    }
    await client.query('COMMIT');

    const counts = await client.query(`SELECT
      (SELECT count(*) FROM aptitude_questions) apt, (SELECT count(*) FROM coding_problems) coding,
      (SELECT count(*) FROM lessons) lessons, (SELECT count(*) FROM project_ideas) projects,
      (SELECT count(*) FROM companies) companies, (SELECT count(*) FROM interview_questions) interview,
      (SELECT count(*) FROM assessment_questions) assess, (SELECT count(*) FROM video_resources) videos`);
    console.log('\nSeed complete:', counts.rows[0]);
    console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('\nDatabase initialization failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
