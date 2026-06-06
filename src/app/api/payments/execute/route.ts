import { NextRequest, NextResponse } from 'next/server';
import { getMandateById, simulateMandateExecution } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.mandate_id) {
      return NextResponse.json(
        { error: 'mandate_id es obligatorio' },
        { status: 400 }
      );
    }

    const mandate = getMandateById(body.mandate_id);
    if (!mandate) {
      return NextResponse.json({ error: 'Mandato no encontrado' }, { status: 404 });
    }

    const paymentSignature = req.headers.get('payment-signature');
    if (mandate.x402_enabled && !paymentSignature) {
      return NextResponse.json(
        {
          error: 'Payment Required',
          message: 'Este endpoint requiere pago programatico antes de ejecutar la recompra.',
          x402: {
            network: 'eip155:84532',
            scheme: 'exact',
            price: '$0.02',
            payTo: '0xEnMasaDemoWallet',
            resource: '/api/payments/execute',
          },
        },
        {
          status: 402,
          headers: {
            'PAYMENT-REQUIRED': 'x402; scheme=exact; network=eip155:84532; amount=$0.02',
          },
        }
      );
    }

    const execution = simulateMandateExecution(body.mandate_id, {
      paymentAuthorized: Boolean(paymentSignature),
    });
    if (!execution) {
      return NextResponse.json(
        { error: 'No se pudo simular la ejecucion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      execution,
      payment_signature_received: Boolean(paymentSignature),
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo ejecutar el pago programatico' },
      { status: 500 }
    );
  }
}