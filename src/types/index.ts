// ============================================================
// Tipos base de Enmasa MVP
// ============================================================

export type TipoLocal =
  | 'cafeteria'
  | 'restaurante'
  | 'bar'
  | 'rotiseria'
  | 'hotel'
  | 'dark_kitchen'
  | 'otro';

export type TipoProveedor =
  | 'productor'
  | 'panaderia'
  | 'fabrica'
  | 'mayorista'
  | 'distribuidor';

export type CategoriaProducto =
  | 'panificados'
  | 'lacteos'
  | 'frescos_verdura'
  | 'frescos_carne'
  | 'bebidas'
  | 'descartables'
  | 'cafe_infusiones'
  | 'limpieza'
  | 'congelados'
  | 'secos';

export type EstadoOrden =
  | 'pendiente'
  | 'confirmada'
  | 'en_preparacion'
  | 'entregada'
  | 'cancelada';

export type UrgenciaLote = 'normal' | 'urgente' | 'excedente';

export interface Comprador {
  id: string;
  nombre: string;
  tipo_local: TipoLocal;
  zona: string;
  direccion: string;
  lat?: number;
  lng?: number;
  productos_frecuentes: string[];
}

export interface Proveedor {
  id: string;
  nombre: string;
  tipo: TipoProveedor;
  zona: string;
  direccion: string;
  lat?: number;
  lng?: number;
  categorias: CategoriaProducto[];
  rating: number; // 1-5
  entrega: boolean;
  distancia_km?: number; // calculada dinámicamente
}

export interface Producto {
  id: string;
  categoria: CategoriaProducto;
  nombre: string;
  unidad: string; // kg, unidad, caja, litro, etc.
  descripcion?: string;
}

export interface Lote {
  id: string;
  supplier_id: string;
  product_id: string;
  cantidad: number;
  precio_unitario: number; // ARS por unidad
  compra_minima: number;
  vencimiento?: string; // ISO date
  urgencia: UrgenciaLote;
  descripcion?: string;
  activo: boolean;
  // Populated via join
  producto?: Producto;
  proveedor?: Proveedor;
  score?: number; // calculado por matching
}

export interface OrdenItem {
  lote_id: string;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  proveedor_nombre: string;
}

export interface Orden {
  id: string;
  buyer_id: string;
  estado: EstadoOrden;
  items: OrdenItem[];
  total: number;
  fecha_entrega: string;
  notas?: string;
  created_at: string;
}

export type FrecuenciaMandato = 'diaria' | 'semanal' | 'quincenal' | 'mensual';

export type EstadoMandatoRecurrente =
  | 'draft'
  | 'active'
  | 'paused'
  | 'exhausted'
  | 'expired'
  | 'revoked';

export interface BuyerProfile {
  buyer_id: string;
  buyer_nombre: string;
  tipo_local: TipoLocal;
  zona: string;
  categorias_preferidas: CategoriaProducto[];
  productos_frecuentes: string[];
  proveedores_preferidos: string[];
  frecuencia_compra_dias: number;
  ticket_promedio: number;
  ultima_orden_at?: string;
  sensibilidad_precio: 'alta' | 'media' | 'baja';
  ventana_entrega?: string;
}

export interface RecurringPurchaseMandate {
  id: string;
  buyer_id: string;
  estado: EstadoMandatoRecurrente;
  frecuencia: FrecuenciaMandato;
  categorias_prioritarias: CategoriaProducto[];
  productos_objetivo: string[];
  presupuesto_maximo: number;
  proveedor_fallback_id?: string;
  permitir_sustituciones: boolean;
  ventana_entrega?: string;
  proxima_ejecucion: string;
  ultima_ejecucion?: string;
  x402_enabled: boolean;
}

export interface MandateExecution {
  id: string;
  mandate_id: string;
  buyer_id: string;
  status: 'pending' | 'recommended' | 'payment_required' | 'paid' | 'executed' | 'failed';
  recomendaciones: MatchResult[];
  total_estimado: number;
  payment_status: 'not_required' | 'required' | 'authorized' | 'paid';
  executed_at: string;
}

export interface ChatMensaje {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ItemExtraido {
  nombre: string;
  cantidad: number;
  unidad?: string;
}

export interface ChatRequest {
  buyer_id: string;
  texto: string;
  items_extraidos?: ItemExtraido[];
  respuesta_ia?: string;
  timestamp: string;
}

// DTO para crear lote desde formulario proveedor
export interface NuevoLoteForm {
  supplier_id: string;
  product_id: string;
  cantidad: number;
  precio_unitario: number;
  compra_minima: number;
  vencimiento?: string;
  urgencia: UrgenciaLote;
  descripcion?: string;
}

// Resultado del matching
export interface MatchResult {
  lote: Lote;
  score: number;
  razon: string; // "Mejor precio" | "Entrega más rápida" | "Excedente con descuento"
  razon_extendida?: string;
  confidence?: number;
  ahorro_estimado?: number;
  perfil_match?: boolean;
}
