import { NextResponse } from 'next/server';
import { PROVEEDORES } from '@/lib/seed-data';

export async function GET() {
  return NextResponse.json(PROVEEDORES);
}