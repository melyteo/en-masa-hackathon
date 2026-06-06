import { NextRequest, NextResponse } from 'next/server';
import { getMandateExecutions, simulateMandateExecution } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mandateId = searchParams.get('mandate_id') ?? undefined;
  const buyerId = searchParams.get('buyer_id') ?? undefined;
  return NextResponse.json(getMandateExecutions(mandateId, buyerId));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.mandate_id) {
      return NextResponse.json(
        { error: 'mandate_id es obligatorio' },
        { status: 400 }
      );
    }

    const execution = simulateMandateExecution(body.mandate_id);
    if (!execution) {
      return NextResponse.json({ error: 'Mandato no encontrado' }, { status: 404 });
    }

    return NextResponse.json(execution);
  } catch {
    return NextResponse.json(
      { error: 'No se pudo ejecutar el mandato' },
      { status: 500 }
    );
  }
}