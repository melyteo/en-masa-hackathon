'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Lote } from '@/types';

export interface CarritoItem {
  lote: Lote;
  cantidad: number;
}

interface CarritoContextValue {
  items: CarritoItem[];
  isOpen: boolean;
  cantidadItems: number;
  total: number;
  agregarItem: (lote: Lote, cantidad?: number) => void;
  actualizarCantidad: (loteId: string, cantidad: number) => void;
  quitarItem: (loteId: string) => void;
  vaciarCarrito: () => void;
  abrirCarrito: () => void;
  cerrarCarrito: () => void;
}

const CarritoContext = createContext<CarritoContextValue | null>(null);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CarritoItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const agregarItem = (lote: Lote, cantidad = lote.compra_minima) => {
    setItems((prev) => {
      const existente = prev.find((item) => item.lote.id === lote.id);
      if (existente) {
        return prev.map((item) =>
          item.lote.id === lote.id
            ? {
                ...item,
                cantidad: Math.min(
                  lote.cantidad,
                  Math.max(cantidad, lote.compra_minima)
                ),
              }
            : item
        );
      }

      return [
        ...prev,
        {
          lote,
          cantidad: Math.min(lote.cantidad, Math.max(cantidad, lote.compra_minima)),
        },
      ];
    });
    setIsOpen(true);
  };

  const actualizarCantidad = (loteId: string, cantidad: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.lote.id !== loteId) return item;
        return {
          ...item,
          cantidad: Math.min(
            item.lote.cantidad,
            Math.max(cantidad || item.lote.compra_minima, item.lote.compra_minima)
          ),
        };
      })
    );
  };

  const quitarItem = (loteId: string) => {
    setItems((prev) => prev.filter((item) => item.lote.id !== loteId));
  };

  const vaciarCarrito = () => {
    setItems([]);
    setIsOpen(false);
  };

  const value = useMemo<CarritoContextValue>(() => {
    const cantidadItems = items.reduce((acc, item) => acc + item.cantidad, 0);
    const total = items.reduce(
      (acc, item) => acc + item.cantidad * item.lote.precio_unitario,
      0
    );

    return {
      items,
      isOpen,
      cantidadItems,
      total,
      agregarItem,
      actualizarCantidad,
      quitarItem,
      vaciarCarrito,
      abrirCarrito: () => setIsOpen(true),
      cerrarCarrito: () => setIsOpen(false),
    };
  }, [isOpen, items]);

  return (
    <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>
  );
}

export function useCarrito() {
  const context = useContext(CarritoContext);

  if (!context) {
    throw new Error('useCarrito debe usarse dentro de CarritoProvider');
  }

  return context;
}
