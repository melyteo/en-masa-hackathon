import { Lote } from '@/types';
import clsx from 'clsx';
import {
  AlertTriangle,
  Tag,
  Package,
  MapPin,
  Star,
  Truck,
  Clock,
} from 'lucide-react';

interface LoteCardProps {
  lote: Lote;
  onSeleccionar?: (lote: Lote) => void;
  seleccionado?: boolean;
  cantidad?: number;
  onCantidadChange?: (cantidad: number) => void;
}

const urgenciaConfig = {
  urgente: {
    label: 'Urgente',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700 border-red-200',
    cardBorder: 'border-red-200',
  },
  excedente: {
    label: 'Excedente',
    icon: Tag,
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    cardBorder: 'border-amber-200',
  },
  normal: {
    label: 'Disponible',
    icon: Package,
    className: 'bg-green-100 text-green-700 border-green-200',
    cardBorder: 'border-gray-200',
  },
};

const categoriaEmoji: Record<string, string> = {
  panificados: '🥐',
  lacteos: '🧀',
  frescos_verdura: '🥬',
  frescos_carne: '🥩',
  bebidas: '🥤',
  descartables: '🥡',
  cafe_infusiones: '☕',
  limpieza: '🧹',
  congelados: '🧊',
  secos: '🌾',
};

export default function LoteCard({
  lote,
  onSeleccionar,
  seleccionado = false,
  cantidad,
  onCantidadChange,
}: LoteCardProps) {
  const config = urgenciaConfig[lote.urgencia];
  const UrgIcon = config.icon;
  const emoji = categoriaEmoji[lote.producto?.categoria ?? ''] ?? '📦';

  const formatPrecio = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n);

  const diasHastaVto = lote.vencimiento
    ? Math.ceil(
        (new Date(lote.vencimiento).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border-2 p-4 transition-all hover:shadow-md',
        onSeleccionar ? 'cursor-pointer' : 'cursor-default',
        seleccionado
          ? 'border-brand-500 shadow-md ring-2 ring-brand-200'
          : config.cardBorder + ' hover:border-brand-300'
      )}
      onClick={() => {
        if (!seleccionado) {
          onSeleccionar?.(lote);
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {lote.producto?.nombre ?? 'Producto'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {lote.proveedor?.nombre ?? 'Proveedor'}
            </p>
          </div>
        </div>
        <span
          className={clsx(
            'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border',
            config.className
          )}
        >
          <UrgIcon size={11} />
          {config.label}
        </span>
      </div>

      {/* Descripción */}
      {lote.descripcion && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {lote.descripcion}
        </p>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-gray-400 mb-0.5">Precio / {lote.producto?.unidad}</p>
          <p className="font-bold text-brand-600 text-sm">
            {formatPrecio(lote.precio_unitario)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-gray-400 mb-0.5">Stock disponible</p>
          <p className="font-semibold text-gray-800">
            {lote.cantidad.toLocaleString()} {lote.producto?.unidad}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {lote.proveedor?.zona}
        </span>
        <span className="flex items-center gap-1">
          <Star size={11} className="text-amber-400" />
          {lote.proveedor?.rating}
        </span>
        {lote.proveedor?.entrega && (
          <span className="flex items-center gap-1 text-green-600">
            <Truck size={11} />
            Con entrega
          </span>
        )}
        {diasHastaVto !== null && (
          <span
            className={clsx(
              'flex items-center gap-1',
              diasHastaVto <= 3 ? 'text-red-500 font-medium' : 'text-gray-500'
            )}
          >
            <Clock size={11} />
            Vence en {diasHastaVto}d
          </span>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-3">
        Compra mínima: {lote.compra_minima} {lote.producto?.unidad}
      </p>

      {/* Score bar (si disponible) */}
      {lote.score !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Score Enmasa</span>
            <span className="font-medium text-brand-600">
              {Math.round(lote.score)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${Math.min(lote.score, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Cantidad + Botón */}
      {seleccionado && onCantidadChange && (
        <div
          className="flex items-center gap-2 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="text-xs text-gray-500">Cantidad:</label>
          <input
            type="number"
            min={lote.compra_minima}
            max={lote.cantidad}
            value={cantidad ?? lote.compra_minima}
            onChange={(e) => onCantidadChange(Number(e.target.value))}
            className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <span className="text-xs text-gray-400">{lote.producto?.unidad}</span>
        </div>
      )}

      {!seleccionado && onSeleccionar && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSeleccionar(lote);
          }}
          className="w-full mt-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          Seleccionar lote
        </button>
      )}

      {seleccionado && (
        <div className="mt-2 text-center text-xs font-medium text-brand-700 bg-brand-50 rounded-lg py-1.5">
          ✓ Seleccionado
        </div>
      )}
    </div>
  );
}
