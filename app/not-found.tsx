import Link from 'next/link';
import { Sparkles, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">404</h1>
        <h2 className="text-xl font-bold text-slate-200">Страница не найдена</h2>
        <p className="text-sm text-slate-400">
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>На главную</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
