
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function migrate() {
  try {
    const sqlPath = path.join(__dirname, 'brainbuddy.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);

    console.log('BrainBuddy database tables created successfully.');
  } catch (error) {
    console.error('BrainBuddy migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
