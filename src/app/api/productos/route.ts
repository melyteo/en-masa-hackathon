import { NextResponse } from 'next/server';
import { PRODUCTOS } from '@/lib/seed-data';

export async function GET() {
  return NextResponse.json(PRODUCTOS);
}
