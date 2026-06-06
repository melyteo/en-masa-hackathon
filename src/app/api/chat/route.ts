import { NextRequest, NextResponse } from 'next/server';
import { matchLotes, extraerItemsSimple } from '@/lib/matching';
import { ItemExtraido } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { mensaje, historial, buyer_id } = await req.json();

    if (!mensaje || typeof mensaje !== 'string') {
      return NextResponse.json(
        { error: 'Mensaje inválido' },
        { status: 400 }
      );
    }

    // Extraer items del mensaje
    let itemsExtraidos: ItemExtraido[] = [];
    let respuestaIA = '';

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey && apiKey !== 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      // Usar OpenAI real
      try {
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey });

        const systemPrompt = `Eres Enmasa AI, asistente de compras mayoristas para gastronomía B2B. 
Tu tarea es:
1. Extraer los items de compra del mensaje del usuario (producto, cantidad, unidad).
2. Responder de forma amigable confirmando lo que entendiste.
3. Siempre responder en español argentino informal.
4. Si no hay items de compra claros, hacer una pregunta aclaratoria.

Responde SIEMPRE en este formato JSON:
{
  "items": [{"nombre": "...", "cantidad": 10, "unidad": "kg"}],
  "mensaje": "Tu mensaje de respuesta aquí"
}`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            ...((historial ?? []).slice(-6).map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            }))),
            { role: 'user', content: mensaje },
          ],
          max_tokens: 500,
          temperature: 0.3,
        });

        const raw = completion.choices[0].message.content ?? '{}';
        const parsed = JSON.parse(raw);
        itemsExtraidos = parsed.items ?? [];
        respuestaIA = parsed.mensaje ?? '';
      } catch (err) {
        console.error('OpenAI error, fallback a extracción simple:', err);
        itemsExtraidos = extraerItemsSimple(mensaje);
        respuestaIA = generarRespuestaFallback(itemsExtraidos, mensaje);
      }
    } else {
      // Modo demo sin API key
      itemsExtraidos = extraerItemsSimple(mensaje);
      respuestaIA = generarRespuestaFallback(itemsExtraidos, mensaje);
    }

    // Hacer matching con los items extraídos
    const matches = matchLotes(itemsExtraidos, {
      zona_buyer: 'Palermo',
      max_resultados: 6,
      buyer_id,
    });

    // Complementar respuesta con resultados
    if (matches.length > 0 && itemsExtraidos.length > 0) {
      respuestaIA +=
        `\n\nEncontré **${matches.length} opciones** para tu pedido. ` +
        `Las ves a la derecha ordenadas por score: precio, cercanía, urgencia y ajuste con tu perfil. ` +
        `Seleccioná las que quieras y confirmá la orden.`;
    } else if (itemsExtraidos.length === 0) {
      respuestaIA =
        'No pude identificar productos en tu mensaje. ' +
        'Podés decirme algo como: _"Necesito 10 kg de tomate y 5 kg de queso"_.';
    }

    return NextResponse.json({
      respuesta: respuestaIA,
      items: itemsExtraidos,
      matches,
    });
  } catch (err) {
    console.error('Error en /api/chat:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function generarRespuestaFallback(
  items: ItemExtraido[],
  mensaje: string
): string {
  if (items.length === 0) {
    return (
      '¡Hola! Recibí tu mensaje. Para ayudarte mejor, ' +
      'decime qué productos necesitás y en qué cantidad. ' +
      'Por ejemplo: _"Necesito 8 cajas de medialunas y 10 kg de tomate para mañana."_'
    );
  }

  const lista = items
    .map((i) => `**${i.cantidad} ${i.unidad ?? ''}${i.nombre}**`)
    .join(', ');

  return (
    `Entendido! Estoy buscando proveedores para: ${lista}. ` +
    `Ahora te muestro las mejores opciones ordenadas por precio, cercanía y disponibilidad.`
  );
}
