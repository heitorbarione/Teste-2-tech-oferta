import React, { useState } from 'react';
import { ExternalLink, Share2, Tag, Calendar, Eye, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onShare?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onShare }) => {
  const [imageError, setImageError] = useState(false);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
      onShare(product);
    } else {
      let msg = `🔥 *OFERTA NO TECH OFERTA!*\n\n${product.name}\nPreço: R$ ${formatBRL(product.price)}\n${window.location.origin}/#produto-${product.id}`;
      window.location.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    }
  };

  return (
    <div 
      onClick={() => onSelect(product)}
      className="group relative bg-[#131318] hover:bg-[#181820] border border-zinc-800/90 hover:border-amber-400/50 rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between cursor-pointer shadow-md hover:shadow-xl hover:shadow-black/60"
    >
      {/* Top badges (special offer / best seller / discount) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5">
          {product.discountPercent && product.discountPercent > 0 ? (
            <span className="px-2 py-0.5 rounded bg-amber-400 text-zinc-950 font-black text-xs tracking-tight shadow-sm">
              -{product.discountPercent}% OFF
            </span>
          ) : null}

          {product.isSpecialOffer && (
            <span className="px-2 py-0.5 rounded bg-rose-600/90 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
              Oferta Especial
            </span>
          )}

          {product.isBestSeller && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-semibold text-[10px] uppercase tracking-wider">
              Mais Vendido
            </span>
          )}
        </div>

        {/* WhatsApp Quick Share Button */}
        <button
          onClick={handleShareClick}
          className="pointer-events-auto p-1.5 rounded-full bg-zinc-900/80 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors border border-zinc-700/80 shadow-md cursor-pointer"
          title="Compartilhar oferta"
          aria-label="Compartilhar oferta"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Product Image Area */}
      <div className="relative w-full pt-[75%] bg-[#1a1a22] overflow-hidden flex items-center justify-center p-4">
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-zinc-900">
            <Tag className="w-8 h-8 text-amber-400/60 mb-1" />
            <span className="text-xs text-zinc-400 font-medium">{product.brand}</span>
            <span className="text-[11px] text-zinc-500 truncate max-w-full">{product.name}</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Brand & Update Date */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span className="font-bold text-amber-400/90 tracking-wider uppercase">{product.brand}</span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Calendar className="w-3 h-3" />
              {product.updatedAt}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-semibold text-sm text-zinc-100 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
            {product.name}
          </h3>

          {/* Brief Description */}
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed font-normal">
            {product.description}
          </p>
        </div>

        {/* Pricing Section */}
        <div className="pt-2 border-t border-zinc-800/80">
          {product.prevPrice && product.prevPrice > product.price ? (
            <div className="text-xs text-zinc-400">
              <span>De: </span>
              <span className="line-through tabular-nums">R$ {formatBRL(product.prevPrice)}</span>
            </div>
          ) : (
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Preço confirmado no Mercado Livre</span>
            </div>
          )}

          {/* Current Price */}
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xs text-zinc-300 font-medium">Por:</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight tabular-nums">
              R$ {formatBRL(product.price)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2 pt-1">
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
            className="w-full py-2.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-98 text-zinc-950 font-black text-xs uppercase tracking-wide transition-all shadow-md shadow-amber-400/15 flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <span>CONFERIR OFERTA</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="w-full py-1.5 px-2 rounded text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="w-3 h-3" />
            <span>Ver especificações e detalhes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
