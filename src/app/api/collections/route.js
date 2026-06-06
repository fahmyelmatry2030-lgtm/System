import getDb from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const db = getDb();
    const collections = db.prepare('SELECT * FROM collections ORDER BY date DESC').all();
    return NextResponse.json({ collections });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const id = 'COL-' + Date.now();
    
    // Start transaction to add collection and update customer balance
    const transaction = db.transaction(() => {
      // Add collection
      const stmt = db.prepare('INSERT INTO collections (id, customerId, customerName, amount, date, method, notes, repId, repName) VALUES (?,?,?,?,?,?,?,?,?)');
      stmt.run(id, data.customerId, data.customerName, data.amount, data.date, data.method || 'cash', data.notes || '', data.repId, data.repName);
      
      // Update customer balance (deduct collection amount from balance)
      const updateCustomer = db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?');
      updateCustomer.run(data.amount, data.customerId);
    });
    
    transaction();
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
