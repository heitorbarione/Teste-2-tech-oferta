import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Share2, 
  ShieldCheck, 
  Truck, 
  Calendar, 
  CheckCircle, 
  Tag, 
  ChevronRight,
  Info
} from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onShare?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  allProducts,
  onSelectProduct,
  onShare,
}) => {
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleShareWhatsApp = () => {
    let msg = `🔥 *OFERTA NO TECH OFERTA!*\n\n`;
    msg += `📦 *${product.name}*\n`;
    msg += `🏷️ Marca: ${product.brand}\n`;
    if (product.prevPrice && product.prevPrice > product.price) {
      msg += `💰 De: ~R$ ${formatBRL(product.prevPrice)}~\n`;
      msg += `⚡ *Por apenas: R$ ${formatBRL(product.price)}*`;
      if (product.discountPercent) {
        msg += ` (${product.discountPercent}% OFF)\n\n`;
      } else {
        msg += `\n\n`;
      }
    } else {
      msg += `💰 *Preço: R$ ${formatBRL(product.price)}*\n\n`;
    }
    const currentUrl = `${window.location.origin}/#produto-${product.id}`;
    msg += `👉 *Confira a oferta oficial no Mercado Livre:*\n${currentUrl}\n\n`;
    msg += `_Preço verificado em ${product.updatedAt}. Sujeito a alteração pelo vendedor._`;

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBuyOnMercadoLivre = () => {
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer,nofollow');
  };

  // Find related products in same category
  const related = allProducts
    .filter(p => p.id !== product.id && p.category === product.category && p.isActive)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-[#121218] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0f0f14]">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-amber-400 font-bold uppercase">{product.brand}</span>
            <span>/</span>
            <span className="capitalize">{product.category.replace(/-/g, ' ')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Main Product Info Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Product Image Stage */}
            <div className="relative bg-[#181822] border border-zinc-800 rounded-xl p-6 flex items-center justify-center min-h-[300px] sm:min-h-[380px]">
              {product.discountPercent && product.discountPercent > 0 && (
                <div className="absolute top-3 left-3 px-3 py-1 bg-amber-400 text-zinc-950 font-black text-sm rounded shadow-md">
                  {product.discountPercent}% OFF
                </div>
              )}

              {!imageError ? (
                <img
                  src={product.image}
                  alt={product.name}
                  onError={() => setImageError(true)}
                  referrerPolicy="no-referrer"
                  className="max-h-[320px] w-auto max-w-full object-contain rounded drop-shadow-xl"
                />
              ) : (
                <div className="text-center p-6 text-zinc-400">
                  <Tag className="w-12 h-12 mx-auto text-amber-400 mb-2" />
                  <p className="font-semibold">{product.brand}</p>
                  <p className="text-xs text-zinc-500">{product.name}</p>
                </div>
              )}
            </div>

            {/* Product Purchase Column */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                  <span className="text-amber-400 font-bold uppercase tracking-wider">{product.brand}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    Atualizado em {product.updatedAt}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                  {product.name}
                </h1>
              </div>

              {/* Price Box */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
                {product.prevPrice && product.prevPrice > product.price ? (
                  <div className="text-sm text-zinc-400 flex items-center gap-2">
                    <span>De: </span>
                    <span className="line-through tabular-nums text-zinc-400">
                      R$ {formatBRL(product.prevPrice)}
                    </span>
                    {product.discountPercent && (
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                        Economize R$ {formatBRL(product.prevPrice - product.price)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Melhor preço verificado no Mercado Livre</span>
                  </div>
                )}

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xs text-zinc-400 font-semibold uppercase">Por apenas:</span>
                  <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight tabular-nums">
                    R$ {formatBRL(product.price)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 pt-1">
                  * Em até 10x ou 12x sem juros no Mercado Livre conforme disponibilidade do anúncio.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="w-full py-4 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-zinc-950 font-black text-sm uppercase tracking-wide transition-all shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2.5 cursor-pointer text-center"
                >
                  <span>COMPRAR NO MERCADO LIVRE</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => {
                    if (onShare) onShare(product);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-emerald-600/90 hover:text-white text-emerald-400 font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer border border-zinc-700/80"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartilhar Esta Oferta (WhatsApp / Link)</span>
                </button>
              </div>

              {/* Mercado Livre Purchase Trust Guarantee */}
              <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Compra Garantida pelo Mercado Livre</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Você será redirecionado para a página oficial do produto no Mercado Livre através de nosso link de afiliado. A compra é 100% segura, processada pelo Mercado Pago com proteção total ao comprador e entrega rápida.
                </p>
              </div>

            </div>
          </div>

          {/* Description & Technical Specifications */}
          <div className="border-t border-zinc-800/80 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <span>Descrição do Produto</span>
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
              <div className="p-3 rounded bg-zinc-900 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Aviso: </span>
                Os preços e estoques dos produtos no Mercado Livre são dinâmicos e podem sofrer alterações a qualquer momento pelo vendedor.
              </div>
            </div>

            {/* Technical Specs */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Características e Especificações Técnicas</span>
              </h3>
              {product.specs && product.specs.length > 0 ? (
                <ul className="space-y-2 text-xs text-zinc-300">
                  {product.specs.map((spec, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 rounded bg-zinc-900/60 border border-zinc-800/50">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-zinc-500">Consulte mais detalhes no anúncio oficial.</p>
              )}
            </div>

          </div>

          {/* Related Products Section */}
          {related.length > 0 && (
            <div className="border-t border-zinc-800/80 pt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">
                  Ofertas Relacionadas na Categoria
                </h3>
                <span className="text-xs text-zinc-400">Mesma categoria</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectProduct(rel)}
                    className="p-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-3 cursor-pointer group"
                  >
                    <img
                      src={rel.image}
                      alt={rel.name}
                      className="w-12 h-12 object-contain bg-white rounded p-1 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-zinc-200 truncate group-hover:text-amber-400">
                        {rel.name}
                      </div>
                      <div className="text-xs font-black text-amber-400 mt-0.5 tabular-nums">
                        R$ {formatBRL(rel.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
