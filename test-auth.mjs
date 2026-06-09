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

async function testAuth() {
  try {
    console.log('🔍 Testing Authentication System...\n');
    console.log('Database Type:', isPostgres() ? 'PostgreSQL' : 'SQLite');
    
    await ensureDb();
    console.log('✅ Database initialized\n');

    // Test 1: Check if admin user exists
    console.log('📋 Test 1: Checking admin user...');
    const adminResult = await query(
      'SELECT id, username, fullName, role FROM users WHERE username = ? AND password = ?',
      ['admin', 'admin123']
    );
    
    if (adminResult.rows[0]) {
      console.log('✅ Admin user found:');
      console.log('   ID:', adminResult.rows[0].id);
      console.log('   Username:', adminResult.rows[0].username);
      console.log('   Full Name:', adminResult.rows[0].fullName);
      console.log('   Role:', adminResult.rows[0].role);
    } else {
      console.log('❌ Admin user NOT found!');
    }

    // Test 2: Check all users
    console.log('\n📋 Test 2: All users in database:');
    const allUsers = await query('SELECT id, username, fullName, role, active FROM users');
    if (allUsers.rows.length > 0) {
      console.log(`✅ Found ${allUsers.rows.length} user(s):`);
      allUsers.rows.forEach(user => {
        console.log(`   - ${user.username} (${user.fullName}) - Role: ${user.role} - Active: ${user.active}`);
      });
    } else {
      console.log('❌ No users found in database!');
    }

    // Test 3: Test invalid credentials
    console.log('\n📋 Test 3: Testing invalid credentials...');
    const invalidResult = await query(
      'SELECT id, username FROM users WHERE username = ? AND password = ?',
      ['admin', 'wrongpassword']
    );
    if (invalidResult.rows.length === 0) {
      console.log('✅ Invalid credentials correctly rejected');
    } else {
      console.log('❌ Invalid credentials were accepted!');
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n✨ You can now login with:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    process.exit(0);
  }
}

testAuth();
