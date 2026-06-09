import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, requireAdmin } from '@/lib/api-auth';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request.headers.get('x-user-data') ? JSON.parse(decodeURIComponent(request.headers.get('x-user-data'))) : null);
    
    // يمكن لأي مستخدم عرض سجلات التدقيق في المستقبل
    const logs = (await query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1000')).rows;
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
