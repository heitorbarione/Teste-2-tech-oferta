import React from 'react';
import { X, Calendar, Clock, Share2, Tag, ArrowRight, ExternalLink } from 'lucide-react';
import { Article, Product } from '../types';

interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  onClose,
  allProducts,
  onSelectProduct,
}) => {
  if (!article) return null;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📚 *${article.title}*\n\nConfira as melhores dicas e produtos no Tech Oferta:\n${window.location.origin}/#artigo-${article.id}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#121218] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0f0f14]">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-amber-400 font-bold uppercase">{article.category}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* Cover Image */}
          <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-900 border border-zinc-800">
            <img
              src={article.image}
              alt={article.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Meta & Title */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                Publicado em {article.date} · Equipe Editorial Tech Oferta
              </span>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`📚 *${article.title}*\n\nConfira as melhores dicas no Tech Oferta:\n${window.location.origin}/#artigo-${article.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar</span>
              </a>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight font-display">
              {article.title}
            </h1>

            {/* Introduction Lead */}
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-normal bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
              {article.summary}
            </p>
          </div>

          {/* Article Sub-sections */}
          <div className="space-y-8 pt-4">
            {article.content.map((block, idx) => {
              // Recommended products in this block
              const recProducts = block.recommendedProductIds 
                ? allProducts.filter(p => block.recommendedProductIds?.includes(p.id) && p.isActive)
                : [];

              return (
                <div key={idx} className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-bold text-amber-300">
                    {block.subtitle}
                  </h2>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                    {block.text}
                  </p>

                  {/* Embedded Recommended Products */}
                  {recProducts.length > 0 && (
                    <div className="mt-4 p-4 rounded-xl bg-zinc-950/80 border border-amber-400/30 space-y-3">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Produtos Recomendados em Oferta</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {recProducts.map(p => (
                          <div
                            key={p.id}
                            className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-3"
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 object-contain bg-white rounded p-1 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                              <div className="text-xs font-black text-amber-400 tabular-nums">
                                R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                onClose();
                                onSelectProduct(p);
                              }}
                              className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-[11px] shrink-0 cursor-pointer"
                            >
                              Ver Oferta
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* SEO Keywords tags */}
          {article.keywords && article.keywords.length > 0 && (
            <div className="pt-6 border-t border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-400">Assuntos relacionados:</span>
              <div className="flex flex-wrap gap-1.5">
                {article.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Affiliate transparency footer within article */}
          <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-[11px] text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-300">Nota de transparência: </span>
            O Tech Oferta analisa produtos de forma independente. Ao comprar através dos links recomendados em nossos artigos, recebemos uma comissão sem qualquer acréscimo de valor para você.
          </div>

        </div>
      </div>
    </div>
  );
};
