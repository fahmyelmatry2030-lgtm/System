import { query, ensureDb } from './src/lib/db.js';

(async () => {
  try {
    await ensureDb();
    
    console.log('🔐 اختبار تسجيل الدخول لجميع المستخدمين\n');
    
    const users = [
      { username: 'admin', password: 'admin123' },
      { username: 'accountant', password: 'accountant123' },
      { username: 'sales', password: 'sales123' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const user of users) {
      const result = await query(
        'SELECT id, username, fullname, role FROM users WHERE username = ? AND password = ? AND active = 1',
        [user.username, user.password]
      );
      
      if (result.rows[0]) {
        const u = result.rows[0];
        console.log(`✅ ${user.username}`);
        console.log(`   الاسم: ${u.fullname}`);
        console.log(`   الدور: ${u.role}`);
        console.log('');
        passed++;
      } else {
        console.log(`❌ ${user.username} - فشل تسجيل الدخول`);
        console.log('');
        failed++;
      }
    }
    
    console.log('📊 النتيجة:');
    console.log(`   ✅ نجح: ${passed}`);
    console.log(`   ❌ فشل: ${failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 جميع المستخدمين جاهزين للعمل!');
    }
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
