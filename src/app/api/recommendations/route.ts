import { NextRequest, NextResponse } from 'next/server';
import { buildBuyerProfile, recommendForBuyer } from '@/lib/matching';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buyerId = searchParams.get('buyer_id') ?? 'buyer-1';

  const profile = buildBuyerProfile(buyerId);
  if (!profile) {
    return NextResponse.json(
      { error: 'Comprador no encontrado' },
      { status: 404 }
    );
  }

  const recomendaciones = recommendForBuyer(buyerId, {
    max_resultados: 3,
    zona_buyer: profile.zona,
  });

  return NextResponse.json({
    profile,
    recomendaciones,
    resumen:
      recomendaciones.length > 0
        ? `Detectamos una oportunidad alineada con tu operación: ${profile.categorias_preferidas
            .slice(0, 2)
            .join(' y ')}.`
        : 'Todavía no hay suficientes señales para sugerir una recompra automática.',
    proximo_pedido_sugerido_en_dias: profile.frecuencia_compra_dias,
  });
}