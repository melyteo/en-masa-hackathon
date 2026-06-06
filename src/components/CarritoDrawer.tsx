'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCarrito } from '@/hooks/useCarrito';

function formatPrecio(valor: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor);
}

export default function CarritoDrawer() {
  const {
    items,
    isOpen,
    total,
    actualizarCantidad,
    quitarItem,
    vaciarCarrito,
    cerrarCarrito,
  } = useCarrito();

  if (!isOpen || items.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar carrito"
        className="fixed inset-0 z-40 bg-gray-950/35 backdrop-blur-[1px]"
        onClick={cerrarCarrito}
      />

      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-gray-200 bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
                <ShoppingCart size={18} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Tu pedido</h2>
                <p className="text-xs text-gray-500">
                  {items.length} lotes seleccionados
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={cerrarCarrito}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {items.map(({ lote, cantidad }) => {
              const subtotal = cantidad * lote.precio_unitario;

              return (
                <div
                  key={lote.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {lote.producto?.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {lote.proveedor?.nombre}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => quitarItem(lote.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {formatPrecio(lote.precio_unitario)} / {lote.producto?.unidad}
                    </span>
                    <span>
                      Min. {lote.compra_minima} {lote.producto?.unidad}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white">
                      <button
                        type="button"
                        onClick={() => actualizarCantidad(lote.id, cantidad - 1)}
                        className="px-3 py-2 text-gray-500 hover:text-gray-900"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={lote.compra_minima}
                        max={lote.cantidad}
                        value={cantidad}
                        onChange={(e) =>
                          actualizarCantidad(lote.id, Number(e.target.value))
                        }
                        className="w-16 border-x border-gray-200 py-2 text-center text-sm font-medium outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => actualizarCantidad(lote.id, cantidad + 1)}
                        className="px-3 py-2 text-gray-500 hover:text-gray-900"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-400">Subtotal</p>
                      <p className="font-bold text-brand-600">
                        {formatPrecio(subtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 px-5 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total estimado</span>
              <span className="text-2xl font-extrabold text-gray-900">
                {formatPrecio(total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={vaciarCarrito}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Vaciar
              </button>
              <Link
                href="/orden"
                onClick={cerrarCarrito}
                className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600"
              >
                Confirmar orden
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
