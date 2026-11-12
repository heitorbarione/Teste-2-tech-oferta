import React from 'react';
import { 
  Headphones, 
  Smartphone, 
  Tv, 
  Laptop, 
  Gamepad2, 
  Watch, 
  Zap, 
  Home, 
  Cpu, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { CategoryId, Product } from '../types';

interface CategoryGridProps {
  products: Product[];
  onSelectCategory: (categoryId: CategoryId) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ products, onSelectCategory }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Headphones': return <Headphones className="w-5 h-5" />;
      case 'Smartphone': return <Smartphone className="w-5 h-5" />;
      case 'Tv': return <Tv className="w-5 h-5" />;
      case 'Laptop': return <Laptop className="w-5 h-5" />;
      case 'Gamepad2': return <Gamepad2 className="w-5 h-5" />;
      case 'Watch': return <Watch className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Home': return <Home className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      default: return <Layers className="w-5 h-5" />;
    }
  };

  const getProductCount = (catId: CategoryId) => {
    if (catId === 'todos-os-eletronicos') {
      return products.filter(p => p.isActive).length;
    }
    return products.filter(p => p.category === catId && p.isActive).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-amber-400 font-bold uppercase text-xs tracking-wider">Navegação Rápida</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Categorias de Ofertas
          </h2>
        </div>
        <p className="text-xs text-zinc-400">
          Clique para ver todos os produtos e filtros de cada categoria
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {CATEGORIES.map(cat => {
          const count = getProductCount(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="group p-4 rounded-xl bg-[#121217] hover:bg-[#1a1a24] border border-zinc-800/80 hover:border-amber-400/50 transition-all text-left flex flex-col justify-between h-32 sm:h-36 shadow-sm hover:shadow-lg hover:shadow-amber-400/5 cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-amber-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-zinc-950 transition-all">
                  {getIcon(cat.iconName)}
                </div>
                <span className="text-[11px] font-semibold text-zinc-400 tabular-nums">
                  {count} {count === 1 ? 'oferta' : 'ofertas'}
                </span>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-tight">
                  {cat.name}
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 group-hover:text-zinc-300 transition-colors mt-1">
                  <span>Ver ofertas</span>
                  <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
