import { query, ensureDb, isPostgres } from './src/lib/db.js';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.join('./.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...vals] = line.split('=');
      const val = vals.join('=').replace(/^"|"$/g, '').trim();
      if (val) {
        process.env[key] = val;
      }
    }
  }
}

async function fixDatabase() {
  try {
    console.log('🔧 Fixing Database...\n');
    console.log('Database Type:', isPostgres() ? 'PostgreSQL ✅' : 'SQLite ❌');
    
    await ensureDb();
    console.log('✅ Database initialized\n');

    // Clear existing users to avoid duplicates
    console.log('🗑️ Clearing existing users...');
    await query('DELETE FROM users');

    // Insert admin user
    console.log('➕ Inserting admin user...');
    await query(
      'INSERT INTO users (id, username, password, fullName, role, active) VALUES (?,?,?,?,?,?)',
      ['U001', 'admin', 'admin123', 'مدير النظام', 'admin', 1]
    );

    // Insert settings
    console.log('➕ Inserting default settings...');
    await query(
      'INSERT INTO settings (id, companyName, taxRate, currency, footerMessage) VALUES (?,?,?,?,?)',
      ['1', 'شركتي التجارية', 15, 'د.ع', 'مرحبا بك في النظام']
    );

    // Verify
    console.log('\n✅ Verifying...');
    const users = await query('SELECT id, username, fullName, role, active FROM users');
    console.log(`Found ${users.rows.length} user(s):`);
    users.rows.forEach(user => {
      console.log(`   ✓ ${user.username} - ${user.fullName} (${user.role})`);
    });

    console.log('\n🎉 Database fixed successfully!');
    console.log('\n✨ Login credentials:');
    console.log('   📧 Username: admin');
    console.log('   🔐 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

fixDatabase();
