'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCarrito } from '@/hooks/useCarrito';
import {
  ShoppingCart,
  MessageSquare,
  LayoutDashboard,
  PackagePlus,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

const navLinks = [
  { href: '/', label: 'Catálogo', icon: ShoppingCart },
  { href: '/chat', label: 'Pedir por IA', icon: MessageSquare },
  { href: '/proveedor', label: 'Publicar lote', icon: PackagePlus },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { cantidadItems, abrirCarrito } = useCarrito();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-extrabold text-xl">
          <span className="bg-brand-500 text-white px-2 py-0.5 rounded-md tracking-tight">
            en
          </span>
          <span className="text-gray-900 tracking-tight">masa</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={abrirCarrito}
            className="relative inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Abrir carrito"
          >
            <ShoppingCart size={17} />
            {cantidadItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {cantidadItems}
              </span>
            )}
          </button>

          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <MessageSquare size={16} />
            Hacer pedido
          </Link>
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={abrirCarrito}
            className="relative rounded-lg p-2 hover:bg-gray-100"
            aria-label="Abrir carrito"
          >
            <ShoppingCart size={18} />
            {cantidadItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {cantidadItems}
              </span>
            )}
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2 space-y-1">
          <button
            type="button"
            onClick={() => {
              abrirCarrito();
              setOpen(false);
            }}
            className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={16} />
              Ver carrito
            </span>
            {cantidadItems > 0 && (
              <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">
                {cantidadItems}
              </span>
            )}
          </button>

          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
