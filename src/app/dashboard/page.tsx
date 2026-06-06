'use client';

import { useState, useEffect } from 'react';
import {
  CategoriaProducto,
  Comprador,
  FrecuenciaMandato,
  MandateExecution,
  Orden,
  Producto,
  Proveedor,
  RecurringPurchaseMandate,
} from '@/types';
import {
  LayoutDashboard,
  Package,
  CheckCircle,
  Clock,
  Truck,
  TrendingUp,
  RefreshCw,
  Bot,
  PauseCircle,
  PlayCircle,
  Wallet,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';

const ESTADO_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pendiente: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-700',
    icon: <Clock size={13} />,
  },
  confirmada: {
    label: 'Confirmada',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle size={13} />,
  },
  en_preparacion: {
    label: 'En preparación',
    color: 'bg-blue-100 text-blue-700',
    icon: <Package size={13} />,
  },
  entregada: {
    label: 'Entregada',
    color: 'bg-gray-100 text-gray-700',
    icon: <Truck size={13} />,
  },
  cancelada: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-700',
    icon: <RefreshCw size={13} />,
  },
};

const CATEGORIAS_OPTIONS: { value: CategoriaProducto; label: string }[] = [
  { value: 'panificados', label: 'Panificados' },
  { value: 'lacteos', label: 'Lácteos' },
  { value: 'frescos_verdura', label: 'Verduras' },
  { value: 'frescos_carne', label: 'Carnes' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'descartables', label: 'Descartables' },
  { value: 'cafe_infusiones', label: 'Café e infusiones' },
  { value: 'secos', label: 'Secos' },
];

const FRECUENCIAS_OPTIONS: { value: FrecuenciaMandato; label: string }[] = [
  { value: 'diaria', label: 'Diaria' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
];

interface MandateFormState {
  frecuencia: FrecuenciaMandato;
  categorias_prioritarias: CategoriaProducto[];
  presupuesto_maximo: string;
  productos_objetivo: string[];
  proveedor_fallback_id: string;
  permitir_sustituciones: boolean;
  ventana_entrega: string;
  proxima_ejecucion: string;
  x402_enabled: boolean;
}

interface PaymentChallengeState {
  mandateId: string;
  message: string;
  price: string;
  network: string;
}

export default function DashboardPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [mandates, setMandates] = useState<RecurringPurchaseMandate[]>([]);
  const [executions, setExecutions] = useState<MandateExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMandates, setLoadingMandates] = useState(true);
  const [loadingReferenceData, setLoadingReferenceData] = useState(true);
  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState('buyer-1');
  const [vista, setVista] = useState<'comprador' | 'proveedor'>('comprador');
  const [creatingMandate, setCreatingMandate] = useState(false);
  const [mandateFeedback, setMandateFeedback] = useState('');
  const [paymentChallenge, setPaymentChallenge] = useState<PaymentChallengeState | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [mandateForm, setMandateForm] = useState<MandateFormState>({
    frecuencia: 'semanal',
    categorias_prioritarias: ['panificados', 'lacteos'],
    presupuesto_maximo: '90000',
    productos_objetivo: ['prod-1', 'prod-6'],
    proveedor_fallback_id: 'prov-1',
    permitir_sustituciones: true,
    ventana_entrega: '06:00-09:00',
    proxima_ejecucion: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    x402_enabled: true,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const ordenesRes = await fetch(`/api/ordenes?buyer_id=${selectedBuyerId}`);
        setOrdenes(await ordenesRes.json());
      } finally {
        setLoading(false);
      }
    };

    const loadMandates = async () => {
      try {
        const [mandatesRes, executionsRes] = await Promise.all([
          fetch(`/api/mandates?buyer_id=${selectedBuyerId}`),
          fetch(`/api/mandates/execute?buyer_id=${selectedBuyerId}`),
        ]);

        setMandates(await mandatesRes.json());
        setExecutions(await executionsRes.json());
      } finally {
        setLoadingMandates(false);
      }
    };

    const loadReferenceData = async () => {
      try {
        const [productosRes, proveedoresRes] = await Promise.all([
          fetch('/api/productos'),
          fetch('/api/proveedores'),
        ]);

        setProductos(await productosRes.json());
        setProveedores(await proveedoresRes.json());
      } finally {
        setLoadingReferenceData(false);
      }
    };

    loadDashboard();
    loadMandates();
  }, [selectedBuyerId]);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [productosRes, proveedoresRes, compradoresRes] = await Promise.all([
          fetch('/api/productos'),
          fetch('/api/proveedores'),
          fetch('/api/compradores'),
        ]);

        setProductos(await productosRes.json());
        setProveedores(await proveedoresRes.json());
        setCompradores(await compradoresRes.json());
      } finally {
        setLoadingReferenceData(false);
      }
    };

    loadReferenceData();
  }, []);

  const formatPrecio = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n);

  const totalGastado = ordenes.reduce((s, o) => s + o.total, 0);
  const ordenesConfirmadas = ordenes.filter(
    (o) => o.estado === 'confirmada' || o.estado === 'entregada'
  ).length;

  const refreshMandates = async (buyerId = selectedBuyerId) => {
    setLoadingMandates(true);
    const [mandatesRes, executionsRes] = await Promise.all([
      fetch(`/api/mandates?buyer_id=${buyerId}`),
      fetch(`/api/mandates/execute?buyer_id=${buyerId}`),
    ]);

    setMandates(await mandatesRes.json());
    setExecutions(await executionsRes.json());
    setLoadingMandates(false);
  };

  const toggleMandate = async (mandate: RecurringPurchaseMandate) => {
    const nextEstado = mandate.estado === 'active' ? 'paused' : 'active';
    await fetch('/api/mandates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: mandate.id, estado: nextEstado }),
    });
    await refreshMandates();
  };

  const simulateMandate = async (mandateId: string) => {
    setMandateFeedback('');
    setPaymentChallenge(null);

    const res = await fetch('/api/payments/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mandate_id: mandateId }),
    });

    if (res.status === 402) {
      const data = await res.json();
      setPaymentChallenge({
        mandateId,
        message: data.message,
        price: data.x402?.price ?? '$0.02',
        network: data.x402?.network ?? 'eip155:84532',
      });
      await refreshMandates();
      return;
    }

    await refreshMandates();
    setMandateFeedback('La recompra se ejecutó sin requerir un paso extra de pago.');
  };

  const completeDemoPayment = async (mandateId: string) => {
    const res = await fetch('/api/payments/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'payment-signature': 'demo-x402-signature',
      },
      body: JSON.stringify({ mandate_id: mandateId }),
    });

    if (res.ok) {
      setPaymentChallenge(null);
      setMandateFeedback('Pago demo x402 completado y recompra ejecutada.');
      await refreshMandates();
    }
  };

  const toggleCategory = (category: CategoriaProducto) => {
    setMandateForm((current) => {
      const exists = current.categorias_prioritarias.includes(category);
      const categorias = exists
        ? current.categorias_prioritarias.filter((item) => item !== category)
        : [...current.categorias_prioritarias, category];
      return {
        ...current,
        categorias_prioritarias: categorias,
        productos_objetivo: current.productos_objetivo.filter((productId) => {
          const producto = productos.find((item) => item.id === productId);
          return producto ? categorias.includes(producto.categoria) : false;
        }),
      };
    });
  };

  const toggleProductoObjetivo = (productId: string) => {
    setMandateForm((current) => {
      const exists = current.productos_objetivo.includes(productId);
      return {
        ...current,
        productos_objetivo: exists
          ? current.productos_objetivo.filter((item) => item !== productId)
          : [...current.productos_objetivo, productId],
      };
    });
  };

  const handleCreateMandate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreatingMandate(true);
    setMandateFeedback('');

    try {
      const res = await fetch('/api/mandates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_id: 'buyer-1',
          estado: 'active',
          frecuencia: mandateForm.frecuencia,
          categorias_prioritarias: mandateForm.categorias_prioritarias,
          productos_objetivo: mandateForm.productos_objetivo,
          presupuesto_maximo: Number(mandateForm.presupuesto_maximo),
          proveedor_fallback_id: mandateForm.proveedor_fallback_id || undefined,
          permitir_sustituciones: mandateForm.permitir_sustituciones,
          ventana_entrega: mandateForm.ventana_entrega,
          proxima_ejecucion: new Date(mandateForm.proxima_ejecucion).toISOString(),
          x402_enabled: mandateForm.x402_enabled,
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo crear el mandato');
      }

      setMandateFeedback('Mandato creado y activado para el comprador demo.');
      await refreshMandates();
      setMandateForm((current) => ({
        ...current,
        productos_objetivo: [],
        presupuesto_maximo: '90000',
      }));
    } catch {
      setMandateFeedback('No se pudo crear el mandato. Revisá los campos e intentá de nuevo.');
    } finally {
      setCreatingMandate(false);
    }
  };

  const productosDisponibles = productos.filter((producto) =>
    mandateForm.categorias_prioritarias.includes(producto.categoria)
  );
  const compradorActual = compradores.find((item) => item.id === selectedBuyerId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centro de abastecimiento agentic</h1>
            <p className="text-sm text-gray-500">
              La IA aprende el perfil del local, recomienda proveedores y ejecuta recompra bajo reglas.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <select
            value={selectedBuyerId}
            onChange={(e) => setSelectedBuyerId(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
          >
            {compradores.map((comprador) => (
              <option key={comprador.id} value={comprador.id}>
                {comprador.nombre}
              </option>
            ))}
          </select>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setVista('comprador')}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                vista === 'comprador'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Comprador
            </button>
            <button
              onClick={() => setVista('proveedor')}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                vista === 'proveedor'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              Proveedor
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          {
            title: 'Perfil vivo del comprador',
            text: compradorActual
              ? `${compradorActual.nombre} compra segun categoria, zona y frecuencia historica.`
              : 'El agente construye el perfil operativo del comprador.',
          },
          {
            title: 'Recompra automatizada',
            text: 'Los mandatos convierten la recomendacion en una proxima orden ejecutable.',
          },
          {
            title: 'Pago programatico',
            text: 'x402 permite cobrar la ejecucion agentic con un paso HTTP 402 verificable.',
          },
        ].map((item) => (
          <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-900 mb-2">{item.title}</p>
            <p className="text-sm text-gray-500">{item.text}</p>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Órdenes totales',
            value: ordenes.length.toString(),
            icon: <Package size={20} />,
            color: 'text-brand-600 bg-brand-50',
          },
          {
            label: 'Confirmadas',
            value: ordenesConfirmadas.toString(),
            icon: <CheckCircle size={20} />,
            color: 'text-green-600 bg-green-50',
          },
          {
            label: vista === 'comprador' ? 'Total comprado' : 'Total vendido',
            value: formatPrecio(totalGastado),
            icon: <TrendingUp size={20} />,
            color: 'text-blue-600 bg-blue-50',
          },
          {
            label: 'Proveedores usados',
            value: String(
              new Set(
                ordenes.flatMap((o) =>
                  o.items.map((i) => i.proveedor_nombre)
                )
              ).size
            ),
            icon: <Truck size={20} />,
            color: 'text-purple-600 bg-purple-50',
          },
        ].map(({ label, value, icon, color }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-2xl p-5"
          >
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                color
              )}
            >
              {icon}
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                Agente de recompra
              </p>
              <h2 className="font-bold text-gray-900 mt-1">Mandatos activos</h2>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {mandates.length} configurados
            </span>
          </div>

          <div className="space-y-4">
            {loadingMandates ? (
              <div className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4">
                Cargando mandatos y ejecuciones del agente...
              </div>
            ) : mandates.length === 0 ? (
              <div className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4">
                Todavía no hay mandatos configurados para este comprador.
              </div>
            ) : mandates.map((mandate) => (
              <div key={mandate.id} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Reposición {mandate.frecuencia}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Prioriza {mandate.categorias_prioritarias.join(', ')}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      mandate.estado === 'active'
                        ? 'bg-green-100 text-green-700'
                        : mandate.estado === 'paused'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {mandate.estado}
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-sm mb-4">
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-gray-400 text-xs mb-1">Presupuesto</p>
                    <p className="font-semibold text-gray-900">{formatPrecio(mandate.presupuesto_maximo)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-gray-400 text-xs mb-1">Próxima ejecución</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(mandate.proxima_ejecucion).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-gray-400 text-xs mb-1">Pago agentic</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Wallet size={14} className="text-brand-500" />
                      {mandate.x402_enabled ? 'x402 listo' : 'manual'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => simulateMandate(mandate.id)}
                    className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    <Bot size={16} />
                    Simular próxima recompra
                  </button>
                  <button
                    onClick={() => toggleMandate(mandate)}
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    {mandate.estado === 'active' ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                    {mandate.estado === 'active' ? 'Pausar' : 'Reactivar'}
                  </button>
                </div>

                {paymentChallenge?.mandateId === mandate.id && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-800 mb-1">
                      Pago requerido antes de ejecutar la recompra
                    </p>
                    <p className="text-sm text-amber-700 mb-3">
                      {paymentChallenge.message} {paymentChallenge.price} en {paymentChallenge.network}.
                    </p>
                    <button
                      onClick={() => completeDemoPayment(mandate.id)}
                      className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                      <Wallet size={16} />
                      Completar pago demo x402
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                Últimas ejecuciones
              </p>
              <h2 className="font-bold text-gray-900 mt-1">Estado agentic</h2>
            </div>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {executions.length} eventos
            </span>
          </div>

          {loadingMandates ? (
            <div className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4">
              Cargando historial de ejecuciones...
            </div>
          ) : executions.length === 0 ? (
            <div className="text-sm text-gray-400 bg-gray-50 rounded-xl p-4">
              Todavía no se ejecutó ninguna recompra automática.
            </div>
          ) : (
            <div className="space-y-3">
              {executions.slice(0, 3).map((execution) => (
                <div key={execution.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {execution.status === 'payment_required'
                        ? 'Pago requerido'
                        : execution.status === 'failed'
                        ? 'Fuera de presupuesto'
                        : 'Recomendación lista'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(execution.executed_at).toLocaleString('es-AR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {execution.recomendaciones.length} lotes sugeridos por el agente.
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Costo estimado</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrecio(execution.total_estimado)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-500">Pago</span>
                    <span className="font-semibold text-brand-600">
                      {execution.payment_status}
                    </span>
                  </div>
                  {execution.status === 'paid' && (
                    <p className="text-xs text-green-600 mt-2">
                      x402 completado: la ejecucion ya supero el paso de autorizacion de pago.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Crear mandato
            </p>
            <h2 className="font-bold text-gray-900 mt-1">
              Configurá una nueva recompra automática
            </h2>
          </div>
          <span className="text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full">
            {compradorActual?.nombre ?? selectedBuyerId}
          </span>
        </div>

        <form onSubmit={handleCreateMandate} className="space-y-5">
          <div className="grid lg:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frecuencia
              </label>
              <select
                value={mandateForm.frecuencia}
                onChange={(e) =>
                  setMandateForm((current) => ({
                    ...current,
                    frecuencia: e.target.value as FrecuenciaMandato,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                {FRECUENCIAS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Presupuesto máximo
              </label>
              <input
                type="number"
                min={1}
                value={mandateForm.presupuesto_maximo}
                onChange={(e) =>
                  setMandateForm((current) => ({
                    ...current,
                    presupuesto_maximo: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="90000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Próxima ejecución
              </label>
              <input
                type="datetime-local"
                value={mandateForm.proxima_ejecucion}
                onChange={(e) =>
                  setMandateForm((current) => ({
                    ...current,
                    proxima_ejecucion: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ventana de entrega
              </label>
              <input
                type="text"
                value={mandateForm.ventana_entrega}
                onChange={(e) =>
                  setMandateForm((current) => ({
                    ...current,
                    ventana_entrega: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="06:00-09:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Productos objetivo
              </label>
              <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 min-h-28">
                {loadingReferenceData ? (
                  <p className="text-sm text-gray-400">
                    Cargando catálogo para el mandato...
                  </p>
                ) : productosDisponibles.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    Elegí al menos una categoría para ver productos sugeridos.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {productosDisponibles.map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() => toggleProductoObjetivo(producto.id)}
                        className={clsx(
                          'px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                          mandateForm.productos_objetivo.includes(producto.id)
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                        )}
                      >
                        {producto.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Seleccioná los productos que querés priorizar en la recompra.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor fallback
              </label>
              <select
                value={mandateForm.proveedor_fallback_id}
                onChange={(e) =>
                  setMandateForm((current) => ({
                    ...current,
                    proveedor_fallback_id: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                disabled={loadingReferenceData}
              >
                <option value="">Sin fallback fijo</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorías prioritarias
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleCategory(option.value)}
                  className={clsx(
                    'px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                    mandateForm.categorias_prioritarias.includes(option.value)
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={mandateForm.permitir_sustituciones}
                onChange={(e) =>
                  setMandateForm((current) => ({
                    ...current,
                    permitir_sustituciones: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-300"
              />
              Permitir sustituciones sugeridas por IA
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={mandateForm.x402_enabled}
                onChange={(e) =>
                  setMandateForm((current) => ({
                    ...current,
                    x402_enabled: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-300"
              />
              Activar pago programático x402
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
            <div>
              <p className="text-sm text-gray-500">
                El mandato se crea activo para el comprador seleccionado y aparece arriba para simular la próxima recompra.
              </p>
              {mandateFeedback && (
                <p className="text-sm text-brand-600 mt-1">{mandateFeedback}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={
                creatingMandate ||
                loadingReferenceData ||
                mandateForm.categorias_prioritarias.length === 0
              }
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
            >
              <Plus size={16} />
              {creatingMandate ? 'Creando...' : 'Crear mandato'}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de órdenes */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">
            {vista === 'comprador' ? 'Mis pedidos' : 'Órdenes recibidas'}
          </h2>
          <Link
            href="/chat"
            className="text-sm text-brand-600 font-medium hover:text-brand-700"
          >
            + Nuevo pedido
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : ordenes.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Package size={36} className="mx-auto mb-3 text-gray-200" />
            <p className="font-medium">Sin pedidos aún</p>
            <p className="text-sm mt-1">
              Hacé tu primer pedido desde el{' '}
              <Link href="/chat" className="text-brand-600 font-medium">
                chat con IA
              </Link>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ordenes.map((orden) => {
              const estadoConf = ESTADO_CONFIG[orden.estado] ?? ESTADO_CONFIG.pendiente;
              return (
                <div key={orden.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs text-gray-400">
                          #{orden.id}
                        </span>
                        <span
                          className={clsx(
                            'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                            estadoConf.color
                          )}
                        >
                          {estadoConf.icon}
                          {estadoConf.label}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1 mb-3">
                        {orden.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-1.5 h-1.5 bg-brand-400 rounded-full" />
                            <span>
                              {item.cantidad}× {item.producto_nombre}
                            </span>
                            <span className="text-gray-400 text-xs">
                              — {item.proveedor_nombre}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Truck size={12} />
                          Entrega: {new Date(orden.fecha_entrega + 'T00:00:00').toLocaleDateString('es-AR')}
                        </span>
                        {orden.notas && (
                          <span className="text-gray-400 italic truncate max-w-xs">
                            {orden.notas}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-extrabold text-brand-600 text-lg">
                        {formatPrecio(orden.total)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(orden.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            href: '/chat',
            label: 'Hacer pedido por IA',
            desc: 'Pedido en lenguaje natural',
            icon: '🤖',
          },
          {
            href: '/',
            label: 'Ver catálogo',
            desc: 'Explorar lotes disponibles',
            icon: '🏪',
          },
          {
            href: '/proveedor',
            label: 'Publicar lote',
            desc: 'Cargá tu oferta de hoy',
            icon: '📦',
          },
        ].map(({ href, label, desc, icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-gray-200 hover:border-brand-300 rounded-2xl p-5 flex items-center gap-4 transition-colors group"
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-semibold text-sm text-gray-900 group-hover:text-brand-700 transition-colors">
                {label}
              </p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
