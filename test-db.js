const fs = require('fs');
const { Pool } = require('pg');

const envLocal = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envLocal.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].replace(/^"|"$/g, '');
  }
}

console.log('Connecting to:', dbUrl.split('@')[1] || dbUrl);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()').then(res => {
  console.log('DB Time:', res.rows[0]);
  return pool.query('SELECT COUNT(*) FROM products');
}).then(res => {
  console.log('Products count:', res.rows[0]);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
