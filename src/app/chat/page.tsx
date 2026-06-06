'use client';

import { useState, useRef, useEffect } from 'react';
import { BuyerProfile, ChatMensaje, MatchResult } from '@/types';
import LoteCard from '@/components/LoteCard';
import {
  Send,
  Bot,
  User,
  Loader2,
  ShoppingCart,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';

const EJEMPLOS = [
  'Necesito 8 cajas de medialunas, 10 kg de tomate y 5 kg de queso crema para mañana',
  'Quiero 20 kg de harina 0000 y 10 kg de manteca para el jueves',
  'Necesito café molido premium 5 kg y 200 vasos descartables',
];

const MENSAJE_BIENVENIDA: ChatMensaje = {
  role: 'assistant',
  content:
    '¡Hola! Soy **Enmasa AI**, tu asistente de compras mayoristas 🛒\n\nContame qué necesitás y te busco las mejores opciones de proveedores. Podés escribirlo como si fuera un mensaje de WhatsApp:\n\n_"Necesito 10 kg de tomate, 5 kg de queso y 100 medialunas para mañana"_',
  timestamp: new Date().toISOString(),
};

interface ChatState {
  mensajes: ChatMensaje[];
  matches: MatchResult[];
  itemsExtraidos: { nombre: string; cantidad: number }[];
  loadingMatching: boolean;
  seleccionados: Record<string, { lote_id: string; cantidad: number }>;
}

interface RecommendationState {
  profile?: BuyerProfile;
  recomendaciones: MatchResult[];
  resumen: string;
  loading: boolean;
}

export default function ChatPage() {
  const [state, setState] = useState<ChatState>({
    mensajes: [MENSAJE_BIENVENIDA],
    matches: [],
    itemsExtraidos: [],
    loadingMatching: false,
    seleccionados: {},
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendationState, setRecommendationState] = useState<RecommendationState>({
    recomendaciones: [],
    resumen: '',
    loading: true,
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.mensajes]);

  useEffect(() => {
    fetch('/api/recommendations?buyer_id=buyer-1')
      .then((res) => res.json())
      .then((data) => {
        setRecommendationState({
          profile: data.profile,
          recomendaciones: data.recomendaciones ?? [],
          resumen: data.resumen ?? '',
          loading: false,
        });
      })
      .catch(() => {
        setRecommendationState({
          recomendaciones: [],
          resumen: '',
          loading: false,
        });
      });
  }, []);

  const enviarMensaje = async (texto: string) => {
    if (!texto.trim() || loading) return;

    const nuevoMensaje: ChatMensaje = {
      role: 'user',
      content: texto,
      timestamp: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      mensajes: [...s.mensajes, nuevoMensaje],
      matches: [],
    }));
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: texto,
          historial: state.mensajes,
          buyer_id: 'buyer-1',
        }),
      });

      const data = await res.json();

      const respuesta: ChatMensaje = {
        role: 'assistant',
        content: data.respuesta,
        timestamp: new Date().toISOString(),
      };

      setState((s) => ({
        ...s,
        mensajes: [...s.mensajes, respuesta],
        matches: data.matches ?? [],
        itemsExtraidos: data.items ?? [],
        loadingMatching: false,
      }));
    } catch {
      setState((s) => ({
        ...s,
        mensajes: [
          ...s.mensajes,
          {
            role: 'assistant',
            content:
              'Ocurrió un error procesando tu pedido. Por favor intentá de nuevo.',
            timestamp: new Date().toISOString(),
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje(input);
    }
  };

  const toggleSeleccionado = (loteId: string, cantidadDefault: number) => {
    setState((s) => {
      const nuevo = { ...s.seleccionados };
      if (nuevo[loteId]) {
        delete nuevo[loteId];
      } else {
        nuevo[loteId] = { lote_id: loteId, cantidad: cantidadDefault };
      }
      return { ...s, seleccionados: nuevo };
    });
  };

  const updateCantidad = (loteId: string, cantidad: number) => {
    setState((s) => ({
      ...s,
      seleccionados: {
        ...s.seleccionados,
        [loteId]: { ...s.seleccionados[loteId], cantidad },
      },
    }));
  };

  const seleccionadosArr = Object.values(state.seleccionados);

  const renderMensaje = (msg: ChatMensaje, i: number) => {
    const isUser = msg.role === 'user';
    return (
      <div
        key={i}
        className={clsx(
          'flex gap-3 animate-fade-in',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        <div
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
            isUser ? 'bg-brand-500' : 'bg-gray-800'
          )}
        >
          {isUser ? (
            <User size={16} className="text-white" />
          ) : (
            <Bot size={16} className="text-white" />
          )}
        </div>
        <div
          className={clsx(
            'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-brand-500 text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
          )}
          dangerouslySetInnerHTML={{
            __html: msg.content
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/_(.*?)_/g, '<em>$1</em>')
              .replace(/\n/g, '<br/>'),
          }}
        />
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
        {/* Panel chat */}
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Enmasa AI</h2>
              <p className="text-xs text-gray-500">
                Asistente de compras mayoristas
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-dot" />
              Activo
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {state.mensajes.map(renderMensaje)}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-brand-500" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Ejemplos rápidos */}
          {state.mensajes.length <= 1 && (
            <div className="px-5 pb-3">
              <p className="text-xs text-gray-400 mb-2">Ejemplos rápidos:</p>
              <div className="flex flex-col gap-1.5">
                {EJEMPLOS.map((ej, i) => (
                  <button
                    key={i}
                    onClick={() => enviarMensaje(ej)}
                    className="text-left text-xs text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg px-3 py-2 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronRight size={12} />
                    {ej}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-gray-100">
            <div className="flex gap-2 items-end bg-gray-50 border border-gray-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-brand-300 focus-within:border-brand-400 transition-all">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí tu pedido en lenguaje natural... (Enter para enviar)"
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none"
              />
              <button
                onClick={() => enviarMensaje(input)}
                disabled={!input.trim() || loading}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              Enter para enviar · Shift+Enter para salto de línea
            </p>
          </div>
        </div>

        {/* Panel resultados matching */}
        <div className="lg:w-96 flex flex-col gap-4">
          {recommendationState.loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-sm text-gray-400">
              Analizando tu perfil de compra...
            </div>
          ) : recommendationState.recomendaciones.length > 0 ? (
            <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    Recomendado para tu negocio
                  </p>
                  <h3 className="font-bold text-gray-900 mt-1">
                    {recommendationState.profile?.buyer_nombre}
                  </h3>
                </div>
                <span className="text-[11px] bg-white text-gray-600 border border-gray-200 px-2 py-1 rounded-full">
                  IA agentic
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {recommendationState.resumen}
              </p>

              <div className="space-y-3">
                {recommendationState.recomendaciones.map((match) => (
                  <div key={match.lote.id} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold text-brand-700">
                        {match.razon}
                      </span>
                      {typeof match.confidence === 'number' && (
                        <span className="text-[11px] text-gray-500">
                          Confianza {match.confidence}%
                        </span>
                      )}
                    </div>
                    {match.razon_extendida && (
                      <p className="text-xs text-gray-500 mb-3">
                        {match.razon_extendida}
                      </p>
                    )}
                    <LoteCard
                      lote={match.lote}
                      seleccionado={!!state.seleccionados[match.lote.id]}
                      cantidad={
                        state.seleccionados[match.lote.id]?.cantidad ??
                        match.lote.compra_minima
                      }
                      onSeleccionar={(l) => toggleSeleccionado(l.id, l.compra_minima)}
                      onCantidadChange={(c) => updateCantidad(match.lote.id, c)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {state.matches.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">
                  Opciones recomendadas
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {state.matches.length} resultados
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {state.matches.map((match) => (
                  <div key={match.lote.id} className="animate-fade-in">
                    <div className="flex items-center justify-between mb-1 px-1">
                      <span className="text-xs font-medium text-brand-600">
                        {match.razon}
                      </span>
                    </div>
                    <LoteCard
                      lote={match.lote}
                      seleccionado={!!state.seleccionados[match.lote.id]}
                      cantidad={
                        state.seleccionados[match.lote.id]?.cantidad ??
                        match.lote.compra_minima
                      }
                      onSeleccionar={(l) =>
                        toggleSeleccionado(l.id, l.compra_minima)
                      }
                      onCantidadChange={(c) =>
                        updateCantidad(match.lote.id, c)
                      }
                    />
                  </div>
                ))}
              </div>

              {seleccionadosArr.length > 0 && (
                <Link
                  href={`/orden?items=${encodeURIComponent(
                    JSON.stringify(seleccionadosArr)
                  )}`}
                  className="flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
                >
                  <ShoppingCart size={18} />
                  Confirmar orden ({seleccionadosArr.length} lotes)
                </Link>
              )}
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-400">
              <Sparkles size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="font-medium text-sm">Aquí aparecerán</p>
              <p className="text-sm">las opciones recomendadas por conversación</p>
              <p className="text-xs mt-2">
                Mandá tu pedido por el chat para ver el matching
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
