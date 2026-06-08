import { NextResponse } from 'next/server';
import { isPostgres } from '@/lib/db';

export async function GET() {
  return NextResponse.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    hasPgUrl: !!process.env.POSTGRES_URL,
    dbUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) : null,
    dbHost: process.env.DATABASE_URL ? (function(){ try { return new URL(process.env.DATABASE_URL.replace(/^DATABASE_URL=/, '')).hostname; } catch(e) { return process.env.DATABASE_URL; } })() : null,
    isPg: isPostgres()
  });
}
