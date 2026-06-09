import { query, ensureDb } from './src/lib/db.js';

(async () => {
  try {
    await ensureDb();
    
    console.log('➕ إضافة مستخدمين جدد...\n');
    
    // إضافة المحاسب
    try {
      await query(
        'INSERT INTO users (id, username, password, fullname, role, active) VALUES (?,?,?,?,?,?)',
        ['U002', 'accountant', 'accountant123', 'المحاسب', 'accountant', 1]
      );
      console.log('✅ تم إضافة المحاسب:');
      console.log('   Username: accountant');
      console.log('   Password: accountant123');
      console.log('   Role: محاسب\n');
    } catch (err) {
      if (err.message.includes('duplicate')) {
        console.log('⚠️  المحاسب موجود بالفعل\n');
      } else {
        throw err;
      }
    }
    
    // إضافة المندوب
    try {
      await query(
        'INSERT INTO users (id, username, password, fullname, role, active) VALUES (?,?,?,?,?,?)',
        ['U003', 'sales', 'sales123', 'مندوب المبيعات', 'rep', 1]
      );
      console.log('✅ تم إضافة المندوب:');
      console.log('   Username: sales');
      console.log('   Password: sales123');
      console.log('   Role: مندوب مبيعات\n');
    } catch (err) {
      if (err.message.includes('duplicate')) {
        console.log('⚠️  المندوب موجود بالفعل\n');
      } else {
        throw err;
      }
    }
    
    // عرض جميع المستخدمين
    console.log('📋 جميع المستخدمين الآن:\n');
    const result = await query('SELECT id, username, fullname, role FROM users ORDER BY id');
    result.rows.forEach((u, i) => {
      console.log(`${i + 1}. ${u.username}`);
      console.log(`   الاسم: ${u.fullname}`);
      console.log(`   الدور: ${u.role}`);
      console.log('');
    });
    
    console.log('🎉 تم الانتهاء بنجاح!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
