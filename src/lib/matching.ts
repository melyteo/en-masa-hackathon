// ============================================================
// Motor de matching MVP
// Score: precio 35%, cercanía 25%, urgencia/excedente 20%,
//        disponibilidad 10%, rating 10%
// ============================================================
import {
  BuyerProfile,
  CategoriaProducto,
  Comprador,
  ItemExtraido,
  Lote,
  MatchResult,
  Orden,
} from '@/types';
import {
  COMPRADORES,
  PRODUCTOS,
  PROVEEDORES,
  calcularDistanciaDemo,
  getLotesConDetalle,
} from './seed-data';
import { getAllOrdenes } from './store';

interface MatchOptions {
  zona_buyer?: string;
  max_resultados?: number;
  buyer_profile?: BuyerProfile;
  buyer_id?: string;
}

export function matchLotes(
  items: ItemExtraido[],
  opts: MatchOptions = {}
): MatchResult[] {
  const {
    zona_buyer = 'Palermo',
    max_resultados = 6,
    buyer_profile,
    buyer_id,
  } = opts;
  const perfil = buyer_profile ?? (buyer_id ? buildBuyerProfile(buyer_id) : undefined);
  const lotesDisponibles = getLotesConDetalle().filter((l) => l.activo);
  const resultados: MatchResult[] = [];

  for (const item of items) {
    // Buscar lotes cuyo nombre de producto coincida (fuzzy simple)
    const termino = item.nombre.toLowerCase();
    const candidatos = lotesDisponibles.filter((lote) => {
      const nombreProd = lote.producto?.nombre.toLowerCase() ?? '';
      return (
        nombreProd.includes(termino) ||
        termino.includes(nombreProd.split(' ')[0])
      );
    });

    for (const lote of candidatos) {
      if (lote.cantidad < (lote.compra_minima ?? 1)) continue;
      resultados.push(
        buildMatchResult(lote, candidatos, item.cantidad, zona_buyer, perfil)
      );
    }
  }

  // Ordenar por score desc, dedup por product_id (top 1 por producto)
  const vistos = new Set<string>();
  const dedup = resultados
    .sort((a, b) => b.score - a.score)
    .filter((r) => {
      const key = r.lote.product_id;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });

  return dedup.slice(0, max_resultados);
}

export function buildBuyerProfile(buyerId: string): BuyerProfile | undefined {
  const buyer = COMPRADORES.find((item) => item.id === buyerId);
  if (!buyer) return undefined;

  const ordenes = getAllOrdenes(buyerId).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const categoriaCounts = new Map<CategoriaProducto, number>();
  const productoCounts = new Map<string, number>();
  const proveedorCounts = new Map<string, number>();

  for (const orden of ordenes) {
    for (const item of orden.items) {
      const producto = PRODUCTOS.find(
        (candidate) => candidate.nombre === item.producto_nombre
      );
      if (producto) {
        categoriaCounts.set(
          producto.categoria,
          (categoriaCounts.get(producto.categoria) ?? 0) + item.cantidad
        );
        productoCounts.set(
          producto.id,
          (productoCounts.get(producto.id) ?? 0) + item.cantidad
        );
      }

      const proveedor = PROVEEDORES.find(
        (candidate) => candidate.nombre === item.proveedor_nombre
      );
      if (proveedor) {
        proveedorCounts.set(
          proveedor.id,
          (proveedorCounts.get(proveedor.id) ?? 0) + item.cantidad
        );
      }
    }
  }

  const categoriasPreferidas =
    getTopKeys(categoriaCounts).slice(0, 3) as CategoriaProducto[];
  const productosFrecuentes = [
    ...buyer.productos_frecuentes,
    ...getTopKeys(productoCounts).slice(0, 4),
  ].filter((value, index, array) => array.indexOf(value) === index);
  const proveedoresPreferidos = getTopKeys(proveedorCounts).slice(0, 3);
  const ticketPromedio =
    ordenes.length > 0
      ? ordenes.reduce((acc, orden) => acc + orden.total, 0) / ordenes.length
      : estimateTicketByLocalType(buyer);

  return {
    buyer_id: buyer.id,
    buyer_nombre: buyer.nombre,
    tipo_local: buyer.tipo_local,
    zona: buyer.zona,
    categorias_preferidas: categoriasPreferidas,
    productos_frecuentes: productosFrecuentes,
    proveedores_preferidos: proveedoresPreferidos,
    frecuencia_compra_dias: calculatePurchaseFrequency(ordenes),
    ticket_promedio: Math.round(ticketPromedio),
    ultima_orden_at: ordenes[0]?.created_at,
    sensibilidad_precio: inferPriceSensitivity(ticketPromedio, categoriasPreferidas),
    ventana_entrega: buyer.tipo_local === 'cafeteria' ? '06:00-09:00' : '09:00-12:00',
  };
}

export function recommendForBuyer(
  buyerId: string,
  opts: Omit<MatchOptions, 'buyer_id' | 'buyer_profile'> = {}
): MatchResult[] {
  const perfil = buildBuyerProfile(buyerId);
  if (!perfil) return [];

  const lotesDisponibles = getLotesConDetalle().filter((lote) => lote.activo);
  const lotesPriorizados = lotesDisponibles.filter((lote) => {
    const categoria = lote.producto?.categoria;
    return categoria && perfil.categorias_preferidas.includes(categoria);
  });

  const universo = (lotesPriorizados.length > 0 ? lotesPriorizados : lotesDisponibles).filter(
    (lote) => lote.cantidad >= lote.compra_minima
  );
  const resultados = universo.map((lote) =>
    buildMatchResult(lote, universo, lote.compra_minima, perfil.zona, perfil)
  );

  return deduplicateMatches(resultados).slice(0, opts.max_resultados ?? 3);
}

function buildMatchResult(
  lote: Lote,
  candidatos: Lote[],
  cantidadSolicitada: number,
  zonaBuyer: string,
  perfil?: BuyerProfile
): MatchResult {
  const precioPorUnidad = lote.precio_unitario;
  const scoresPrecio = candidatos.map((candidate) => candidate.precio_unitario);
  const minPrecio = Math.min(...scoresPrecio);
  const maxPrecio = Math.max(...scoresPrecio) || 1;
  const scorePrecio =
    maxPrecio === minPrecio
      ? 80
      : 100 - ((precioPorUnidad - minPrecio) / (maxPrecio - minPrecio)) * 100;

  const distancia = calcularDistanciaDemo(
    lote.proveedor?.zona ?? 'Centro',
    zonaBuyer
  );
  const scoreCercania = Math.max(0, 100 - distancia * 3);

  const scoreUrgencia =
    lote.urgencia === 'excedente'
      ? 100
      : lote.urgencia === 'urgente'
      ? 70
      : 40;

  const scoreDisponibilidad = lote.cantidad >= cantidadSolicitada ? 100 : 50;
  const scoreRating = ((lote.proveedor?.rating ?? 4) / 5) * 100;
  const scorePerfil = perfil ? calculateProfileFit(lote, perfil) : 0;

  const score =
    scorePrecio * 0.3 +
    scoreCercania * 0.2 +
    scoreUrgencia * 0.15 +
    scoreDisponibilidad * 0.1 +
    scoreRating * 0.1 +
    scorePerfil * 0.15;

  const razon = buildShortReason(scorePrecio, scoreCercania, lote, scorePerfil);
  const razonExtendida = buildLongReason(lote, perfil, scorePrecio, scorePerfil, scoreCercania);

  return {
    lote: { ...lote, score },
    score,
    razon,
    razon_extendida: razonExtendida,
    confidence: Math.round((score + Math.max(scorePerfil, 50)) / 2),
    ahorro_estimado: estimateSavings(lote, candidatos),
    perfil_match: scorePerfil >= 70,
  };
}

function deduplicateMatches(resultados: MatchResult[]): MatchResult[] {
  const vistos = new Set<string>();
  return resultados
    .sort((a, b) => b.score - a.score)
    .filter((resultado) => {
      const key = resultado.lote.product_id;
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });
}

function calculateProfileFit(lote: Lote, perfil: BuyerProfile): number {
  let score = 30;
  if (lote.producto?.categoria && perfil.categorias_preferidas.includes(lote.producto.categoria)) {
    score += 30;
  }
  if (perfil.productos_frecuentes.includes(lote.product_id)) {
    score += 20;
  }
  if (perfil.proveedores_preferidos.includes(lote.supplier_id)) {
    score += 15;
  }
  if (perfil.sensibilidad_precio === 'alta' && lote.urgencia !== 'normal') {
    score += 10;
  }
  return Math.min(score, 100);
}

function buildShortReason(
  scorePrecio: number,
  scoreCercania: number,
  lote: Lote,
  scorePerfil: number
): string {
  if (scorePerfil >= 80) return '🤖 Recomendado para tu perfil';
  if (scorePrecio >= 85) return '💰 Mejor precio';
  if (lote.urgencia === 'excedente') return '🏷️ Excedente con descuento';
  if (scoreCercania >= 80) return '📍 Entrega más rápida';
  return 'Mejor opción disponible';
}

function buildLongReason(
  lote: Lote,
  perfil: BuyerProfile | undefined,
  scorePrecio: number,
  scorePerfil: number,
  scoreCercania: number
): string {
  const motivos: string[] = [];
  if (perfil?.categorias_preferidas.includes(lote.producto?.categoria as CategoriaProducto)) {
    motivos.push('encaja con tus categorías de compra más frecuentes');
  }
  if (perfil?.proveedores_preferidos.includes(lote.supplier_id)) {
    motivos.push('viene de un proveedor que ya funciona bien para tu local');
  }
  if (scorePrecio >= 85) {
    motivos.push('está entre las opciones más competitivas de precio');
  }
  if (scoreCercania >= 80) {
    motivos.push('puede llegar rápido a tu zona');
  }
  if (lote.urgencia !== 'normal') {
    motivos.push('aprovecha stock urgente o excedente');
  }
  if (scorePerfil >= 75) {
    motivos.push('la IA lo priorizó por ajuste a tu perfil operativo');
  }
  return motivos.length > 0
    ? `Conviene porque ${motivos.join(', ')}.`
    : 'Conviene por balance entre precio, disponibilidad y cercanía.';
}

function calculatePurchaseFrequency(ordenes: Orden[]): number {
  if (ordenes.length < 2) return 7;
  const diferencias: number[] = [];
  for (let index = 0; index < ordenes.length - 1; index += 1) {
    const actual = new Date(ordenes[index].created_at).getTime();
    const siguiente = new Date(ordenes[index + 1].created_at).getTime();
    const diff = Math.round((actual - siguiente) / (1000 * 60 * 60 * 24));
    if (diff > 0) diferencias.push(diff);
  }
  if (diferencias.length === 0) return 7;
  return Math.round(diferencias.reduce((acc, value) => acc + value, 0) / diferencias.length);
}

function estimateTicketByLocalType(buyer: Comprador): number {
  switch (buyer.tipo_local) {
    case 'cafeteria':
      return 65000;
    case 'restaurante':
      return 120000;
    case 'bar':
      return 90000;
    default:
      return 70000;
  }
}

function inferPriceSensitivity(
  ticketPromedio: number,
  categorias: CategoriaProducto[]
): BuyerProfile['sensibilidad_precio'] {
  if (ticketPromedio < 70000 || categorias.includes('secos')) return 'alta';
  if (ticketPromedio > 110000) return 'baja';
  return 'media';
}

function estimateSavings(lote: Lote, candidatos: Lote[]): number {
  if (candidatos.length === 0) return 0;
  const averagePrice =
    candidatos.reduce((acc, candidate) => acc + candidate.precio_unitario, 0) /
    candidatos.length;
  return Math.max(Math.round((averagePrice - lote.precio_unitario) * lote.compra_minima), 0);
}

function getTopKeys<T extends string>(source: Map<T, number>): T[] {
  return [...source.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
}

// Extraer items de texto libre (fallback sin IA)
export function extraerItemsSimple(texto: string): ItemExtraido[] {
  const patrones = [
    /(\d+(?:\.\d+)?)\s*(?:kg|kilos?|kilo)\s+(?:de\s+)?([a-záéíóúñü\s]+)/gi,
    /(\d+)\s+(?:cajas?|packs?|bolsas?)\s+(?:de\s+)?([a-záéíóúñü\s]+)/gi,
    /(\d+)\s+([a-záéíóúñü\s]+?)(?=,|\.|y\s|\n|$)/gi,
  ];

  const items: ItemExtraido[] = [];
  for (const patron of patrones) {
    let match;
    while ((match = patron.exec(texto)) !== null) {
      const cantidad = parseFloat(match[1]);
      const nombre = match[2].trim().replace(/\s+/g, ' ');
      if (nombre.length > 2 && cantidad > 0) {
        items.push({ nombre, cantidad });
      }
    }
    patron.lastIndex = 0;
  }

  return items.slice(0, 10); // máx 10 items
}
