import { NextRequest, NextResponse } from 'next/server';
import { getAllLotes, addLote } from '@/lib/store';
import { NuevoLoteForm } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria') ?? '';
  const urgencia = searchParams.get('urgencia') ?? '';

  let lotes = getAllLotes();

  if (categoria) {
    lotes = lotes.filter((l) => l.producto?.categoria === categoria);
  }
  if (urgencia) {
    lotes = lotes.filter((l) => l.urgencia === urgencia);
  }

  return NextResponse.json(lotes);
}

export async function POST(req: NextRequest) {
  try {
    const body: NuevoLoteForm = await req.json();

    if (!body.supplier_id || !body.product_id || !body.cantidad || !body.precio_unitario) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    if (body.cantidad <= 0 || body.precio_unitario <= 0) {
      return NextResponse.json(
        { error: 'Cantidad y precio deben ser positivos' },
        { status: 400 }
      );
    }

    const nuevo = addLote(body);
    return NextResponse.json(nuevo, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear el lote' },
      { status: 500 }
    );
  }
}
