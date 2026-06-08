const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
for (const line of envLocal.split('\n')) {
  if (line.includes('=')) {
    const [key, ...vals] = line.split('=');
    const val = vals.join('=').replace(/^"|"$/g, '');
    process.env[key] = val;
  }
}

// Ensure the db module uses the loaded environment
const db = require('./src/lib/db.js');

async function run() {
  console.log('Using Postgres:', db.isPostgres());
  try {
    console.log('Seeding DB...');
    await db.ensureDb();
    console.log('Done!');
    const count = await db.query('SELECT COUNT(*) as c FROM users');
    console.log('Users count:', count.rows[0].c);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

run();
