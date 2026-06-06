import { NextRequest, NextResponse } from 'next/server';
import { getAllOrdenes, createOrden } from '@/lib/store';
import { EstadoOrden, OrdenItem } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get('buyer_id') ?? undefined;
  const ordenes = getAllOrdenes(buyerId);
  return NextResponse.json(ordenes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.buyer_id || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'buyer_id e items son obligatorios' },
        { status: 400 }
      );
    }

    if (!body.fecha_entrega) {
      return NextResponse.json(
        { error: 'fecha_entrega es obligatoria' },
        { status: 400 }
      );
    }

    // Validar items
    for (const item of body.items as OrdenItem[]) {
      if (!item.lote_id || !item.cantidad || item.cantidad <= 0) {
        return NextResponse.json(
          { error: 'Cada item debe tener lote_id y cantidad positiva' },
          { status: 400 }
        );
      }
    }

    const orden = createOrden({
      buyer_id: body.buyer_id,
      estado: 'confirmada' as EstadoOrden,
      items: body.items,
      total: body.total ?? 0,
      fecha_entrega: body.fecha_entrega,
      notas: body.notas,
    });

    return NextResponse.json(orden, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear la orden' },
      { status: 500 }
    );
  }
}
