import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  ArrowUpDown, 
  Search, 
  X, 
  Sparkles, 
  Flame, 
  Tag, 
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { CategoryId, Product, SortOption } from '../types';
import { ProductCard } from './ProductCard';

interface CatalogViewProps {
  products: Product[];
  selectedCategory: CategoryId | null;
  onSelectCategory: (cat: CategoryId | null) => void;
  onSelectProduct: (product: Product) => void;
  onShareProduct?: (product: Product) => void;
  initialSearchQuery?: string;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onShareProduct,
  initialSearchQuery = '',
}) => {
  const [search, setSearch] = useState(initialSearchQuery);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [onlyDiscounts, setOnlyDiscounts] = useState(false);
  const [onlyBestSellers, setOnlyBestSellers] = useState(false);

  // Extract unique brands from active products
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => {
      if (p.isActive && p.brand) brands.add(p.brand);
    });
    return Array.from(brands).sort();
  }, [products]);

  // Current category metadata
  const currentCategoryObj = CATEGORIES.find(c => c.id === selectedCategory);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.isActive) return false;

      // Category filter (if 'todos-os-eletronicos' or null, show all)
      if (selectedCategory && selectedCategory !== 'todos-os-eletronicos' && p.category !== selectedCategory) {
        return false;
      }

      // Brand filter
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
        return false;
      }

      // Discount filter
      if (onlyDiscounts && (!p.discountPercent || p.discountPercent <= 0)) {
        return false;
      }

      // Best sellers filter
      if (onlyBestSellers && !p.isBestSeller) {
        return false;
      }

      // Search filter (name, brand, description, specs)
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesBrand = p.brand.toLowerCase().includes(query);
        const matchesDesc = p.description.toLowerCase().includes(query);
        const matchesCat = p.category.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      if (sortBy === 'discount-desc') {
        const discA = a.discountPercent || 0;
        const discB = b.discountPercent || 0;
        return discB - discA;
      }
      if (sortBy === 'recent') {
        return (b.id > a.id ? 1 : -1);
      }
      // 'relevance' (featured first, then higher discount)
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (b.discountPercent || 0) - (a.discountPercent || 0);
    });
  }, [products, selectedCategory, selectedBrand, onlyDiscounts, onlyBestSellers, search, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedBrand('all');
    setSortBy('relevance');
    setOnlyDiscounts(false);
    setOnlyBestSellers(false);
    onSelectCategory(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Category Header Title */}
      <div className="space-y-2 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <span>Tech Oferta</span>
          <span>/</span>
          <span>{currentCategoryObj ? currentCategoryObj.name : 'Catálogo Geral de Eletrônicos'}</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight font-display">
              {currentCategoryObj ? currentCategoryObj.name : 'Todas as Ofertas de Tecnologia'}
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              {currentCategoryObj 
                ? currentCategoryObj.description 
                : 'Pesquise, filtre e compare os melhores eletrônicos com preços verificados no Mercado Livre.'}
            </p>
          </div>
          <div className="text-xs font-semibold text-zinc-400 tabular-nums shrink-0">
            Mostrando <span className="text-amber-400 font-bold">{filteredProducts.length}</span> produtos encontrados
          </div>
        </div>
      </div>

      {/* Categories Horizontal Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === null
              ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
          }`}
        >
          Todas as Categorias
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-xl bg-[#121217] border border-zinc-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Internal search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filtrar por nome ou marca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div className="relative">
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Todas as Marcas ({availableBrands.length})</option>
              {availableBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
            >
              <option value="relevance">Relevância / Destaques</option>
              <option value="price-asc">Menor Preço primeiro</option>
              <option value="price-desc">Maior Preço primeiro</option>
              <option value="discount-desc">Maior Desconto (%)</option>
              <option value="recent">Mais Recentes</option>
            </select>
          </div>

          {/* Quick Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyDiscounts(!onlyDiscounts)}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                onlyDiscounts
                  ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                  : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Em Promoção</span>
            </button>

            <button
              onClick={() => setOnlyBestSellers(!onlyBestSellers)}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                onlyBestSellers
                  ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                  : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Mais Vendidos</span>
            </button>
          </div>

        </div>

        {/* Active Filters Summary */}
        {(search || selectedBrand !== 'all' || onlyDiscounts || onlyBestSellers || selectedCategory) && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs text-zinc-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-300">Filtros ativos:</span>
              {selectedCategory && (
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-amber-400">
                  {currentCategoryObj?.name}
                </span>
              )}
              {selectedBrand !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">
                  Marca: {selectedBrand}
                </span>
              )}
              {search && (
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">
                  Termo: "{search}"
                </span>
              )}
              {onlyDiscounts && (
                <span className="px-2 py-0.5 rounded bg-amber-400/15 text-amber-300">
                  Apenas com Desconto
                </span>
              )}
              {onlyBestSellers && (
                <span className="px-2 py-0.5 rounded bg-amber-400/15 text-amber-300">
                  Apenas Mais Vendidos
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar todos os filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              onShare={onShareProduct}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-[#121217] border border-zinc-800 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
            <Search className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">
              Nenhuma oferta encontrada para estes filtros
            </h3>
            <p className="text-xs text-zinc-400">
              Tente alterar os termos da busca, selecionar outra categoria ou limpar os filtros de preço e marca.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-lg bg-amber-400 text-zinc-950 font-bold text-xs uppercase hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Limpar Filtros e Ver Todas as Ofertas
          </button>
        </div>
      )}

    </div>
  );
};
