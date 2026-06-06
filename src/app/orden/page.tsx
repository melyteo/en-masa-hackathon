'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCarrito } from '@/hooks/useCarrito';
import { Lote, OrdenItem } from '@/types';
import {
  ShoppingCart,
  CheckCircle,
  Truck,
  CalendarDays,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

function OrdenContenido() {
  const searchParams = useSearchParams();
  const { items: carritoItems, vaciarCarrito } = useCarrito();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [itemsDesdeUrl, setItemsDesdeUrl] = useState<
    { lote_id: string; cantidad: number }[]
  >([]);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [ordenCreada, setOrdenCreada] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Parsear items de la URL
    const itemsParam = searchParams.get('items');
    if (itemsParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(itemsParam));
        setItemsDesdeUrl(parsed);
      } catch {
        setError('Error al cargar los items seleccionados.');
      }
    }

    // Cargar lotes
    fetch('/api/lotes')
      .then((r) => r.json())
      .then(setLotes);

    // Fecha de entrega por defecto: mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    setFechaEntrega(manana.toISOString().split('T')[0]);
  }, [searchParams]);

  const getLote = (id: string) => lotes.find((l) => l.id === id);

  const usandoCarrito = itemsDesdeUrl.length === 0 && carritoItems.length > 0;

  const items: OrdenItem[] = usandoCarrito
    ? carritoItems.map(({ lote, cantidad }) => ({
        lote_id: lote.id,
        producto_nombre: lote.producto?.nombre ?? 'Producto',
        cantidad,
        precio_unitario: lote.precio_unitario,
        subtotal: lote.precio_unitario * cantidad,
        proveedor_nombre: lote.proveedor?.nombre ?? 'Proveedor',
      }))
    : (itemsDesdeUrl
        .map(({ lote_id, cantidad }) => {
          const lote = getLote(lote_id);
          if (!lote) return null;
          return {
            lote_id,
            producto_nombre: lote.producto?.nombre ?? 'Producto',
            cantidad,
            precio_unitario: lote.precio_unitario,
            subtotal: lote.precio_unitario * cantidad,
            proveedor_nombre: lote.proveedor?.nombre ?? 'Proveedor',
          };
        })
        .filter(Boolean) as OrdenItem[]);

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  const formatPrecio = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n);

  const confirmarOrden = async () => {
    if (items.length === 0) {
      setError('No hay items en la orden.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_id: 'buyer-1',
          estado: 'confirmada',
          items,
          total,
          fecha_entrega: fechaEntrega,
          notas,
        }),
      });
      const data = await res.json();
      vaciarCarrito();
      setOrdenCreada(data.id);
    } catch {
      setError('Error al confirmar la orden. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (ordenCreada) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Orden confirmada!
          </h2>
          <p className="text-gray-500 mb-2">
            Tu orden <strong>{ordenCreada}</strong> fue registrada.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Los proveedores fueron notificados y prepararán tu pedido.
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.cantidad}x {item.producto_nombre}
                </span>
                <span className="font-medium">{formatPrecio(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-brand-600">{formatPrecio(total)}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Ver mis pedidos
            </Link>
            <Link
              href="/"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-600">
          Catálogo
        </Link>
        <ChevronRight size={14} />
        {usandoCarrito ? (
          <>
            <span className="text-gray-500">Carrito</span>
            <ChevronRight size={14} />
          </>
        ) : (
          <>
            <Link href="/chat" className="hover:text-brand-600">
              Chat IA
            </Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-gray-900 font-medium">Confirmar orden</span>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
          <ShoppingCart size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confirmar orden</h1>
          <p className="text-sm text-gray-500">
            Revisá tu pedido antes de confirmar
          </p>
        </div>
      </div>

      {items.length === 0 && !error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-6">
          No hay lotes seleccionados. Volvé al{' '}
          <Link href="/chat" className="font-semibold underline">
            chat
          </Link>{' '}
          o al{' '}
          <Link href="/" className="font-semibold underline">
            catálogo
          </Link>
          .
        </div>
      )}

      {/* Resumen de items */}
      {items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Resumen del pedido
          </h3>
          <div className="space-y-3">
            {items.map((item, i) => {
              const lote = getLote(item.lote_id);
              return (
                <div
                  key={i}
                  className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">
                      {item.producto_nombre}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.proveedor_nombre} · {item.cantidad}{' '}
                      {lote?.producto?.unidad} ×{' '}
                      {formatPrecio(item.precio_unitario)}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">
                    {formatPrecio(item.subtotal)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-xl font-extrabold text-brand-600">
              {formatPrecio(total)}
            </span>
          </div>
        </div>
      )}

      {/* Detalles de entrega */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Detalles de entrega
        </h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <CalendarDays size={16} />
              Fecha de entrega *
            </label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              required
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Truck size={16} />
              Notas para el proveedor
            </label>
            <textarea
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Entrega antes de las 7am, portón lateral, refrigerado..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={confirmarOrden}
        disabled={loading || items.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors shadow-md text-base"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <CheckCircle size={20} />
        )}
        {loading ? 'Confirmando...' : `Confirmar orden — ${formatPrecio(total)}`}
      </button>
    </div>
  );
}

export default function OrdenPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-brand-500" />
      </div>
    }>
      <OrdenContenido />
    </Suspense>
  );
}
