'use client';

import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import CarritoDrawer from '@/components/CarritoDrawer';
import { CarritoProvider } from '@/hooks/useCarrito';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <CarritoProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-gray-500">
          <span>
            © 2026 <strong className="text-brand-600">Enmasa</strong> — Hackathon Y-Hat
          </span>
          <span>Abastecimiento B2B inteligente para gastronomía</span>
        </div>
      </footer>
      <CarritoDrawer />
    </CarritoProvider>
  );
}
