'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROVEEDORES, PRODUCTOS } from '@/lib/seed-data';
import { NuevoLoteForm, UrgenciaLote } from '@/types';
import {
  PackagePlus,
  CheckCircle,
  AlertTriangle,
  Tag,
  Package,
} from 'lucide-react';
import clsx from 'clsx';

const URGENCIA_OPTIONS: { value: UrgenciaLote; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: 'normal',
    label: 'Stock regular',
    desc: 'Disponibilidad normal, sin descuento especial',
    icon: <Package size={16} />,
  },
  {
    value: 'urgente',
    label: 'Urgente',
    desc: 'Necesito rotar en las próximas 24-48hs',
    icon: <AlertTriangle size={16} />,
  },
  {
    value: 'excedente',
    label: 'Excedente / Sobreproducción',
    desc: 'Precio especial para rotar stock extra',
    icon: <Tag size={16} />,
  },
];

export default function ProveedorPage() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<NuevoLoteForm>>({
    urgencia: 'normal',
    compra_minima: 1,
  });
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  const producto = PRODUCTOS.find((p) => p.id === form.product_id);
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplier_id || !form.product_id || !form.cantidad || !form.precio_unitario) {
      setError('Completá todos los campos obligatorios.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al publicar');
      setExito(true);
    } catch {
      setError('Error al publicar el lote. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (exito) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Lote publicado!
          </h2>
          <p className="text-gray-500 mb-6">
            Tu lote ya está visible para compradores B2B en el catálogo de Enmasa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Ver catálogo
            </button>
            <button
              onClick={() => {
                setExito(false);
                setForm({ urgencia: 'normal', compra_minima: 1 });
              }}
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Publicar otro lote
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <PackagePlus size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Publicar lote o producto
            </h1>
            <p className="text-sm text-gray-500">
              Llegá a compradores B2B gastronómicos cerca tuyo
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Proveedor */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Tu empresa</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Seleccioná tu empresa *
            </label>
            <select
              value={form.supplier_id ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, supplier_id: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
              required
            >
              <option value="">-- Seleccioná tu empresa --</option>
              {PROVEEDORES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.zona}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Producto */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Producto</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Producto *
              </label>
              <select
                value={form.product_id ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, product_id: e.target.value }))
                }
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
                required
              >
                <option value="">-- Seleccioná producto --</option>
                {PRODUCTOS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.unidad})
                  </option>
                ))}
              </select>
              {producto && (
                <p className="text-xs text-gray-500 mt-1">
                  {producto.descripcion}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cantidad disponible *{' '}
                  {producto && (
                    <span className="text-gray-400">({producto.unidad})</span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.cantidad ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cantidad: Number(e.target.value) }))
                  }
                  placeholder="ej: 500"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Compra mínima *
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.compra_minima ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      compra_minima: Number(e.target.value),
                    }))
                  }
                  placeholder="ej: 10"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Precio por{' '}
                  {producto?.unidad ?? 'unidad'} (ARS) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.precio_unitario ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      precio_unitario: Number(e.target.value),
                    }))
                  }
                  placeholder="ej: 4800"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vencimiento (opcional)
                </label>
                <input
                  type="date"
                  value={form.vencimiento ?? ''}
                  min={today}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vencimiento: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Urgencia */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Tipo de oferta</h3>
          <div className="grid grid-cols-1 gap-3">
            {URGENCIA_OPTIONS.map(({ value, label, desc, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, urgencia: value }))}
                className={clsx(
                  'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors',
                  form.urgencia === value
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-brand-200'
                )}
              >
                <span
                  className={clsx(
                    'mt-0.5',
                    form.urgencia === value
                      ? 'text-brand-600'
                      : 'text-gray-400'
                  )}
                >
                  {icon}
                </span>
                <div>
                  <p
                    className={clsx(
                      'font-medium text-sm',
                      form.urgencia === value
                        ? 'text-brand-700'
                        : 'text-gray-800'
                    )}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Descripción adicional
          </h3>
          <textarea
            rows={3}
            value={form.descripcion ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, descripcion: e.target.value }))
            }
            placeholder="Detalles adicionales: condiciones de entrega, restricciones, información del lote..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors shadow-md text-base"
        >
          {loading ? 'Publicando...' : 'Publicar lote'}
        </button>
      </form>
    </div>
  );
}
