import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Enmasa — Abastecimiento B2B Gastronómico',
  description:
    'Marketplace inteligente de abastecimiento mayorista para gastronomía. Catálogo de lotes, IA de compras y matching de proveedores.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
