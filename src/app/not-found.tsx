import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <SearchX size={30} />
      </div>
      <h1 className="mb-2 text-3xl font-extrabold text-gray-900">
        Esta página no existe
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Volvé al catálogo para seguir armando tu pedido o publicar un lote.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
      >
        <ArrowLeft size={16} />
        Ir al catálogo
      </Link>
    </div>
  );
}
