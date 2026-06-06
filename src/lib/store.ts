// Store en memoria para demo (simula Supabase)
import {
  MandateExecution,
  Orden,
  Lote,
  NuevoLoteForm,
  RecurringPurchaseMandate,
} from '@/types';
import { LOTES, ORDENES_DEMO, getLotesConDetalle, getProducto, getProveedor } from './seed-data';
import { recommendForBuyer } from './matching';

// Estado mutable en memoria
let lotes: Lote[] = [...LOTES];
let ordenes: Orden[] = [...ORDENES_DEMO];
let ordenIdCounter = 10;
let mandateIdCounter = 1;
let executionIdCounter = 1;

let mandates: RecurringPurchaseMandate[] = [
  {
    id: 'mandate-1',
    buyer_id: 'buyer-1',
    estado: 'active',
    frecuencia: 'semanal',
    categorias_prioritarias: ['panificados', 'lacteos', 'cafe_infusiones'],
    productos_objetivo: ['prod-1', 'prod-6', 'prod-17'],
    presupuesto_maximo: 95000,
    proveedor_fallback_id: 'prov-1',
    permitir_sustituciones: true,
    ventana_entrega: '06:00-09:00',
    proxima_ejecucion: '2026-06-09T06:30:00.000Z',
    ultima_ejecucion: '2026-06-02T06:20:00.000Z',
    x402_enabled: true,
  },
];
let mandateExecutions: MandateExecution[] = [];

export function getAllLotes(): Lote[] {
  return lotes.map((l) => ({
    ...l,
    producto: getProducto(l.product_id),
    proveedor: getProveedor(l.supplier_id),
  }));
}

export function getLotesByCategoria(categoria: string): Lote[] {
  return getAllLotes().filter(
    (l) => !categoria || l.producto?.categoria === categoria
  );
}

export function getLotesExcedentes(): Lote[] {
  return getAllLotes().filter((l) => l.urgencia !== 'normal' && l.activo);
}

export function addLote(form: NuevoLoteForm): Lote {
  const nuevo: Lote = {
    ...form,
    id: `lote-${Date.now()}`,
    activo: true,
    producto: getProducto(form.product_id),
    proveedor: getProveedor(form.supplier_id),
  };
  lotes.push(nuevo);
  return nuevo;
}

export function getAllOrdenes(buyer_id?: string): Orden[] {
  if (buyer_id) return ordenes.filter((o) => o.buyer_id === buyer_id);
  return ordenes;
}

export function createOrden(data: Omit<Orden, 'id' | 'created_at'>): Orden {
  const nueva: Orden = {
    ...data,
    id: `orden-${++ordenIdCounter}`,
    created_at: new Date().toISOString(),
  };
  ordenes.push(nueva);
  return nueva;
}

export function getOrdenById(id: string): Orden | undefined {
  return ordenes.find((o) => o.id === id);
}

export function getMandates(buyerId?: string): RecurringPurchaseMandate[] {
  if (buyerId) return mandates.filter((mandate) => mandate.buyer_id === buyerId);
  return mandates;
}

export function createMandate(
  data: Omit<RecurringPurchaseMandate, 'id'>
): RecurringPurchaseMandate {
  const mandate: RecurringPurchaseMandate = {
    ...data,
    id: `mandate-${++mandateIdCounter}`,
  };
  mandates.push(mandate);
  return mandate;
}

export function updateMandateStatus(
  id: string,
  estado: RecurringPurchaseMandate['estado']
): RecurringPurchaseMandate | undefined {
  mandates = mandates.map((mandate) =>
    mandate.id === id ? { ...mandate, estado } : mandate
  );
  return mandates.find((mandate) => mandate.id === id);
}

export function getMandateById(id: string): RecurringPurchaseMandate | undefined {
  return mandates.find((mandate) => mandate.id === id);
}

export function getMandateExecutions(
  mandateId?: string,
  buyerId?: string
): MandateExecution[] {
  return mandateExecutions.filter((execution) => {
    if (mandateId && execution.mandate_id !== mandateId) return false;
    if (buyerId && execution.buyer_id !== buyerId) return false;
    return true;
  });
}

export function simulateMandateExecution(
  id: string,
  opts: { paymentAuthorized?: boolean } = {}
): MandateExecution | undefined {
  const mandate = getMandateById(id);
  if (!mandate) return undefined;
  const { paymentAuthorized = false } = opts;

  const recomendaciones = recommendForBuyer(mandate.buyer_id, { max_resultados: 3 });
  const totalEstimado = recomendaciones.reduce((acc, item) => {
    return acc + item.lote.precio_unitario * item.lote.compra_minima;
  }, 0);

  let status: MandateExecution['status'] = 'recommended';
  let paymentStatus: MandateExecution['payment_status'] = 'not_required';
  let nextMandateStatus = mandate.estado;

  if (mandate.x402_enabled) {
    status = paymentAuthorized ? 'paid' : 'payment_required';
    paymentStatus = paymentAuthorized ? 'paid' : 'required';
  }

  if (totalEstimado > mandate.presupuesto_maximo) {
    status = 'failed';
    paymentStatus = mandate.x402_enabled ? 'required' : 'not_required';
    nextMandateStatus = 'exhausted';
  }

  const execution: MandateExecution = {
    id: `execution-${++executionIdCounter}`,
    mandate_id: mandate.id,
    buyer_id: mandate.buyer_id,
    status,
    recomendaciones,
    total_estimado: totalEstimado,
    payment_status: paymentStatus,
    executed_at: new Date().toISOString(),
  };

  mandateExecutions = [execution, ...mandateExecutions];
  mandates = mandates.map((current) =>
    current.id === mandate.id
      ? {
          ...current,
          estado: nextMandateStatus,
          ultima_ejecucion: execution.executed_at,
        }
      : current
  );

  return execution;
}
