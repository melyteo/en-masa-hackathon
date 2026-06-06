import { NextRequest, NextResponse } from 'next/server';
import { getMandateById } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mandateId = searchParams.get('mandate_id');

  if (!mandateId) {
    return NextResponse.json(
      { error: 'mandate_id es obligatorio' },
      { status: 400 }
    );
  }

  const mandate = getMandateById(mandateId);
  if (!mandate) {
    return NextResponse.json({ error: 'Mandato no encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    mandate_id: mandate.id,
    buyer_id: mandate.buyer_id,
    status: mandate.estado,
    x402: {
      enabled: mandate.x402_enabled,
      network: 'eip155:84532',
      scheme: 'exact',
      price: '$0.02',
      description: 'Ejecucion agentic de recompra En Masa',
      payTo: '0xEnMasaDemoWallet',
    },
  });
}