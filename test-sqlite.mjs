import { ensureDb, query } from './src/lib/db.js';

(async () => {
  try {
    await ensureDb();
    const res = await query('SELECT COUNT(*) as c FROM products');
    console.log('Products count:', res.rows[0]?.c ?? res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('DB test error:', err);
    process.exit(1);
  }
})();