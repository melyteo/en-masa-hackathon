import { NextRequest, NextResponse } from 'next/server';
import { createMandate, getMandates, updateMandateStatus } from '@/lib/store';
import { EstadoMandatoRecurrente, RecurringPurchaseMandate } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get('buyer_id') ?? undefined;
  return NextResponse.json(getMandates(buyerId));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Omit<RecurringPurchaseMandate, 'id'>;

    if (!body.buyer_id || !body.frecuencia || !body.presupuesto_maximo) {
      return NextResponse.json(
        { error: 'buyer_id, frecuencia y presupuesto_maximo son obligatorios' },
        { status: 400 }
      );
    }

    const mandate = createMandate({
      ...body,
      estado: body.estado ?? 'draft',
      categorias_prioritarias: body.categorias_prioritarias ?? [],
      productos_objetivo: body.productos_objetivo ?? [],
      permitir_sustituciones: body.permitir_sustituciones ?? true,
      proxima_ejecucion: body.proxima_ejecucion ?? new Date().toISOString(),
      x402_enabled: body.x402_enabled ?? false,
    });

    return NextResponse.json(mandate, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo crear el mandato' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id || !body.estado) {
      return NextResponse.json(
        { error: 'id y estado son obligatorios' },
        { status: 400 }
      );
    }

    const mandate = updateMandateStatus(
      body.id,
      body.estado as EstadoMandatoRecurrente
    );
    if (!mandate) {
      return NextResponse.json({ error: 'Mandato no encontrado' }, { status: 404 });
    }

    return NextResponse.json(mandate);
  } catch {
    return NextResponse.json(
      { error: 'No se pudo actualizar el mandato' },
      { status: 500 }
    );
  }
}