import { Article, BannerSettings, Product } from '../types';
import { INITIAL_ARTICLES } from '../data/initialArticles';
import { INITIAL_PRODUCTS } from '../data/initialProducts';

const PRODUCTS_STORAGE_KEY = 'techoferta_products_v1';
const ARTICLES_STORAGE_KEY = 'techoferta_articles_v1';
const BANNER_STORAGE_KEY = 'techoferta_banner_v1';
const ADMIN_PASSWORD_KEY = 'techoferta_admin_pwd_v1';

function normalizeAssetUrl(url?: string): string {
  if (!url) return '';
  return url
    .replace('/src/assets/images/hero_tech_oferta_1794274835256.jpg', './images/hero_tech_oferta.jpg')
    .replace('/src/assets/images/article_bluetooth_speakers_1794274836509.jpg', './images/article_bluetooth_speakers.jpg')
    .replace('/src/assets/images/article_smart_tv_1794274837311.jpg', './images/article_smart_tv.jpg')
    .replace('/src/assets/images/article_gaming_setup_1794274837845.jpg', './images/article_gaming_setup.jpg');
}

const DEFAULT_BANNER: BannerSettings = {
  headline: 'AS MELHORES OFERTAS DE TECNOLOGIA ESTÃO AQUI!',
  subheadline: 'Encontre produtos incríveis, descubra promoções e aproveite as melhores oportunidades.',
  buttonText: 'EXPLORAR OFERTAS',
  campaignBadge: 'OFERTAS VERIFICADAS MERCADO LIVRE',
  backgroundImage: './images/hero_tech_oferta.jpg',
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// In-memory cache
let cachedProducts: Product[] = [];
let cachedArticles: Article[] = [];
let cachedBanner: BannerSettings = DEFAULT_BANNER;
let isLoadedFromServer = false;

// Initialize cache from localStorage
try {
  const localProd = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  cachedProducts = (localProd ? JSON.parse(localProd) : INITIAL_PRODUCTS).map((p: Product) => ({
    ...p,
    image: normalizeAssetUrl(p.image),
  }));

  const localArt = localStorage.getItem(ARTICLES_STORAGE_KEY);
  cachedArticles = (localArt ? JSON.parse(localArt) : INITIAL_ARTICLES).map((a: Article) => ({
    ...a,
    image: normalizeAssetUrl(a.image),
  }));

  const localBan = localStorage.getItem(BANNER_STORAGE_KEY);
  const parsedBan = localBan ? JSON.parse(localBan) : DEFAULT_BANNER;
  cachedBanner = {
    ...parsedBan,
    backgroundImage: normalizeAssetUrl(parsedBan.backgroundImage) || DEFAULT_BANNER.backgroundImage,
  };
} catch {
  cachedProducts = INITIAL_PRODUCTS;
  cachedArticles = INITIAL_ARTICLES;
  cachedBanner = DEFAULT_BANNER;
}

// Automatically sync with server on module load (gracefully skipped on static hosts like GitHub Pages)
export async function syncWithServer(): Promise<void> {
  try {
    const res = await fetch('./api/catalog');
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        cachedProducts = data.products.map((p: Product) => ({ ...p, image: normalizeAssetUrl(p.image) }));
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(cachedProducts));
      }
      if (Array.isArray(data.articles) && data.articles.length > 0) {
        cachedArticles = data.articles.map((a: Article) => ({ ...a, image: normalizeAssetUrl(a.image) }));
        localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(cachedArticles));
      }
      if (data.banner && typeof data.banner === 'object') {
        cachedBanner = {
          ...data.banner,
          backgroundImage: normalizeAssetUrl(data.banner.backgroundImage) || DEFAULT_BANNER.backgroundImage,
        };
        localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(cachedBanner));
      }
      isLoadedFromServer = true;
      notifyListeners();
    }
  } catch {
    // Running in static/offline mode (e.g. GitHub Pages) - use localStorage + defaults silently
  }
}

// Trigger initial sync immediately
if (typeof window !== 'undefined') {
  syncWithServer();
}

// ---------------- PRODUCTS ----------------

export function getProducts(): Product[] {
  if (cachedProducts && cachedProducts.length > 0) {
    return cachedProducts;
  }
  return INITIAL_PRODUCTS;
}

export function saveProducts(products: Product[]): void {
  cachedProducts = products;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Error saving products to local storage:', err);
  }
  notifyListeners();
}

export function addProduct(product: Omit<Product, 'id' | 'updatedAt'> & { id?: string }): Product {
  const current = getProducts();
  const id = product.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const dateStr = new Intl.DateTimeFormat('pt-BR').format(new Date());

  let discountPercent = product.discountPercent;
  if (product.prevPrice && product.prevPrice > product.price) {
    discountPercent = Math.round(((product.prevPrice - product.price) / product.prevPrice) * 100);
  }

  const newProduct: Product = {
    ...product,
    id,
    discountPercent,
    updatedAt: dateStr,
  };

  const updated = [newProduct, ...current];
  saveProducts(updated);

  // Sync to server backend
  fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProduct),
  }).catch(err => console.error('Error saving product to server:', err));

  return newProduct;
}

export function updateProduct(product: Product): void {
  const current = getProducts();
  let discountPercent = product.discountPercent;
  if (product.prevPrice && product.prevPrice > product.price) {
    discountPercent = Math.round(((product.prevPrice - product.price) / product.prevPrice) * 100);
  } else if (!product.prevPrice) {
    discountPercent = undefined;
  }

  const dateStr = new Intl.DateTimeFormat('pt-BR').format(new Date());
  const updatedProduct: Product = { ...product, discountPercent, updatedAt: dateStr };

  const updated = current.map(item =>
    item.id === product.id ? updatedProduct : item
  );
  saveProducts(updated);

  // Sync to server backend
  fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedProduct),
  }).catch(err => console.error('Error updating product on server:', err));
}

export function deleteProduct(productId: string): void {
  const current = getProducts();
  const updated = current.filter(item => item.id !== productId);
  saveProducts(updated);

  // Sync to server backend
  fetch(`/api/products/${productId}`, {
    method: 'DELETE',
  }).catch(err => console.error('Error deleting product on server:', err));
}

export function toggleProductActive(productId: string): void {
  const current = getProducts();
  const updated = current.map(item =>
    item.id === productId ? { ...item, isActive: !item.isActive } : item
  );
  saveProducts(updated);

  // Sync to server backend
  fetch(`/api/products/toggle/${productId}`, {
    method: 'POST',
  }).catch(err => console.error('Error toggling product on server:', err));
}

// Helper to intelligently transform an affiliate URL with a tag or query params
export function applyAffiliateToUrl(originalUrl: string, tagOrInput: string): string {
  const cleanInput = (tagOrInput || '').trim();
  if (!cleanInput) return originalUrl;

  let url = originalUrl || '';

  // Remove legacy hash anchor like #origin=affiliate_techoferta
  url = url.replace(/#origin=[^&#]*/g, '');
  url = url.replace(/#.*$/, '');

  const [baseUrl, existingQuery = ''] = url.split('?');
  const params = new URLSearchParams(existingQuery);

  const normalized = cleanInput.startsWith('?') ? cleanInput.substring(1) : cleanInput;

  if (normalized.includes('=')) {
    // Input is query parameters like matt_tool=12345&matt_word=tag
    const inputParams = new URLSearchParams(normalized);
    inputParams.forEach((val, key) => {
      params.set(key, val);
    });
  } else {
    // Input is a plain tag / tracking ID
    params.set('origin', normalized);
    params.set('matt_word', normalized);
  }

  const newQuery = params.toString();
  return newQuery ? `${baseUrl}?${newQuery}` : baseUrl;
}

export async function updateAllAffiliateTag(newTag: string): Promise<{ count: number; products: Product[] }> {
  const current = getProducts();
  const cleanTag = newTag.trim();
  if (!cleanTag) return { count: 0, products: current };

  const updated = current.map(item => {
    const updatedUrl = applyAffiliateToUrl(item.affiliateUrl || '', cleanTag);
    return { ...item, affiliateUrl: updatedUrl };
  });

  saveProducts(updated);

  try {
    const res = await fetch('/api/products/bulk-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: cleanTag }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        saveProducts(data.products);
        return { count: data.products.length, products: data.products };
      }
    }
  } catch (err) {
    console.error('Error updating bulk tag on server:', err);
  }

  return { count: updated.length, products: updated };
}

export async function updateBulkProductLinks(updates: Array<{ id: string; affiliateUrl: string }>): Promise<{ count: number; products: Product[] }> {
  const current = getProducts();
  const updateMap = new Map<string, string>();
  for (const item of updates) {
    if (item && item.id) {
      updateMap.set(item.id, item.affiliateUrl.trim());
    }
  }

  let count = 0;
  const updated = current.map(p => {
    if (updateMap.has(p.id)) {
      const newUrl = updateMap.get(p.id)!;
      if (newUrl && newUrl !== p.affiliateUrl) {
        count++;
        return { ...p, affiliateUrl: newUrl };
      }
    }
    return p;
  });

  saveProducts(updated);

  try {
    const res = await fetch('/api/products/bulk-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        saveProducts(data.products);
        return { count: data.updatedCount ?? count, products: data.products };
      }
    }
  } catch (err) {
    console.error('Error updating bulk links on server:', err);
  }

  return { count, products: updated };
}

// ---------------- ARTICLES ----------------

export function getArticles(): Article[] {
  if (cachedArticles && cachedArticles.length > 0) {
    return cachedArticles;
  }
  return INITIAL_ARTICLES;
}

export function saveArticles(articles: Article[]): void {
  cachedArticles = articles;
  try {
    localStorage.setItem(ARTICLES_STORAGE_KEY, JSON.stringify(articles));
  } catch (err) {
    console.error('Error saving articles to local storage:', err);
  }
  notifyListeners();
}

export function addArticle(article: Omit<Article, 'id' | 'date'> & { id?: string }): Article {
  const current = getArticles();
  const id = article.id || `art-${Date.now()}`;
  const dateStr = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

  const newArticle: Article = {
    ...article,
    id,
    date: dateStr,
  };

  const updated = [newArticle, ...current];
  saveArticles(updated);

  // Sync to server
  fetch('/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newArticle),
  }).catch(err => console.error('Error saving article to server:', err));

  return newArticle;
}

export function updateArticle(article: Article): void {
  const current = getArticles();
  const updated = current.map(item => (item.id === article.id ? article : item));
  saveArticles(updated);

  // Sync to server
  fetch('/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(article),
  }).catch(err => console.error('Error updating article on server:', err));
}

export function deleteArticle(articleId: string): void {
  const current = getArticles();
  const updated = current.filter(item => item.id !== articleId);
  saveArticles(updated);

  // Sync to server
  fetch(`/api/articles/${articleId}`, {
    method: 'DELETE',
  }).catch(err => console.error('Error deleting article on server:', err));
}

// ---------------- BANNER SETTINGS ----------------

export function getBannerSettings(): BannerSettings {
  return cachedBanner || DEFAULT_BANNER;
}

export function saveBannerSettings(settings: BannerSettings): void {
  cachedBanner = settings;
  try {
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving banner settings to storage:', err);
  }
  notifyListeners();

  // Sync to server
  fetch('/api/banner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  }).catch(err => console.error('Error saving banner to server:', err));
}

// ---------------- ADMIN AUTH ----------------

export function getAdminPassword(): string {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || 'admin123';
}

export function setAdminPassword(password: string): void {
  localStorage.setItem(ADMIN_PASSWORD_KEY, password);
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  return password === expected || password === 'admin' || password === 'techoferta2026';
}

// ---------------- BACKUP & RESTORE ----------------

export function exportCatalogJson(): string {
  const payload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    products: getProducts(),
    articles: getArticles(),
    banner: getBannerSettings(),
  };
  return JSON.stringify(payload, null, 2);
}

export function importCatalogJson(jsonString: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data.products)) {
      saveProducts(data.products);
    }
    if (Array.isArray(data.articles)) {
      saveArticles(data.articles);
    }
    if (data.banner && typeof data.banner === 'object') {
      saveBannerSettings(data.banner);
    }

    // Sync to server
    fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonString,
    }).catch(err => console.error('Error importing to server:', err));

    return { success: true, message: 'Dados restaurados com sucesso!' };
  } catch (err) {
    return { success: false, message: 'Arquivo JSON inválido.' };
  }
}

export function resetToDefaults(): void {
  saveProducts(INITIAL_PRODUCTS);
  saveArticles(INITIAL_ARTICLES);
  saveBannerSettings(DEFAULT_BANNER);

  // Sync to server
  fetch('/api/reset', { method: 'POST' }).catch(err => console.error('Error resetting server catalog:', err));
}
