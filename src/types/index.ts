export type CategoryId =
  | 'caixas-de-som-e-fones'
  | 'celulares-e-acessorios'
  | 'tvs-e-smart-tvs'
  | 'notebooks-e-computadores'
  | 'produtos-gamer'
  | 'smartwatches'
  | 'carregadores-e-cabos'
  | 'eletrodomesticos'
  | 'informatica'
  | 'todos-os-eletronicos';

export interface Category {
  id: CategoryId;
  name: string;
  slug: string;
  iconName: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategoryId;
  description: string;
  specs: string[];
  image: string;
  price: number;
  prevPrice?: number;
  discountPercent?: number;
  affiliateUrl: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isSpecialOffer: boolean;
  isActive: boolean;
  updatedAt: string;
  rating?: number;
  mlItemId?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  image: string;
  category: string;
  readTime: string;
  date: string;
  summary: string;
  keywords: string[];
  content: {
    subtitle: string;
    text: string;
    recommendedProductIds?: string[];
  }[];
}

export interface BannerSettings {
  headline: string;
  subheadline: string;
  buttonText: string;
  campaignBadge?: string;
  backgroundImage?: string;
}

export type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'discount-desc' | 'recent';

export type ActiveView = 
  | 'home' 
  | 'catalog' 
  | 'category' 
  | 'product' 
  | 'articles' 
  | 'article' 
  | 'admin' 
  | 'about' 
  | 'contact' 
  | 'privacy' 
  | 'terms';
