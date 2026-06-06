'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoteCard from '@/components/LoteCard';
import { useCarrito } from '@/hooks/useCarrito';
import { Lote, CategoriaProducto } from '@/types';
import {
  Search,
  MessageSquare,
  TrendingDown,
  Zap,
  Package,
  SlidersHorizontal,
} from 'lucide-react';
import clsx from 'clsx';

const CATEGORIAS: { value: CategoriaProducto | ''; label: string; emoji: string }[] = [
  { value: '', label: 'Todos', emoji: '🏪' },
  { value: 'panificados', label: 'Panificados', emoji: '🥐' },
  { value: 'lacteos', label: 'Lácteos', emoji: '🧀' },
  { value: 'frescos_verdura', label: 'Verduras', emoji: '🥬' },
  { value: 'frescos_carne', label: 'Carnes', emoji: '🥩' },
  { value: 'bebidas', label: 'Bebidas', emoji: '🥤' },
  { value: 'cafe_infusiones', label: 'Café', emoji: '☕' },
  { value: 'descartables', label: 'Descartables', emoji: '🥡' },
  { value: 'secos', label: 'Secos', emoji: '🌾' },
];

const FILTROS_URGENCIA = [
  { value: '', label: 'Todos', icon: Package },
  { value: 'urgente', label: 'Urgentes', icon: Zap },
  { value: 'excedente', label: 'Excedentes', icon: TrendingDown },
];

export default function HomePage() {
  const { items, agregarItem, actualizarCantidad } = useCarrito();
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProducto | ''>('');
  const [filtroUrgencia, setFiltroUrgencia] = useState('');

  useEffect(() => {
    fetch('/api/lotes')
      .then((r) => r.json())
      .then((data) => setLotes(data))
      .finally(() => setLoading(false));
  }, []);

  const lotesFiltrados = lotes.filter((l) => {
    const matchBusqueda =
      !busqueda ||
      l.producto?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.proveedor?.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !categoria || l.producto?.categoria === categoria;
    const matchUrgencia = !filtroUrgencia || l.urgencia === filtroUrgencia;
    return matchBusqueda && matchCategoria && matchUrgencia;
  });

  const lotesExcedentes = lotes.filter(
    (l) => l.urgencia === 'excedente' || l.urgencia === 'urgente'
  );

  const getItemCarrito = (loteId: string) =>
    items.find((item) => item.lote.id === loteId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="mb-10">
        <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_80%_50%,_white_0%,_transparent_60%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-3 py-1 text-sm font-medium mb-4">
              <Zap size={14} />
              IA agentic para abastecimiento gastronomico
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              La IA que entiende tu negocio,<br />
              <span className="text-brand-100">elige proveedores y activa recompra</span>
            </h1>
            <p className="text-brand-100 text-lg mb-6 max-w-xl">
              En Masa pasa de marketplace a sistema operativo de compras: interpreta pedidos,
              recomienda proveedores segun el perfil del local y ejecuta reposiciones con un
              paso de pago programatico listo para x402.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
              >
                <MessageSquare size={18} />
                Ver agente en accion
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-brand-600 border border-brand-400 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-700 transition-colors"
              >
                <Package size={18} />
                Explorar dashboard agentic
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-4 gap-4 mb-10">
        {[
          {
            title: 'Impacto medible',
            text: 'Reduce quiebres de stock y tiempo operativo en compras repetitivas.',
          },
          {
            title: 'IA en el core',
            text: 'El agente perfila al comprador, recomienda proveedores y explica decisiones.',
          },
          {
            title: 'Recompra ejecutable',
            text: 'Los mandatos convierten sugerencias en una proxima orden automatizable.',
          },
          {
            title: 'Pago programatico',
            text: 'La demo ya muestra el paso HTTP 402 para ejecuciones agentic con x402.',
          },
        ].map((item) => (
          <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-900 mb-2">{item.title}</p>
            <p className="text-sm text-gray-500">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Lotes activos', value: lotes.length.toString() },
          { label: 'Proveedores activos', value: '8' },
          { label: 'Excedentes detectados hoy', value: lotesExcedentes.length.toString() },
          { label: 'Flujos del MVP', value: '4' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-extrabold text-brand-600">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Excedentes destacados */}
      {lotesExcedentes.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingDown className="text-amber-500" size={22} />
              Oportunidades detectadas para bajar costo hoy
            </h2>
            <span className="text-xs bg-amber-100 text-amber-700 font-medium px-3 py-1 rounded-full">
              Impacto inmediato
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            La plataforma destaca lotes urgentes y excedentes para transformar stock ocioso
            en abastecimiento accesible para negocios gastronomicos.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lotesExcedentes.slice(0, 3).map((lote) => (
              <LoteCard
                key={lote.id}
                lote={lote}
                onSeleccionar={() => agregarItem(lote)}
                seleccionado={!!getItemCarrito(lote.id)}
                cantidad={getItemCarrito(lote.id)?.cantidad ?? lote.compra_minima}
                onCantidadChange={(cantidad) => actualizarCantidad(lote.id, cantidad)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Catálogo */}
      <section id="catalogo">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-gray-500" />
            Oferta que la IA puede convertir en orden
          </h2>
          <span className="text-sm text-gray-500">
            {lotesFiltrados.length} oportunidades activas
          </span>
        </div>

        {/* Filtros */}
        <div className="space-y-3 mb-6">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscá insumos, marcas o proveedores para simular una compra real"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
            />
          </div>
          <p className="text-xs text-gray-500">
            También podés saltarte esta búsqueda y pedir directo en lenguaje natural desde el chat.
          </p>

          {/* Categorías */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIAS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setCategoria(value as CategoriaProducto | '')}
                className={clsx(
                  'flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                  categoria === value
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                )}
              >
                <span>{emoji}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Urgencia */}
          <div className="flex gap-2">
            {FILTROS_URGENCIA.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setFiltroUrgencia(value)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  filtroUrgencia === value
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de lotes */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
            ))}
          </div>
        ) : lotesFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Package size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No encontramos una combinación disponible para esa búsqueda</p>
            <p className="text-sm mt-1">Probá otra categoría o usá el chat con IA para describir tu pedido completo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lotesFiltrados.map((lote) => (
              <LoteCard
                key={lote.id}
                lote={lote}
                onSeleccionar={() => agregarItem(lote)}
                seleccionado={!!getItemCarrito(lote.id)}
                cantidad={getItemCarrito(lote.id)?.cantidad ?? lote.compra_minima}
                onCantidadChange={(cantidad) => actualizarCantidad(lote.id, cantidad)}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA final */}
      <div className="mt-12 bg-gray-900 rounded-2xl p-8 text-center text-white">
        <h3 className="text-xl font-bold mb-2">¿Sos proveedor con stock, excedentes o capacidad ociosa?</h3>
        <p className="text-gray-400 mb-4 text-sm">
          Sumate al MVP y convertí inventario inmovilizado en ventas B2B más rápidas. En Masa te conecta con demanda real y pedidos mejor estructurados por IA.
        </p>
        <Link
          href="/proveedor"
          className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Publicar stock para vender hoy
        </Link>
      </div>
    </div>
  );
}
