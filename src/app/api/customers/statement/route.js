import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId');
    if (!customerId) {
      return NextResponse.json({ error: 'معرّف العميل مطلوب' }, { status: 400 });
    }

    const customer = (await query('SELECT * FROM customers WHERE id = ?', [customerId])).rows[0];
    if (!customer) {
      return NextResponse.json({ error: 'العميل غير موجود' }, { status: 404 });
    }

    const sales = (await query(
      `SELECT id, date, total, paidAmount, paymentStatus, postStatus, repName
       FROM sales WHERE customerId = ? ORDER BY date DESC`,
      [customerId]
    )).rows;

    const collections = (await query(
      `SELECT id, date, amount, method, postStatus, repName, notes
       FROM collections WHERE customerId = ? ORDER BY date DESC`,
      [customerId]
    )).rows;

    const totalSales = sales
      .filter((s) => (s.postStatus || s.poststatus) === 'posted')
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const totalCollected = collections
      .filter((c) => (c.postStatus || c.poststatus) === 'posted')
      .reduce((sum, c) => sum + (c.amount || 0), 0);

    return NextResponse.json({
      customer,
      sales,
      collections,
      summary: {
        balance: customer.balance || 0,
        totalSales,
        totalCollected,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
