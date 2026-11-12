import React from 'react';
import { Calendar, Clock, ArrowRight, BookOpen, Tag } from 'lucide-react';
import { Article } from '../types';

interface ArticlesSectionProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  showAll?: boolean;
  onViewAll?: () => void;
}

export const ArticlesSection: React.FC<ArticlesSectionProps> = ({
  articles,
  onSelectArticle,
  showAll = false,
  onViewAll,
}) => {
  const displayedArticles = showAll ? articles : articles.slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-xs tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guia de Compras & Conteúdo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Artigos e Dicas de Tecnologia
          </h2>
        </div>

        {!showAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Ver todos os {articles.length} artigos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayedArticles.map(article => (
          <article
            key={article.id}
            onClick={() => onSelectArticle(article)}
            className="group bg-[#121217] hover:bg-[#181822] border border-zinc-800/80 hover:border-amber-400/50 rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between cursor-pointer shadow-md hover:shadow-xl"
          >
            {/* Article Image */}
            <div className="relative pt-[56.25%] bg-zinc-900 overflow-hidden">
              <img
                src={article.image}
                alt={article.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 text-amber-400 font-semibold text-[11px]">
                {article.category}
              </div>
            </div>

            {/* Article Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {article.date}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>

                <h3 className="font-bold text-base text-zinc-100 group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                  {article.summary}
                </p>
              </div>

              {/* Read button */}
              <div className="pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:text-amber-300">
                <span>Ler artigo completo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
