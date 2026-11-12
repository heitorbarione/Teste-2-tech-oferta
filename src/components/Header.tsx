import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Menu, 
  X, 
  ChevronDown, 
  Share2, 
  Lock, 
  Flame, 
  Tag, 
  BookOpen, 
  Info, 
  ExternalLink 
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { ActiveView, CategoryId, Product } from '../types';

interface HeaderProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  selectedCategory: CategoryId | null;
  setSelectedCategory: (cat: CategoryId | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onOpenAdmin: () => void;
  onOpenShareModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  allProducts,
  onSelectProduct,
  onOpenAdmin,
  onOpenShareModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search suggestions
  const searchResults = searchQuery.trim().length >= 2
    ? allProducts
        .filter(p => p.isActive && (
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        ))
        .slice(0, 5)
    : [];

  const handleShareClick = () => {
    onOpenShareModal();
  };

  const navigateTo = (view: ActiveView, cat: CategoryId | null = null) => {
    setActiveView(view);
    setSelectedCategory(cat);
    setMobileMenuOpen(false);
    setCategoriesDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0d0d12]/95 backdrop-blur-md border-b border-zinc-800/80">
      {/* Top micro bar for affiliate transparency & whatsapp share */}
      <div className="bg-zinc-950/80 border-b border-zinc-900 px-4 py-1.5 text-[11px] text-zinc-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="text-amber-400 font-semibold uppercase tracking-wider text-[10px]">Mercado Livre Afiliados</span>
            <span className="text-zinc-600 hidden sm:inline">·</span>
            <span className="truncate hidden sm:inline">Ofertas verificadas e atualizadas diariamente com links oficiais</span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={handleShareClick}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-amber-400 transition-colors font-medium cursor-pointer"
              title="Compartilhar Tech Oferta"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">Divulgar Site</span>
            </button>
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors font-medium cursor-pointer"
              title="Painel Administrativo Tech Oferta"
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">Painel Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          
          {/* Brand Logo */}
          <button 
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 text-left group shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-zinc-950 font-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>TECH</span>
                <span className="text-amber-400">OFERTA</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide -mt-1 hidden sm:block">
                OFERTAS MERCADO LIVRE
              </p>
            </div>
          </button>

          {/* Search Bar with Live Suggestions */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar produtos, marcas (ex: JBL, iPhone, Smart TV)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-colors"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {searchFocused && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#141419] border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-50">
                <div className="p-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider bg-zinc-900/60 border-b border-zinc-800">
                  Produtos encontrados
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {searchResults.map(prod => (
                    <button
                      key={prod.id}
                      onClick={() => {
                        onSelectProduct(prod);
                        setSearchFocused(false);
                      }}
                      className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-zinc-800/70 transition-colors text-left cursor-pointer"
                    >
                      <img 
                        src={prod.image} 
                        alt={prod.name} 
                        className="w-10 h-10 object-contain rounded bg-white p-0.5 shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-zinc-200 truncate">{prod.name}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-amber-400 tabular-nums">
                            R$ {prod.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {prod.discountPercent && (
                            <span className="text-emerald-400 font-bold">-{prod.discountPercent}%</span>
                          )}
                          <span>· {prod.brand}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-2 bg-zinc-900/80 text-center border-t border-zinc-800">
                  <button
                    onClick={() => {
                      navigateTo('catalog');
                      setSearchFocused(false);
                    }}
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    Ver todos os resultados no catálogo →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-300">
            <button
              onClick={() => navigateTo('home')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'home' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              Início
            </button>

            <button
              onClick={() => navigateTo('catalog')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeView === 'catalog' && !selectedCategory ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              Ofertas
            </button>

            {/* Categories Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 py-1 ${
                  selectedCategory ? 'text-amber-400 font-semibold' : ''
                }`}
              >
                <span>Categorias</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoriesDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-[#121217] border border-zinc-700/80 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 mb-1">
                    Todas as 10 Categorias
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => navigateTo('category', cat.id)}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-800/80 hover:text-amber-400 transition-colors cursor-pointer ${
                          selectedCategory === cat.id ? 'bg-amber-400/10 text-amber-400 font-semibold' : 'text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <Tag className="w-3 h-3 text-zinc-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigateTo('articles')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeView === 'articles' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              <BookOpen className="w-4 h-4 text-zinc-400" />
              Artigos & Dicas
            </button>

            <button
              onClick={() => navigateTo('about')}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'about' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              Sobre Nós
            </button>
          </nav>

          {/* Action Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigateTo('catalog')}
              className="px-4 py-2 text-xs font-bold text-zinc-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm shadow-amber-400/20 transition-all hover:scale-102 whitespace-nowrap shrink-0 cursor-pointer hidden sm:flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5" />
              Ver Todas as Ofertas
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar ofertas no Mercado Livre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0d0d12] border-b border-zinc-800 px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            <button
              onClick={() => navigateTo('home')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
            >
              <span>Início</span>
            </button>
            <button
              onClick={() => navigateTo('catalog')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-zinc-800 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Explorar Ofertas
              </span>
            </button>
            <button
              onClick={() => navigateTo('articles')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-200 hover:bg-zinc-800 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-zinc-400" />
              <span>Artigos e Dicas de Tecnologia</span>
            </button>
            <button
              onClick={() => navigateTo('about')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Sobre Nós
            </button>
          </div>

          {/* Categories in mobile menu */}
          <div className="pt-2 border-t border-zinc-800">
            <div className="px-3 py-1 text-xs font-bold text-amber-400 uppercase tracking-wider">
              Categorias de Tecnologia
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigateTo('category', cat.id)}
                  className={`text-left px-3 py-2 rounded text-xs transition-colors truncate ${
                    selectedCategory === cat.id ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-850'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleShareClick();
              }}
              className="flex items-center gap-1.5 text-emerald-400 font-semibold"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar Site
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="flex items-center gap-1.5 text-zinc-300 font-semibold"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Admin
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
