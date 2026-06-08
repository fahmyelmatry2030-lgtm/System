import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = (await query("SELECT * FROM settings WHERE id = '1'")).rows[0];
    return NextResponse.json({ settings: settings || {} });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { companyName, taxRate, currency, logoUrl, footerMessage } = data;
    
    // Check if exists
    const exists = (await query("SELECT * FROM settings WHERE id = '1'")).rows[0];
    
    if (exists) {
      await query(
        'UPDATE settings SET companyName=?, taxRate=?, currency=?, logoUrl=?, footerMessage=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
        [companyName, taxRate, currency, logoUrl, footerMessage, '1']
      );
    } else {
      await query(
        'INSERT INTO settings (id, companyName, taxRate, currency, logoUrl, footerMessage) VALUES (?,?,?,?,?,?)',
        ['1', companyName, taxRate, currency, logoUrl, footerMessage]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
