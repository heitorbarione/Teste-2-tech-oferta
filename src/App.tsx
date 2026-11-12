import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, 
  Sparkles, 
  Tag, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  ExternalLink, 
  CheckCircle2 
} from 'lucide-react';
import { 
  getArticles, 
  getBannerSettings, 
  getProducts, 
  subscribeToStore,
  syncWithServer
} from './services/storageService';
import { ActiveView, Article, CategoryId, Product } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CategoryGrid } from './components/CategoryGrid';
import { CatalogView } from './components/CatalogView';
import { ArticlesSection } from './components/ArticlesSection';
import { ArticleDetailModal } from './components/ArticleDetailModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { InstitutionalModals } from './components/InstitutionalModals';
import { ShareModal } from './components/ShareModal';

export default function App() {
  // Navigation & View State
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data Store
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [articles, setArticles] = useState<Article[]>(getArticles());
  const [bannerSettings, setBannerSettings] = useState(getBannerSettings());

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetProduct, setShareTargetProduct] = useState<Product | null>(null);

  const handleOpenShare = (product?: Product | null) => {
    setShareTargetProduct(product || null);
    setIsShareModalOpen(true);
  };

  // Subscribe to real-time storage changes and sync with server
  useEffect(() => {
    syncWithServer();
    const unsubscribe = subscribeToStore(() => {
      setProducts(getProducts());
      setArticles(getArticles());
      setBannerSettings(getBannerSettings());
    });
    return () => unsubscribe();
  }, []);

  // Listen to hash changes for direct deep linking (e.g. #produto-xyz or #admin)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setIsAdminOpen(true);
      } else if (hash.startsWith('#produto-')) {
        const prodId = hash.replace('#produto-', '');
        const found = products.find(p => p.id === prodId);
        if (found) setSelectedProduct(found);
      } else if (hash.startsWith('#artigo-')) {
        const artId = hash.replace('#artigo-', '');
        const found = articles.find(a => a.id === artId);
        if (found) setSelectedArticle(found);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [products, articles]);

  // Curated collections for Homepage sections
  const imperdiveis = useMemo(() => {
    return products
      .filter(p => p.isActive && (p.isSpecialOffer || (p.discountPercent && p.discountPercent >= 20)))
      .slice(0, 4);
  }, [products]);

  const maisVendidos = useMemo(() => {
    return products
      .filter(p => p.isActive && (p.isBestSeller || p.isFeatured))
      .slice(0, 4);
  }, [products]);

  const ultimasOfertas = useMemo(() => {
    return products
      .filter(p => p.isActive)
      .slice(0, 8);
  }, [products]);

  const handleSelectCategory = (catId: CategoryId) => {
    setSelectedCategory(catId);
    setActiveView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: ActiveView, cat?: CategoryId | null) => {
    setActiveView(view);
    if (cat !== undefined) setSelectedCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      
      {/* 1. Navigation Header */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        allProducts={products}
        onSelectProduct={setSelectedProduct}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenShareModal={() => handleOpenShare(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* VIEW 1: HOME PAGE */}
        {activeView === 'home' && (
          <div className="space-y-16 sm:space-y-24 pb-20">
            
            {/* Hero Section */}
            <HeroBanner
              settings={bannerSettings}
              onExplore={() => {
                const el = document.getElementById('ofertas-imperdiveis');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 sm:space-y-24">
              
              {/* Section 1: Ofertas Imperdíveis */}
              <section id="ofertas-imperdiveis" className="space-y-6 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-xs tracking-wider">
                      <Zap className="w-4 h-4 fill-amber-400" />
                      <span>Descontos Confirmados</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                      Ofertas Imperdíveis
                    </h2>
                  </div>
                  <button
                    onClick={() => handleNavigate('catalog')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Ver todas as ofertas</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {imperdiveis.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setSelectedProduct}
                      onShare={handleOpenShare}
                    />
                  ))}
                </div>
              </section>

              {/* Section 2: Categorias Grid */}
              <section>
                <CategoryGrid
                  products={products}
                  onSelectCategory={handleSelectCategory}
                />
              </section>

              {/* Section 3: Mais Vendidos */}
              <section id="mais-vendidos" className="space-y-6 scroll-mt-24">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-xs tracking-wider">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>Preferidos dos Compradores</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                      Mais Vendidos no Mercado Livre
                    </h2>
                  </div>
                  <button
                    onClick={() => handleNavigate('catalog')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Explorar catálogo completo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {maisVendidos.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setSelectedProduct}
                      onShare={handleOpenShare}
                    />
                  ))}
                </div>
              </section>

              {/* Section 4: Grandes Promoções da Semana (Special Campaign Banner) */}
              <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-zinc-900 to-[#121218] border border-amber-400/40 p-6 sm:p-10 shadow-2xl">
                <div className="max-w-2xl space-y-4 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Campanha Especial Tech Oferta</span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight font-display">
                    GRANDES PROMOÇÕES: ELETRÔNICOS COM ATÉ 36% OFF
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Selecionamos os melhores fones bluetooth, notebooks de alto rendimento e smartwatches com garantia de menor preço histórico. Acesse agora pelo link de afiliado oficial.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4 items-center">
                    <button
                      onClick={() => handleNavigate('catalog')}
                      className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>Aproveitar Grandes Promoções</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Compra 100% Protegida</span>
                    </span>
                  </div>
                </div>
              </section>

              {/* Section 5: Últimas Ofertas Adicionadas */}
              <section className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-zinc-400 font-bold uppercase text-xs tracking-wider">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Cadastradas Recentemente</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                      Últimas Ofertas no Portal
                    </h2>
                  </div>
                  <button
                    onClick={() => handleNavigate('catalog')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Ver todas ({products.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {ultimasOfertas.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={setSelectedProduct}
                      onShare={handleOpenShare}
                    />
                  ))}
                </div>
              </section>

              {/* Section 6: Artigos e Dicas de Tecnologia */}
              <section className="pt-6 border-t border-zinc-800/80">
                <ArticlesSection
                  articles={articles}
                  onSelectArticle={setSelectedArticle}
                  showAll={false}
                  onViewAll={() => handleNavigate('articles')}
                />
              </section>

            </div>
          </div>
        )}

        {/* VIEW 2: FULL CATALOG OR CATEGORY VIEW */}
        {(activeView === 'catalog' || activeView === 'category') && (
          <CatalogView
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={cat => setSelectedCategory(cat)}
            onSelectProduct={setSelectedProduct}
            onShareProduct={handleOpenShare}
            initialSearchQuery={searchQuery}
          />
        )}

        {/* VIEW 3: ARTICLES DEDICATED PAGE */}
        {activeView === 'articles' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
            <ArticlesSection
              articles={articles}
              onSelectArticle={setSelectedArticle}
              showAll={true}
            />
          </div>
        )}

      </main>

      {/* 2. Institutional Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenShareModal={() => handleOpenShare(null)}
      />

      {/* ---------------- MODALS & OVERLAYS ---------------- */}

      {/* Share Modal (Works 100% in all browsers & iframes) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={shareTargetProduct}
      />

      {/* Individual Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        allProducts={products}
        onSelectProduct={setSelectedProduct}
        onShare={handleOpenShare}
      />

      {/* Article Detail Reader Modal */}
      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        allProducts={products}
        onSelectProduct={setSelectedProduct}
      />

      {/* Admin Panel Protected Modal */}
      {isAdminOpen && (
        <AdminPanel onClose={() => setIsAdminOpen(false)} />
      )}

      {/* Institutional Modals (Sobre Nós, Contato, Privacidade, Termos) */}
      <InstitutionalModals
        view={activeView}
        onClose={() => setActiveView('home')}
      />

    </div>
  );
}
