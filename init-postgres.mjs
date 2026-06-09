import { neon } from '@neondatabase/serverless';
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

const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('❌ POSTGRES_URL not found in .env.local');
  process.exit(1);
}

const pool = neon(connectionString);

const POSTGRES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    companyName TEXT,
    taxRate REAL,
    currency TEXT,
    logoUrl TEXT,
    footerMessage TEXT,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullName TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'rep',
    active INTEGER DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

async function initAndSeed() {
  try {
    console.log('🔧 Initializing PostgreSQL Database...\n');

    // Create tables
    console.log('📋 Creating tables...');
    const statements = POSTGRES_SCHEMA.split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    
    for (const sql of statements) {
      try {
        await pool(sql);
        console.log('   ✓ Table created/verified');
      } catch (err) {
        console.error('   ❌ Error:', err.message);
      }
    }

    // Clear existing users
    console.log('\n🗑️ Clearing existing users...');
    await pool('DELETE FROM users');

    // Insert admin user
    console.log('➕ Inserting admin user...');
    await pool(
      'INSERT INTO users (id, username, password, fullName, role, active) VALUES ($1, $2, $3, $4, $5, $6)',
      ['U001', 'admin', 'admin123', 'مدير النظام', 'admin', 1]
    );
    console.log('   ✓ Admin user created');

    // Insert settings
    console.log('➕ Inserting default settings...');
    await pool(
      'INSERT INTO settings (id, companyName, taxRate, currency, footerMessage) VALUES ($1, $2, $3, $4, $5)',
      ['1', 'شركتي التجارية', 15, 'د.ع', 'مرحبا بك في النظام']
    );
    console.log('   ✓ Settings created');

    // Verify
    console.log('\n✅ Verifying data...');
    const users = await pool('SELECT id, username, fullName, role, active FROM users');
    console.log(`Found ${users.length} user(s):`);
    users.forEach(user => {
      console.log(`   ✓ ${user.username} - ${user.fullname || user.fullName} (${user.role})`);
    });

    console.log('\n🎉 Database initialized successfully!');
    console.log('\n✨ Login credentials:');
    console.log('   📧 Username: admin');
    console.log('   🔐 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initAndSeed();
