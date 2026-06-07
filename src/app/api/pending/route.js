import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getPostStatus } from '@/lib/api-auth';

const SOURCES = [
  { entity: 'sales', table: 'sales', label: 'فاتورة بيع', partyField: 'customerName', amountField: 'total', dateField: 'date', href: '/sales' },
  { entity: 'purchases', table: 'purchases', label: 'فاتورة شراء', partyField: 'supplierName', amountField: 'total', dateField: 'date', href: '/purchases' },
  { entity: 'collections', table: 'collections', label: 'سند قبض', partyField: 'customerName', amountField: 'amount', dateField: 'date', href: '/collections' },
  { entity: 'returns', table: 'returns', label: 'مرتجع', partyField: 'entityName', amountField: 'total', dateField: 'date', href: '/returns' },
  { entity: 'expenses', table: 'expenses', label: 'مصروف', partyField: 'category', amountField: 'amount', dateField: 'date', href: '/expenses' },
  { entity: 'damaged', table: 'damaged', label: 'مادة تالفة', partyField: 'productName', amountField: 'value', dateField: 'date', href: '/damaged' },
  { entity: 'stocktakes', table: 'stocktakes', label: 'جرد مخزون', partyField: 'productName', amountField: null, dateField: 'date', href: '/stocktake' },
];

function field(record, key) {
  if (!record || !key) return '';
  return record[key] ?? record[key.toLowerCase()] ?? '';
}

export async function GET() {
  try {
    const items = [];

    for (const source of SOURCES) {
      const rows = (await query(`SELECT * FROM ${source.table} ORDER BY createdAt DESC`)).rows;
      for (const row of rows) {
        if (getPostStatus(row) !== 'pending') continue;
        items.push({
          id: row.id,
          entity: source.entity,
          label: source.label,
          party: field(row, source.partyField),
          amount: source.amountField ? field(row, source.amountField) : null,
          date: field(row, source.dateField),
          createdByName: field(row, 'createdByName') || 'غير محدد',
          href: source.href,
        });
      }
    }

    items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return NextResponse.json({ items, totalCount: items.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
