import { NextResponse } from 'next/server';
import { COMPRADORES } from '@/lib/seed-data';

export async function GET() {
  return NextResponse.json(COMPRADORES);
}