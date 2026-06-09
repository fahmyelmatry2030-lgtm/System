import { query, ensureDb } from './src/lib/db.js';

(async () => {
  try {
    await ensureDb();
    const result = await query('SELECT id, username, fullname, role, active FROM users');
    console.log('جميع المستخدمين:');
    result.rows.forEach(u => {
      console.log(`  - ${u.username} (${u.fullname || 'N/A'}) - Role: ${u.role}`);
    });
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
