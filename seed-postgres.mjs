import fs from 'fs';
import { ensureDb, query, isPostgres } from './src/lib/db.js';

const envLocal = fs.readFileSync('.env.local', 'utf8');
for (const line of envLocal.split('\n')) {
  if (line.includes('=')) {
    const [key, ...vals] = line.split('=');
    const val = vals.join('=').replace(/^"|"$/g, '');
    process.env[key] = val;
  }
}

async function run() {
  console.log('Using Postgres:', isPostgres());
  try {
    console.log('Seeding DB...');
    await ensureDb();
    console.log('Done!');
    const count = await query('SELECT COUNT(*) as c FROM users');
    console.log('Users count:', count.rows[0].c);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

run();
