import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Sparkles, ShoppingBag } from 'lucide-react';
import { BannerSettings } from '../types';

interface HeroBannerProps {
  settings: BannerSettings;
  onExplore: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ settings, onExplore }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#111117] via-[#0d0d12] to-[#0a0a0c] border-b border-zinc-800/80">
      {/* Background Decorative Layer */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <img
          src={settings.backgroundImage || './images/hero_tech_oferta.jpg'}
          alt="Tech Oferta Destaques"
          className="w-full h-full object-cover object-center filter saturate-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-[#0a0a0c]/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-24">
        <div className="max-w-3xl space-y-6">
          
          {/* Campaign badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-amber-400" />
            <span>{settings.campaignBadge || 'OFERTAS VERIFICADAS MERCADO LIVRE'}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.1] font-display text-balance">
            {settings.headline}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-zinc-300 font-normal leading-relaxed max-w-2xl">
            {settings.subheadline}
          </p>

          {/* Slogan pill */}
          <div className="text-xs sm:text-sm font-semibold text-zinc-400 border-l-2 border-amber-400 pl-3">
            <span className="text-amber-400 font-bold">TECH OFERTA:</span> A tecnologia que você quer, pelo preço que você procura.
          </div>

          {/* Action CTA */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onExplore}
              className="px-8 py-3.5 text-sm sm:text-base font-extrabold text-zinc-950 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-lg shadow-lg shadow-amber-400/25 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <span>{settings.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#mais-vendidos"
              className="px-6 py-3.5 text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg transition-colors flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Ver Mais Vendidos</span>
            </a>
          </div>

          {/* Trust Strip */}
          <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-zinc-400 text-xs font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Links 100% Verificados</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Preços Atualizados</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Descontos Reais</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold shrink-0">ML</span>
              <span>Compra Segura Mercado Livre</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
