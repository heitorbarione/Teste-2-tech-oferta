import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __TECH_OFERTA_MOUNTED__?: boolean;
  }
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'Erro inesperado ao carregar.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="px-3 py-1 rounded bg-amber-400 text-zinc-950 font-black text-xs uppercase">
            TECH OFERTA
          </div>
          <h1 className="text-xl font-bold text-white">Ops! Ocorreu um erro ao carregar o portal.</h1>
          <p className="text-xs text-zinc-400 max-w-md">{this.state.errorMessage}</p>
          <button
            onClick={() => {
              try {
                localStorage.clear();
              } catch {
                // ignore
              }
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-lg bg-amber-400 text-zinc-950 font-bold text-xs uppercase cursor-pointer"
          >
            Limpar Cache e Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

window.__TECH_OFERTA_MOUNTED__ = true;

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
