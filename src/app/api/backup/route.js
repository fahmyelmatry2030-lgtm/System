import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { isPostgres } from '@/lib/db';

export async function GET(request) {
  try {
    const role = request.nextUrl.searchParams.get('role');
    if (!role || !['admin', 'accountant'].includes(role)) {
      return NextResponse.json({ error: 'غير مصرح لك بتنزيل النسخة الاحتياطية' }, { status: 403 });
    }

    if (isPostgres()) {
      return NextResponse.json({
        error: 'النسخة الاحتياطية متاحة محلياً فقط. على Vercel استخدم نسخ PostgreSQL الاحتياطية من لوحة التحكم.',
      }, { status: 400 });
    }

    const dbPath = path.join(process.cwd(), 'database.sqlite');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'ملف قاعدة البيانات غير موجود' }, { status: 404 });
    }

    const buffer = fs.readFileSync(dbPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="erp-backup-${timestamp}.sqlite"`,
        'Content-Length': String(buffer.length),
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'فشل إنشاء النسخة الاحتياطية' }, { status: 500 });
  }
}
