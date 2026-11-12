import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  Unlock, 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  ExternalLink, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  X, 
  AlertCircle, 
  Zap, 
  Globe, 
  BookOpen, 
  Flame, 
  Tag, 
  Layers, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Copy,
  Sliders,
  DollarSign
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { 
  addProduct, 
  deleteProduct, 
  exportCatalogJson, 
  getAdminPassword, 
  getArticles, 
  getBannerSettings, 
  getProducts, 
  importCatalogJson, 
  resetToDefaults, 
  saveBannerSettings, 
  setAdminPassword, 
  toggleProductActive, 
  updateProduct,
  updateAllAffiliateTag,
  updateBulkProductLinks,
  applyAffiliateToUrl,
  addArticle,
  updateArticle,
  deleteArticle,
  verifyAdminPassword
} from '../services/storageService';
import { 
  convertMlItemToProduct, 
  getMercadoLivreItem, 
  MLSearchResultItem, 
  searchMercadoLivre 
} from '../services/mercadoLivreService';
import { Article, BannerSettings, CategoryId, Product } from '../types';

interface AdminPanelProps {
  onClose: () => void;
}

export function isTestAffiliateUrl(url?: string): boolean {
  if (!url) return true;
  return (
    url.includes('affiliate_techoferta') ||
    url.includes('#origin=') ||
    url.includes('origin=affiliate_techoferta')
  );
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'link-import' | 'products' | 'affiliate-links' | 'auto-import' | 'articles' | 'banner' | 'hosting'>('dashboard');

  // Products & Storage State
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [articles, setArticles] = useState<Article[]>(getArticles());
  const [banner, setBanner] = useState<BannerSettings>(getBannerSettings());

  // Link Extraction State (Auto import from link)
  const [extractUrl, setExtractUrl] = useState('');
  const [extractSnippet, setExtractSnippet] = useState('');
  const [extractProductHint, setExtractProductHint] = useState('');
  const [needsProductHint, setNeedsProductHint] = useState(false);
  const [imageCandidates, setImageCandidates] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractSuccess, setExtractSuccess] = useState('');
  const [extractedProduct, setExtractedProduct] = useState<Omit<Product, 'id' | 'updatedAt'> | null>(null);

  // Product Editing / Creation State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    brand: '',
    category: 'caixas-de-som-e-fones',
    description: '',
    specs: ['Garantia oficial', 'Envio rápido Mercado Livre'],
    image: '',
    price: 0,
    prevPrice: undefined,
    discountPercent: undefined,
    affiliateUrl: '',
    isFeatured: false,
    isBestSeller: false,
    isSpecialOffer: false,
    isActive: true,
  });
  const [specInput, setSpecInput] = useState('');

  // Automatic Import State (Mercado Livre API)
  const [mlQuery, setMlQuery] = useState('');
  const [mlItemIdInput, setMlItemIdInput] = useState('');
  const [mlLoading, setMlLoading] = useState(false);
  const [mlResults, setMlResults] = useState<MLSearchResultItem[]>([]);
  const [mlError, setMlError] = useState('');
  const [affiliateTag, setAffiliateTag] = useState('affiliate_techoferta');
  const [importSuccessId, setImportSuccessId] = useState<string | null>(null);

  // Articles Form State
  const [isEditingArticle, setIsEditingArticle] = useState(false);
  const [articleForm, setArticleForm] = useState<Partial<Article>>({
    title: '',
    slug: '',
    image: '',
    category: 'Eletrônicos',
    readTime: '5 min de leitura',
    summary: '',
    keywords: [],
    content: [{ subtitle: '1. Introdução', text: '' }],
  });

  // Bulk affiliate tag state
  const [bulkAffiliateTag, setBulkAffiliateTag] = useState('');
  const [bulkUpdateSuccess, setBulkUpdateSuccess] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Inline Batch Affiliate Links Table State
  const [inlineLinks, setInlineLinks] = useState<{ [id: string]: string }>({});
  const [isSavingInlineLinks, setIsSavingInlineLinks] = useState(false);
  const [affiliateSearch, setAffiliateSearch] = useState('');
  const [affiliateStatusFilter, setAffiliateStatusFilter] = useState<'all' | 'test' | 'custom'>('all');

  // Synchronize inline links when products change
  React.useEffect(() => {
    const map: Record<string, string> = {};
    products.forEach(p => {
      map[p.id] = p.affiliateUrl || '';
    });
    setInlineLinks(map);
  }, [products]);

  // Toast Feedback State (No window.alert)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Table search & filter
  const [productSearch, setProductSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const refreshData = () => {
    setProducts(getProducts());
    setArticles(getArticles());
    setBanner(getBannerSettings());
  };

  // Preview of URL transformation
  const samplePreviewUrl = useMemo(() => {
    const sampleOriginal = products[0]?.affiliateUrl || 'https://lista.mercadolivre.com.br/jbl-flip-6?origin=affiliate_techoferta';
    const tag = bulkAffiliateTag.trim();
    if (!tag) return '';
    if (tag.startsWith('http://') || tag.startsWith('https://')) {
      return tag;
    }
    return applyAffiliateToUrl(sampleOriginal, tag);
  }, [products, bulkAffiliateTag]);

  const handleBulkUpdateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = bulkAffiliateTag.trim();
    if (!cleanTag) return;
    setBulkUpdating(true);
    setBulkUpdateSuccess('');

    try {
      if (cleanTag.startsWith('http://') || cleanTag.startsWith('https://')) {
        // Full URL pasted: assign to all products
        const updates = products.map(p => ({ id: p.id, affiliateUrl: cleanTag }));
        const res = await updateBulkProductLinks(updates);
        setProducts(res.products);
        showToast(`Sucesso! O link foi aplicado aos ${res.count} produtos e salvo no servidor.`);
        setBulkUpdateSuccess(`Link "${cleanTag}" aplicado aos ${res.count} produtos e salvo no servidor!`);
      } else {
        // Tag or query parameters
        const res = await updateAllAffiliateTag(cleanTag);
        setProducts(res.products);
        showToast(`Sucesso! Tag "${cleanTag}" aplicada aos ${res.count} produtos e salva permanentemente.`);
        setBulkUpdateSuccess(`Tag "${cleanTag}" aplicada com sucesso a todos os ${res.count} produtos e salva no servidor!`);
      }
      refreshData();
    } catch (err) {
      console.error('Error applying bulk affiliate tag:', err);
      showToast('Erro ao atualizar links no servidor.');
    } finally {
      setBulkUpdating(false);
      setTimeout(() => setBulkUpdateSuccess(''), 6000);
    }
  };

  const handleSaveAllInlineLinks = async () => {
    setIsSavingInlineLinks(true);
    try {
      const updates = Object.entries(inlineLinks).map(([id, affiliateUrl]) => ({
        id,
        affiliateUrl: (affiliateUrl || '').trim(),
      }));
      const res = await updateBulkProductLinks(updates);
      setProducts(res.products);
      showToast(`Todos os links foram salvos no servidor com sucesso (${res.count} produtos alterados)!`);
      refreshData();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar links no servidor.');
    } finally {
      setIsSavingInlineLinks(false);
    }
  };

  const handleSaveIndividualInlineLink = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const newUrl = (inlineLinks[productId] || '').trim();
    if (!newUrl) {
      showToast('O link não pode ficar vazio.');
      return;
    }
    updateProduct({ ...prod, affiliateUrl: newUrl });
    showToast(`Link de "${prod.name.substring(0, 25)}..." salvo no servidor!`);
    refreshData();
  };

  const handleExtractFromLink = async (e?: React.FormEvent, customUrl?: string, customHint?: string) => {
    if (e) e.preventDefault();
    const targetUrl = (customUrl ?? extractUrl).trim();
    const targetHint = (customHint ?? extractProductHint).trim();
    if (!targetUrl && !extractSnippet.trim() && !targetHint) {
      setExtractError('Por favor, cole o link ou texto do anúncio.');
      return;
    }

    setIsExtracting(true);
    setExtractError('');
    setExtractSuccess('');
    setExtractedProduct(null);
    setNeedsProductHint(false);
    setImageCandidates([]);

    try {
      const res = await fetch('/api/ml/extract-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          snippet: extractSnippet.trim(),
          productHint: targetHint,
          affiliateTag: bulkAffiliateTag.trim() || 'affiliate_techoferta',
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao processar link no servidor.');
      }

      const data = await res.json();
      if (data.needsProductHint) {
        setNeedsProductHint(true);
        setExtractError('');
        showToast('Link encurtado preservado! Informe o nome do produto para puxar foto, categoria e descrição.');
      } else if (data.product) {
        setExtractedProduct(data.product);
        setImageCandidates(Array.isArray(data.imageCandidates) ? data.imageCandidates : [data.product.image]);
        setExtractSuccess('Anúncio puxado com sucesso! Confira os dados e a prévia abaixo.');
        showToast('Anúncio importado! Confira a prévia.');
      } else {
        setExtractError('Não foi possível identificar o produto a partir deste link.');
      }
    } catch (err: any) {
      setExtractError(err.message || 'Erro ao conectar ao servidor para extrair o link.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveExtractedProduct = () => {
    if (!extractedProduct) return;
    addProduct(extractedProduct);
    showToast(`Produto "${extractedProduct.name.substring(0, 30)}..." cadastrado e salvo com sucesso!`);
    refreshData();
    setExtractedProduct(null);
    setImageCandidates([]);
    setExtractUrl('');
    setExtractSnippet('');
    setExtractProductHint('');
    setNeedsProductHint(false);
    setExtractSuccess('Produto salvo no catálogo com sucesso!');
    setTimeout(() => setExtractSuccess(''), 4000);
  };

  const handleEditExtractedProduct = () => {
    if (!extractedProduct) return;
    setProductForm({
      ...extractedProduct,
      specs: extractedProduct.specs || ['100% Original Mercado Livre', 'Compra Garantida'],
    });
    setIsEditingProduct(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(passwordInput.trim())) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Senha incorreta. (Dica padrão: "admin" ou "techoferta2026")');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.trim().length >= 4) {
      setAdminPassword(newPassword.trim());
      setPasswordSuccess('Senha do painel alterada com sucesso!');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    }
  };

  // ---------------- PRODUCT HANDLERS ----------------

  const handleOpenAddProduct = () => {
    setProductForm({
      name: '',
      brand: '',
      category: 'caixas-de-som-e-fones',
      description: '',
      specs: ['100% Original Mercado Livre', 'Garantia oficial do vendedor', 'Compra Garantida'],
      image: '',
      price: 0,
      prevPrice: undefined,
      discountPercent: undefined,
      affiliateUrl: 'https://lista.mercadolivre.com.br/#origin=affiliate_techoferta',
      isFeatured: false,
      isBestSeller: false,
      isSpecialOffer: false,
      isActive: true,
    });
    setIsEditingProduct(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setProductForm({ ...p });
    setIsEditingProduct(true);
  };

  const handlePriceChange = (priceVal: number, prevPriceVal?: number) => {
    let disc: number | undefined = undefined;
    if (prevPriceVal && prevPriceVal > priceVal) {
      disc = Math.round(((prevPriceVal - priceVal) / prevPriceVal) * 100);
    }
    setProductForm(prev => ({
      ...prev,
      price: priceVal,
      prevPrice: prevPriceVal,
      discountPercent: disc,
      isSpecialOffer: (disc !== undefined && disc >= 20) || prev.isSpecialOffer,
    }));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.affiliateUrl) {
      showToast('Por favor preencha Nome, Preço e Link de Afiliado.');
      return;
    }

    if (productForm.id) {
      updateProduct(productForm as Product);
      showToast('Produto atualizado com sucesso!');
    } else {
      addProduct({
        name: productForm.name!,
        brand: productForm.brand || 'Original',
        category: (productForm.category as CategoryId) || 'todos-os-eletronicos',
        description: productForm.description || '',
        specs: productForm.specs || [],
        image: productForm.image || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80',
        price: Number(productForm.price),
        prevPrice: productForm.prevPrice ? Number(productForm.prevPrice) : undefined,
        discountPercent: productForm.discountPercent,
        affiliateUrl: productForm.affiliateUrl!,
        isFeatured: !!productForm.isFeatured,
        isBestSeller: !!productForm.isBestSeller,
        isSpecialOffer: !!productForm.isSpecialOffer,
        isActive: productForm.isActive !== false,
      });
      showToast('Novo produto cadastrado com sucesso!');
    }

    setIsEditingProduct(false);
    refreshData();
  };

  const handleDeleteProduct = (id: string, name: string) => {
    deleteProduct(id);
    refreshData();
    showToast(`Produto "${name}" excluído do catálogo.`);
  };

  const handleToggleProduct = (id: string) => {
    toggleProductActive(id);
    refreshData();
  };

  const handleAddSpec = () => {
    if (specInput.trim()) {
      setProductForm(prev => ({
        ...prev,
        specs: [...(prev.specs || []), specInput.trim()],
      }));
      setSpecInput('');
    }
  };

  const handleRemoveSpec = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      specs: (prev.specs || []).filter((_, i) => i !== index),
    }));
  };

  // ---------------- AUTO IMPORT HANDLERS ----------------

  const handleSearchML = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mlQuery.trim()) return;
    setMlLoading(true);
    setMlError('');
    setMlResults([]);

    const res = await searchMercadoLivre(mlQuery.trim(), 12);
    setMlLoading(false);
    if (res.error) {
      setMlError(res.error);
    } else {
      setMlResults(res.items);
    }
  };

  const handleLookupMLItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mlItemIdInput.trim()) return;
    setMlLoading(true);
    setMlError('');

    const res = await getMercadoLivreItem(mlItemIdInput.trim());
    setMlLoading(false);
    if (res.error) {
      setMlError(res.error);
    } else if (res.item) {
      setMlResults([res.item]);
    }
  };

  const handleImportMLItem = (item: MLSearchResultItem) => {
    const converted = convertMlItemToProduct(item, affiliateTag);
    addProduct(converted);
    setImportSuccessId(item.id);
    refreshData();
    setTimeout(() => setImportSuccessId(null), 3000);
  };

  // ---------------- BANNER HANDLERS ----------------

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    saveBannerSettings(banner);
    showToast('Configurações de banner salvas com sucesso!');
    refreshData();
  };

  // ---------------- BACKUP HANDLERS ----------------

  const handleDownloadBackup = () => {
    const json = exportCatalogJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techoferta-catalogo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo de backup JSON baixado com sucesso!');
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const res = importCatalogJson(content);
      showToast(res.message);
      if (res.success) {
        refreshData();
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    refreshData();
    showToast('Catálogo inicial de tecnologia restaurado com sucesso!');
  };

  // Filtered products in admin table
  const displayedProducts = useMemo(() => {
    return products.filter(p => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, filterCategory, productSearch]);

  // Filtered products for affiliate links management table
  const filteredAffiliateProducts = useMemo(() => {
    return products.filter(p => {
      const isTest = isTestAffiliateUrl(p.affiliateUrl);
      if (affiliateStatusFilter === 'test' && !isTest) return false;
      if (affiliateStatusFilter === 'custom' && isTest) return false;
      if (affiliateSearch.trim()) {
        const q = affiliateSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, affiliateStatusFilter, affiliateSearch]);

  const testLinksCount = useMemo(() => products.filter(p => isTestAffiliateUrl(p.affiliateUrl)).length, [products]);
  const customLinksCount = useMemo(() => products.filter(p => !isTestAffiliateUrl(p.affiliateUrl)).length, [products]);

  // Dashboard Metrics
  const totalCount = products.length;
  const activeCount = products.filter(p => p.isActive).length;
  const featuredCount = products.filter(p => p.isFeatured && p.isActive).length;
  const bestSellerCount = products.filter(p => p.isBestSeller && p.isActive).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-6xl bg-[#111116] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#0c0c10] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center font-black">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                <span>PAINEL ADMINISTRATIVO</span>
                <span className="text-amber-400 text-xs font-semibold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                  TECH OFERTA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">Controle completo de ofertas, links de afiliados e conteúdo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fechar painel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Barrier if not authenticated */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-400/10">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white font-display">Acesso Restrito ao Painel</h2>
              <p className="text-xs text-zinc-400">
                Insira a senha de administrador para gerenciar produtos, promoções e banners.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full space-y-3">
              <input
                type="password"
                placeholder="Senha de administrador..."
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-center"
              />

              {loginError && (
                <div className="text-xs text-rose-400 font-semibold bg-rose-950/40 border border-rose-800/60 p-2 rounded">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase transition-colors shadow-md shadow-amber-400/20 cursor-pointer"
              >
                Entrar no Painel
              </button>
            </form>

            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg text-[11px] text-zinc-400 text-left space-y-1 w-full">
              <div className="font-semibold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Senha Padrão de Acesso:</span>
              </div>
              <p>Digite <code className="bg-zinc-800 px-1 py-0.5 rounded text-white font-mono">admin</code> ou <code className="bg-zinc-800 px-1 py-0.5 rounded text-white font-mono">techoferta2026</code>.</p>
              <p className="text-zinc-500">Você poderá alterar esta senha no painel após o login.</p>
            </div>
          </div>
        ) : (
          /* Main Authenticated Admin Area */
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Sidebar Tabs */}
            <aside className="w-full md:w-60 bg-[#0e0e13] border-b md:border-b-0 md:border-r border-zinc-800 p-3 flex md:flex-col gap-1 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 text-left transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Dashboard & Visão</span>
              </button>

              <button
                onClick={() => setActiveTab('link-import')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between text-left transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'link-import' ? 'bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-400/20' : 'text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className={`w-4 h-4 ${activeTab === 'link-import' ? 'text-zinc-950' : 'text-amber-400'}`} />
                  <span>Cadastrar por Link</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                  activeTab === 'link-import' ? 'bg-zinc-950 text-amber-300' : 'bg-amber-400 text-zinc-950'
                }`}>
                  AUTOMÁTICO
                </span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 text-left transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'products' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Produtos ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('affiliate-links')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between text-left transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'affiliate-links' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Tag className={`w-4 h-4 ${activeTab === 'affiliate-links' ? 'text-zinc-950' : 'text-amber-400'}`} />
                  <span>Links de Afiliado</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                  activeTab === 'affiliate-links' ? 'bg-zinc-950 text-amber-300' : 'bg-amber-400/20 text-amber-300'
                }`}>
                  Configurar
                </span>
              </button>

              <button
                onClick={() => setActiveTab('auto-import')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 text-left transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'auto-import' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Zap className="w-4 h-4 text-amber-400 group-hover:text-zinc-950" />
                <span>Importar Mercado Livre</span>
              </button>

              <button
                onClick={() => setActiveTab('banner')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 text-left transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'banner' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Banners & Frases</span>
              </button>

              <button
                onClick={() => setActiveTab('articles')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 text-left transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'articles' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Artigos & Dicas</span>
              </button>

              <button
                onClick={() => setActiveTab('hosting')}
                className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 text-left transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'hosting' ? 'bg-amber-400 text-zinc-950 font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Hospedagem R$ 0,00</span>
              </button>

              <div className="hidden md:block mt-auto pt-4 border-t border-zinc-800/80 space-y-2">
                <button
                  onClick={handleDownloadBackup}
                  className="w-full px-3 py-2 rounded text-[11px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Backup JSON</span>
                </button>
                <label className="w-full px-3 py-2 rounded text-[11px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restaurar Backup</span>
                  <input type="file" accept=".json" onChange={handleUploadBackup} className="hidden" />
                </label>
              </div>
            </aside>

            {/* Main Content View Container */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* ---------------- 1. DASHBOARD TAB ---------------- */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-white font-display">Dashboard do Tech Oferta</h2>
                    <p className="text-xs text-zinc-400">Resumo geral das ofertas ativas, produtos em destaque e categorias</p>
                  </div>

                  {/* 4 Key Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <div className="text-xs text-zinc-400 font-semibold uppercase">Total Produtos</div>
                      <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">{totalCount}</div>
                      <div className="text-[11px] text-zinc-500">Cadastrados no catálogo</div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <div className="text-xs text-emerald-400 font-semibold uppercase">Ofertas Ativas</div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">{activeCount}</div>
                      <div className="text-[11px] text-zinc-500">Visíveis para o público</div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <div className="text-xs text-amber-400 font-semibold uppercase">Em Destaque</div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">{featuredCount}</div>
                      <div className="text-[11px] text-zinc-500">No topo da página inicial</div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                      <div className="text-xs text-rose-400 font-semibold uppercase">Mais Vendidos</div>
                      <div className="text-2xl sm:text-3xl font-black text-rose-400 tabular-nums">{bestSellerCount}</div>
                      <div className="text-[11px] text-zinc-500">Selo de popularidade</div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab('link-import')}
                      className="p-4 rounded-xl bg-gradient-to-br from-amber-400/25 via-amber-500/15 to-zinc-900 hover:from-amber-400/35 border-2 border-amber-400/60 text-left transition-all cursor-pointer group shadow-lg shadow-amber-400/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] bg-amber-400 text-zinc-950 font-black px-1.5 py-0.5 rounded uppercase">
                          1 CLIQUE
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white">Cadastrar por Link ML</div>
                      <p className="text-[11px] text-zinc-300 mt-1">Cole o link e puxamos fotos, preços, ofertas e especificações na hora!</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('affiliate-links')}
                      className="p-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left transition-colors cursor-pointer group"
                    >
                      <Tag className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>Links de Afiliado</span>
                        <span className="text-[9px] bg-zinc-800 text-amber-300 font-bold px-1.5 py-0.5 rounded">COMISSÕES</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">Configure seus links ou sua tag para garantir suas comissões</p>
                    </button>

                    <button
                      onClick={handleOpenAddProduct}
                      className="p-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left transition-colors cursor-pointer group"
                    >
                      <Plus className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Cadastrar Manual</div>
                      <p className="text-[11px] text-zinc-400">Insira fotos, preços com desconto e link manualmente</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('banner')}
                      className="p-4 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left transition-colors cursor-pointer group"
                    >
                      <Sliders className="w-5 h-5 text-zinc-300 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Editar Banner</div>
                      <p className="text-[11px] text-zinc-400">Altere frases de destaque e campanhas promocionais</p>
                    </button>
                  </div>

                  {/* Recently added products table */}
                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-white uppercase tracking-wider">Últimos Produtos Cadastrados</div>
                      <button
                        onClick={() => setActiveTab('products')}
                        className="text-xs text-amber-400 hover:underline font-semibold"
                      >
                        Ver todos ({products.length}) →
                      </button>
                    </div>
                    <div className="divide-y divide-zinc-800 text-xs">
                      {products.slice(0, 5).map(prod => (
                        <div key={prod.id} className="py-2.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={prod.image} alt={prod.name} className="w-8 h-8 object-contain rounded bg-white p-0.5 shrink-0" />
                            <div className="truncate">
                              <div className="font-semibold text-zinc-200 truncate">{prod.name}</div>
                              <div className="text-[11px] text-zinc-500">{prod.brand} · {prod.category}</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-amber-400 tabular-nums">
                              R$ {prod.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            {prod.discountPercent && (
                              <div className="text-[10px] text-emerald-400 font-bold">-{prod.discountPercent}%</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Password change box */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 max-w-md">
                    <div className="text-xs font-bold text-zinc-200">Segurança: Alterar Senha do Admin</div>
                    <form onSubmit={handleChangePassword} className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Nova senha (mínimo 4 caracteres)..."
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Salvar
                      </button>
                    </form>
                    {passwordSuccess && (
                      <div className="text-[11px] text-emerald-400 font-medium">{passwordSuccess}</div>
                    )}
                  </div>

                </div>
              )}

              {/* ---------------- 1.5. CADASTRO MÁGICO POR LINK DO MERCADO LIVRE ---------------- */}
              {activeTab === 'link-import' && (
                <div className="space-y-6">
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider">
                          100% Automático
                        </span>
                        <h2 className="text-xl font-black text-white font-display">Cadastro Mágico por Link</h2>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Basta colar o link de qualquer anúncio do Mercado Livre. O sistema puxa o nome, fotos, preços, calcula o desconto, define a categoria e cria as especificações automaticamente!
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab('products')}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700/80 cursor-pointer self-start sm:self-auto"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ver Catálogo ({products.length})</span>
                    </button>
                  </div>

                  {/* Input Card */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#13131a] to-[#0f0f15] border border-amber-400/40 space-y-4 shadow-xl shadow-amber-400/5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-black shrink-0 shadow-md shadow-amber-400/30">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wide">
                          Cole o Link do Anúncio do Mercado Livre
                        </h3>
                        <p className="text-xs text-zinc-300">
                          Aceita qualquer formato: link normal do produto, link encurtado de afiliado (<code className="text-amber-300">mercadolivre.com/sec/...</code> ou <code className="text-amber-300">meli.la/...</code>) ou código MLB.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleExtractFromLink} className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="https://mercadolivre.com/sec/... ou https://produto.mercadolivre.com.br/..."
                            value={extractUrl}
                            onChange={e => setExtractUrl(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-xs text-amber-300 font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-400 shadow-inner"
                          />
                          {extractUrl && (
                            <button
                              type="button"
                              onClick={() => setExtractUrl('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isExtracting || (!extractUrl.trim() && !extractSnippet.trim())}
                          className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-400/25 active:scale-95"
                        >
                          <Zap className="w-4 h-4 fill-current" />
                          <span>{isExtracting ? 'Puxando Anúncio...' : 'Puxar Anúncio Automaticamente'}</span>
                        </button>
                      </div>

                      {/* Optional snippet input */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                          Texto complementar / preços do anúncio (opcional):
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: De R$ 699,90 por R$ 489,90 com 30% OFF (caso queira confirmar preços específicos)"
                          value={extractSnippet}
                          onChange={e => setExtractSnippet(e.target.value)}
                          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                        />
                      </div>

                      {/* Quick Testing Examples */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-400">
                        <span className="font-semibold text-zinc-400">💡 Testar com exemplos reais:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setExtractUrl('https://produto.mercadolivre.com.br/MLB-356891234-caixa-de-som-bluetooth-jbl-flip-6-30w-rms-a-prova-dagua');
                            setExtractSnippet('De R$ 699,90 por R$ 489,90 com 30% OFF');
                          }}
                          className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-[11px] transition-colors cursor-pointer"
                        >
                          JBL Flip 6 (30% OFF)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExtractUrl('https://www.mercadolivre.com.br/apple-iphone-15-128-gb-preto/p/MLB28509832');
                            setExtractSnippet('De R$ 5.999 por R$ 4.799 com 20% OFF');
                          }}
                          className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-[11px] transition-colors cursor-pointer"
                        >
                          iPhone 15 128GB
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExtractUrl('https://www.mercadolivre.com.br/smart-tv-samsung-50-polegadas-crystal-uhd-4k/p/MLB321948');
                            setExtractSnippet('De R$ 2.999 por R$ 2.199');
                          }}
                          className="px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-[11px] transition-colors cursor-pointer"
                        >
                          Smart TV 50" 4K
                        </button>
                      </div>

                      {/* Loading status */}
                      {isExtracting && (
                        <div className="p-4 rounded-xl bg-zinc-950 border border-amber-400/30 flex items-center gap-3 text-xs text-amber-300 animate-pulse">
                          <RotateCcw className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Identificando anúncio no Mercado Livre, puxando imagens em alta resolução e calculando ofertas...</span>
                        </div>
                      )}

                      {/* Locked shortlink helper prompt */}
                      {needsProductHint && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/50 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1 text-xs">
                              <div className="font-bold text-amber-300">
                                Seu link de afiliado foi preservado! O Mercado Livre ocultou os dados do link encurtado.
                              </div>
                              <p className="text-[11px] text-zinc-300 leading-relaxed">
                                Como links encurtados (<code className="text-amber-300">/sec/</code> ou <code className="text-amber-300">/social/</code>) passam por bloqueio anti-robô, digite apenas o <strong>nome do produto</strong> (ou cole a URL longa da barra de endereço) abaixo para puxarmos a <strong>foto real, categoria e descrição</strong> mantendo o seu link de afiliado:
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder="Ex: Air Fryer Mondial 4L Preta ou https://www.mercadolivre.com.br/..."
                              value={extractProductHint}
                              onChange={e => setExtractProductHint(e.target.value)}
                              className="flex-1 bg-zinc-950 border border-amber-400/40 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                            />
                            <button
                              type="button"
                              disabled={!extractProductHint.trim() || isExtracting}
                              onClick={() => handleExtractFromLink(undefined, extractUrl, extractProductHint)}
                              className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs uppercase cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              Buscar Foto e Dados ⚡
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Error feedback */}
                      {extractError && (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>{extractError}</span>
                        </div>
                      )}

                      {/* Success feedback */}
                      {extractSuccess && !extractedProduct && (
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{extractSuccess}</span>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* PREVIEW OF EXTRACTED PRODUCT CARD */}
                  {extractedProduct && (
                    <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-emerald-500/50 space-y-5 shadow-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            <span>Anúncio Puxado com Sucesso! Confira a Prévia:</span>
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleEditExtractedProduct}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Editar Detalhes</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveExtractedProduct}
                            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Salvar no Catálogo Agora</span>
                          </button>
                        </div>
                      </div>

                      {/* Visual Product Card Preview */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-zinc-950 p-5 rounded-xl border border-zinc-800">
                        {/* Image Preview + Alternative Photos */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-lg bg-white/5 border border-zinc-800/80 space-y-2.5">
                          <img
                            src={extractedProduct.image}
                            alt={extractedProduct.name}
                            referrerPolicy="no-referrer"
                            className="w-48 h-48 object-contain rounded-md bg-white p-2"
                          />
                          {imageCandidates.length > 1 && (
                            <div className="w-full space-y-1">
                              <div className="text-[10px] text-zinc-400 text-center">Trocar foto encontrada (1 clique):</div>
                              <div className="flex items-center justify-center gap-1.5">
                                {imageCandidates.map((candUrl, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setExtractedProduct(prev => prev ? { ...prev, image: candUrl } : null)}
                                    className={`w-10 h-10 rounded border bg-white p-0.5 overflow-hidden cursor-pointer transition-all ${
                                      extractedProduct.image === candUrl
                                        ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                                        : 'border-zinc-700 opacity-70 hover:opacity-100'
                                    }`}
                                  >
                                    <img src={candUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="md:col-span-8 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                              {extractedProduct.brand}
                            </span>
                            <select
                              value={extractedProduct.category}
                              onChange={e => setExtractedProduct(prev => prev ? { ...prev, category: e.target.value as CategoryId } : null)}
                              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
                            >
                              {CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            {extractedProduct.discountPercent && (
                              <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                                -{extractedProduct.discountPercent}% OFF
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-bold text-white font-display leading-snug">
                            {extractedProduct.name}
                          </h4>

                          {/* Pricing Box */}
                          <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80 flex items-baseline gap-3">
                            {extractedProduct.prevPrice && (
                              <div className="text-xs text-zinc-400 line-through">
                                De: R$ {extractedProduct.prevPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                            <div className="text-xl font-black text-amber-400">
                              Por: R$ {extractedProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>

                          {/* Specifications */}
                          <div>
                            <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                              Especificações Extraídas:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {extractedProduct.specs?.map((spec, idx) => (
                                <span key={idx} className="text-[11px] text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span>{spec}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {extractedProduct.description}
                          </p>

                          {/* Link Preview */}
                          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Link de afiliado preservado:</span>
                            <a
                              href={extractedProduct.affiliateUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-400 hover:underline font-mono text-[11px] flex items-center gap-1"
                            >
                              <span>Testar link no Mercado Livre</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Bottom action bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setExtractedProduct(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                        >
                          Limpar e Puxar Outro Anúncio
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveExtractedProduct}
                          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Salvar no Catálogo Agora (1 Clique)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3 Quick Help Boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-4 h-4" />
                        <span>Preciso fazer algo manualmente?</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Não! Basta colar o link. O sistema detecta o nome do produto, modelo, especificações, foto e categoria. Se o anúncio tiver preço promocional, o sistema calcula a porcentagem de desconto na hora.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Tag className="w-4 h-4" />
                        <span>Posso usar link encurtado (/sec/)?</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Sim! Aceita links encurtados de afiliado (<code className="text-zinc-200">mercadolivre.com/sec/...</code>), links diretos do produto ou código MLB. O seu link de afiliado é 100% mantido para suas comissões.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1.5">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4" />
                        <span>Posso alterar antes de salvar?</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Sim! Você pode clicar em "Salvar Agora (1 clique)" para ir direto para o site ou clicar em "Editar Detalhes" para personalizar qualquer palavra, foto ou preço antes de salvar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 2. PRODUCTS TAB ---------------- */}
              {activeTab === 'products' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-white font-display">Gerenciar Produtos</h2>
                      <p className="text-xs text-zinc-400">Adicione, edite preços, altere links de afiliados ou exclua itens</p>
                    </div>
                    <button
                      onClick={handleOpenAddProduct}
                      className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-400/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Novo Produto Manual</span>
                    </button>
                  </div>

                  {/* HOW TO PUT YOUR AFFILIATE LINK BANNER */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-400/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center font-black shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-amber-400 uppercase tracking-wide">
                          Como colocar o seu link de afiliado nos produtos que já estão aparecendo:
                        </h3>
                        <p className="text-[11px] text-zinc-300">
                          Os produtos abaixo vieram pré-carregados para o site não ficar vazio. Você tem duas opções para colocar seu link:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Option 1: Individual */}
                      <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-1.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Opção 1: Trocar Produto por Produto (Recomendado)</span>
                        </div>
                        <ol className="text-[11px] text-zinc-400 space-y-1 list-decimal list-inside leading-relaxed">
                          <li>Na lista abaixo, localize o produto (ex: JBL Flip 6, iPhone 15, Smart TV) e clique no <strong className="text-zinc-200">ícone de lápis ✏️ (Editar)</strong>.</li>
                          <li>No campo <strong className="text-amber-400">"Link de Afiliado Mercado Livre"</strong>, apague o link de exemplo e cole o seu link gerado no portal do Mercado Livre Afiliados.</li>
                          <li>Clique no botão amarelo <strong className="text-white">Salvar Produto</strong>. Pronto! O botão no site já redirecionará pelo seu link.</li>
                        </ol>
                      </div>

                      {/* Option 2: Bulk Tag Update */}
                      <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2">
                        <div className="font-bold text-white flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Opção 2: Atualização Rápida de Tag Global</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab('affiliate-links')}
                            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                          >
                            Abrir Central Completa →
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Digite sua tag de rastreio (ex: <code className="text-zinc-200">heitorbarione</code>), parâmetros (ex: <code className="text-zinc-200">matt_tool=123&matt_word=tag</code>) ou um link completo:
                        </p>
                        <form onSubmit={handleBulkUpdateAffiliate} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Sua tag ou link de afiliado..."
                            value={bulkAffiliateTag}
                            onChange={e => setBulkAffiliateTag(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="submit"
                            disabled={bulkUpdating}
                            className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-[11px] uppercase transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {bulkUpdating ? 'Aplicando...' : 'Aplicar a Todos'}
                          </button>
                        </form>

                        {/* Real-time sample URL preview */}
                        {bulkAffiliateTag.trim() && (
                          <div className="p-2 rounded bg-zinc-900 border border-zinc-700/70 text-[10px] font-mono break-all space-y-0.5">
                            <div className="text-amber-400 font-sans font-bold text-[10px]">Prévia do Link Gerado:</div>
                            <div className="text-emerald-400">{samplePreviewUrl}</div>
                          </div>
                        )}

                        {bulkUpdateSuccess && (
                          <div className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/30 border border-emerald-800/40 p-2 rounded">
                            {bulkUpdateSuccess}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Pesquisar produto por nome ou marca..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                      />
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    <select
                      value={filterCategory}
                      onChange={e => setFilterCategory(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
                    >
                      <option value="all">Todas as 10 Categorias</option>
                      {CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Products Table */}
                  <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/60">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-[#0e0e13] border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                          <tr>
                            <th className="p-3">Produto & Link de Afiliado</th>
                            <th className="p-3">Preço Atual</th>
                            <th className="p-3">Preço Antigo / Desconto</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/80">
                          {displayedProducts.map(prod => (
                            <tr key={prod.id} className="hover:bg-zinc-800/40 transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={prod.image}
                                    alt={prod.name}
                                    className="w-10 h-10 object-contain rounded bg-white p-0.5 shrink-0"
                                  />
                                  <div className="min-w-0 max-w-xs sm:max-w-md">
                                    <div className="font-semibold text-zinc-100 truncate">{prod.name}</div>
                                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                                      <span className="text-amber-400 font-medium">{prod.brand}</span>
                                      <span>·</span>
                                      <span className="capitalize">{prod.category.replace(/-/g, ' ')}</span>
                                      {prod.isFeatured && (
                                        <span className="text-[10px] text-amber-300 bg-amber-400/15 px-1.5 rounded">Destaque</span>
                                      )}
                                      {prod.isBestSeller && (
                                        <span className="text-[10px] text-rose-300 bg-rose-500/15 px-1.5 rounded">Mais Vendido</span>
                                      )}
                                    </div>
                                    {/* Real affiliate link display */}
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                                        isTestAffiliateUrl(prod.affiliateUrl)
                                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      }`}>
                                        {isTestAffiliateUrl(prod.affiliateUrl) ? '🟡 Link Teste' : '🟢 Seu Link'}
                                      </span>
                                      <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[200px] sm:max-w-[280px]" title={prod.affiliateUrl}>
                                        {prod.affiliateUrl}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-black text-amber-400 tabular-nums">
                                R$ {prod.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 tabular-nums">
                                {prod.prevPrice && prod.prevPrice > prod.price ? (
                                  <div>
                                    <span className="line-through text-zinc-400">
                                      R$ {prod.prevPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    {prod.discountPercent && (
                                      <span className="ml-2 font-bold text-emerald-400">
                                        -{prod.discountPercent}%
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-zinc-500">—</span>
                                )}
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => handleToggleProduct(prod.id)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                                    prod.isActive
                                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                                  }`}
                                >
                                  {prod.isActive ? 'Ativo' : 'Desativado'}
                                </button>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={prod.affiliateUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                    title="Testar link de afiliado"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    onClick={() => handleOpenEditProduct(prod)}
                                    className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
                                    title="Editar produto"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                    className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Excluir produto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 2.5. AFFILIATE LINKS CENTRAL TAB ---------------- */}
              {activeTab === 'affiliate-links' && (
                <div className="space-y-6">
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-400 text-zinc-950 text-xs font-black uppercase">
                          Comissões Mercado Livre
                        </span>
                        <h2 className="text-xl font-black text-white font-display">Central de Links de Afiliado</h2>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Substitua os links e tags de teste pelos seus links reais de afiliado. Todas as alterações são salvas permanentemente no servidor.
                      </p>
                    </div>

                    {/* Stats pills */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                        Total: <strong className="text-white">{products.length}</strong>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
                        Configurados: <strong className="text-white">{customLinksCount}</strong>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300">
                        Pendentes: <strong className="text-white">{testLinksCount}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 1. GLOBAL BULK TAG TOOL */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-400/40 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center font-black shrink-0">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-wide">
                            1. Substituição Global Inteligente
                          </h3>
                          <p className="text-xs text-zinc-300">
                            Atualize todos os {products.length} produtos do catálogo de uma só vez utilizando sua Tag ou Parâmetros do Mercado Livre.
                          </p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleBulkUpdateAffiliate} className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Digite sua tag (ex: heitorbarione), parâmetros (matt_tool=123&matt_word=tag) ou link completo..."
                            value={bulkAffiliateTag}
                            onChange={e => setBulkAffiliateTag(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-amber-400 font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                          />
                          {bulkAffiliateTag && (
                            <button
                              type="button"
                              onClick={() => setBulkAffiliateTag('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs cursor-pointer"
                            >
                              Limpar
                            </button>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={bulkUpdating || !bulkAffiliateTag.trim()}
                          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase transition-colors shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-amber-400/20"
                        >
                          <Zap className="w-4 h-4" />
                          <span>{bulkUpdating ? 'Aplicando e Salvando...' : 'Aplicar a Todos os Produtos'}</span>
                        </button>
                      </div>

                      {/* Live preview */}
                      {bulkAffiliateTag.trim() && (
                        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1.5">
                          <div className="text-[11px] font-sans font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Prévia em Tempo Real do Link Resultante:</span>
                          </div>
                          <div className="text-zinc-500 text-[11px] truncate">
                            Antes: https://lista.mercadolivre.com.br/jbl-flip-6?origin=affiliate_techoferta
                          </div>
                          <div className="text-emerald-400 font-semibold break-all bg-emerald-950/20 p-2 rounded border border-emerald-800/30">
                            Depois: {samplePreviewUrl}
                          </div>
                        </div>
                      )}

                      {bulkUpdateSuccess && (
                        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{bulkUpdateSuccess}</span>
                        </div>
                      )}

                      {/* Format tips */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-[11px] text-zinc-400">
                        <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                          <strong className="text-zinc-200 block mb-0.5">🏷️ Tag ou Nickname:</strong>
                          <span>Ex: <code className="text-amber-400">heitorbarione</code>. Será adicionado como <code className="text-zinc-300">?origin=sua_tag&matt_word=sua_tag</code>.</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                          <strong className="text-zinc-200 block mb-0.5">⚙️ Parâmetros Técnicos:</strong>
                          <span>Ex: <code className="text-amber-400">matt_tool=123&matt_word=tag</code>. Anexa e atualiza esses parâmetros exatos em cada URL.</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
                          <strong className="text-zinc-200 block mb-0.5">🔗 Link Completo (URL):</strong>
                          <span>Se colar um link completo iniciado por <code className="text-amber-400">https://...</code>, ele será aplicado a todas as ofertas.</span>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* 2. BATCH INLINE TABLE (PRODUCT BY PRODUCT) */}
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wide flex items-center gap-2">
                          <span>2. Edição Rápida em Tabela (Produto por Produto)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 font-bold">
                            Recomendado
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Cole o link individual de cada produto (ex: <code className="text-zinc-200">mercadolivre.com/sec/...</code>) e salve todos com 1 clique!
                        </p>
                      </div>

                      <button
                        onClick={handleSaveAllInlineLinks}
                        disabled={isSavingInlineLinks}
                        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-400/20 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSavingInlineLinks ? 'Salvando Todos...' : 'Salvar Todos os Links Alterados'}</span>
                      </button>
                    </div>

                    {/* Filter and search row */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Buscar produto por nome ou marca nesta tabela..."
                          value={affiliateSearch}
                          onChange={e => setAffiliateSearch(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                        />
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAffiliateStatusFilter('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            affiliateStatusFilter === 'all'
                              ? 'bg-zinc-800 text-white font-bold'
                              : 'text-zinc-400 hover:bg-zinc-800/60'
                          }`}
                        >
                          Todos ({products.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAffiliateStatusFilter('test')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            affiliateStatusFilter === 'test'
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold'
                              : 'text-zinc-400 hover:bg-zinc-800/60'
                          }`}
                        >
                          🟡 Aguardando Link ({testLinksCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAffiliateStatusFilter('custom')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            affiliateStatusFilter === 'custom'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                              : 'text-zinc-400 hover:bg-zinc-800/60'
                          }`}
                        >
                          🟢 Configurados ({customLinksCount})
                        </button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950/70">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-300">
                          <thead className="bg-[#0e0e13] border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                            <tr>
                              <th className="p-3 w-52 sm:w-64">Produto</th>
                              <th className="p-3 w-32">Status</th>
                              <th className="p-3">Link de Afiliado Mercado Livre</th>
                              <th className="p-3 text-right w-28">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/70">
                            {filteredAffiliateProducts.map(prod => {
                              const currentLink = inlineLinks[prod.id] ?? prod.affiliateUrl ?? '';
                              const isTest = isTestAffiliateUrl(currentLink);

                              return (
                                <tr key={prod.id} className="hover:bg-zinc-900/60 transition-colors">
                                  <td className="p-3">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={prod.image}
                                        alt={prod.name}
                                        className="w-10 h-10 object-contain rounded bg-white p-0.5 shrink-0"
                                      />
                                      <div className="min-w-0">
                                        <div className="font-semibold text-zinc-200 truncate max-w-[200px]" title={prod.name}>
                                          {prod.name}
                                        </div>
                                        <div className="text-[10px] text-zinc-400">
                                          <span className="text-amber-400 font-medium">{prod.brand}</span> · R$ {prod.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  <td className="p-3">
                                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                      isTest
                                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}>
                                      {isTest ? '🟡 Link Teste' : '🟢 Seu Link'}
                                    </span>
                                  </td>

                                  <td className="p-3">
                                    <input
                                      type="text"
                                      value={currentLink}
                                      onChange={e => {
                                        const val = e.target.value;
                                        setInlineLinks(prev => ({ ...prev, [prod.id]: val }));
                                      }}
                                      placeholder="https://mercadolivre.com/sec/... ou https://..."
                                      className={`w-full bg-zinc-900 border rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none transition-colors ${
                                        isTest
                                          ? 'border-zinc-700 text-amber-300/90 focus:border-amber-400'
                                          : 'border-emerald-600/60 text-emerald-300 focus:border-emerald-400'
                                      }`}
                                    />
                                  </td>

                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <a
                                        href={currentLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                        title="Testar este link em nova aba"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveIndividualInlineLink(prod.id)}
                                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-amber-400 hover:text-zinc-950 text-zinc-200 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                                        title="Salvar apenas este produto"
                                      >
                                        Salvar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Bottom Save All */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-zinc-400">
                        Mostrando {filteredAffiliateProducts.length} de {products.length} produtos
                      </span>
                      <button
                        onClick={handleSaveAllInlineLinks}
                        disabled={isSavingInlineLinks}
                        className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-400/20 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSavingInlineLinks ? 'Salvando Todos...' : 'Salvar Todos os Links Alterados'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. STEP BY STEP GUIDE */}
                  <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>Passo a Passo: Como Obter Seus Links no Mercado Livre Afiliados</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                        <div className="text-amber-400 font-bold">1. Acesse o Portal de Afiliados</div>
                        <p className="text-[11px] text-zinc-400">
                          Entre em <strong className="text-zinc-200">afiliados.mercadolivre.com.br</strong> ou faça login com sua conta do Mercado Livre aprovada no programa de afiliados.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                        <div className="text-amber-400 font-bold">2. Gere o Link Encurtado do Produto</div>
                        <p className="text-[11px] text-zinc-400">
                          Na página do produto no Mercado Livre, clique na barra de afiliados em <strong className="text-zinc-200">"Gerar Link"</strong> e copie o link (geralmente <code className="text-amber-300">mercadolivre.com/sec/...</code>).
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                        <div className="text-amber-400 font-bold">3. Cole na Tabela e Salve</div>
                        <p className="text-[11px] text-zinc-400">
                          Cole na tabela acima no produto correspondente e clique em <strong className="text-zinc-200">"Salvar Todos os Links"</strong>. Suas comissões estarão ativas para todos os visitantes!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 3. AUTO IMPORT TAB (MERCADO LIVRE API) ---------------- */}
              {activeTab === 'auto-import' && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 text-xs font-bold uppercase">
                        Integração Autorizada
                      </span>
                      <h2 className="text-xl font-black text-white font-display">Cadastro Automático via Mercado Livre</h2>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Pesquise produtos reais no catálogo público do Mercado Livre Brasil ou digite o código de anúncio (MLB). Importação direta com cálculo de desconto automático!
                    </p>
                  </div>

                  {/* Affiliate Tag Setup */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-white">Sua Tag de Afiliado do Mercado Livre:</span>
                      <p className="text-[11px] text-zinc-400">Essa tag será anexada automaticamente aos links de compras importados.</p>
                    </div>
                    <input
                      type="text"
                      value={affiliateTag}
                      onChange={e => setAffiliateTag(e.target.value)}
                      placeholder="ex: affiliate_techoferta"
                      className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-400 w-full sm:w-60"
                    />
                  </div>

                  {/* Search / Lookup Forms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search by Query */}
                    <form onSubmit={handleSearchML} className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-amber-400" />
                        <span>1. Pesquisar por Nome ou Categoria</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="ex: JBL Boombox 3, Smart TV 55, iPhone 15..."
                          value={mlQuery}
                          onChange={e => setMlQuery(e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="submit"
                          disabled={mlLoading}
                          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-bold text-xs uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          {mlLoading ? 'Buscando...' : 'Buscar'}
                        </button>
                      </div>
                    </form>

                    {/* Lookup by MLB Item ID */}
                    <form onSubmit={handleLookupMLItem} className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        <span>2. Buscar por Código do Anúncio (MLB)</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="ex: MLB123456789"
                          value={mlItemIdInput}
                          onChange={e => setMlItemIdInput(e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
                        />
                        <button
                          type="submit"
                          disabled={mlLoading}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-xs uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          {mlLoading ? 'Localizando...' : 'Localizar'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Error indicator */}
                  {mlError && (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Aviso de Conexão: </span>
                        {mlError}
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Você também pode cadastrar qualquer produto manualmente na aba "Produtos" caso a API do Mercado Livre esteja com instabilidade temporária.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Results List */}
                  {mlResults.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                        <span>Produtos Encontrados no Mercado Livre ({mlResults.length})</span>
                        <span className="text-zinc-500 text-[11px]">Clique em "Importar para o Tech Oferta"</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {mlResults.map(item => {
                          const isAlreadyImported = products.some(p => p.mlItemId === item.id || p.name === item.title);
                          const isJustImported = importSuccessId === item.id;

                          return (
                            <div
                              key={item.id}
                              className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-3"
                            >
                              <div className="flex gap-3">
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-16 h-16 object-contain bg-white rounded p-1 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-zinc-100 line-clamp-2">
                                    {item.title}
                                  </div>
                                  <div className="text-[11px] text-zinc-400 mt-1">
                                    Marca: <span className="text-amber-400">{item.brand || 'Original'}</span> · ID: {item.id}
                                  </div>
                                  <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-sm font-black text-amber-400 tabular-nums">
                                      R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    {item.original_price && item.original_price > item.price && (
                                      <span className="text-xs line-through text-zinc-500">
                                        R$ {item.original_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                                <a
                                  href={item.permalink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                                >
                                  <span>Ver no ML</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>

                                <button
                                  onClick={() => handleImportMLItem(item)}
                                  disabled={isJustImported}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    isJustImported
                                      ? 'bg-emerald-500 text-white'
                                      : isAlreadyImported
                                      ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400'
                                      : 'bg-amber-400 hover:bg-amber-300 text-zinc-950'
                                  }`}
                                >
                                  {isJustImported ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Importado!</span>
                                    </>
                                  ) : isAlreadyImported ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Já no Catálogo (Atualizar)</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Importar para Tech Oferta</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* ---------------- 4. BANNER TAB ---------------- */}
              {activeTab === 'banner' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <h2 className="text-xl font-black text-white font-display">Personalizar Banner Principal</h2>
                    <p className="text-xs text-zinc-400">Configure a frase de impacto e as chamadas da página inicial</p>
                  </div>

                  <form onSubmit={handleSaveBanner} className="space-y-4 p-5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                    <div>
                      <label className="block text-zinc-300 font-semibold mb-1">Selo Superior da Campanha:</label>
                      <input
                        type="text"
                        value={banner.campaignBadge || ''}
                        onChange={e => setBanner(prev => ({ ...prev, campaignBadge: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-semibold mb-1">Frase Principal (Título Grande):</label>
                      <textarea
                        rows={2}
                        value={banner.headline}
                        onChange={e => setBanner(prev => ({ ...prev, headline: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white font-black text-sm uppercase focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-semibold mb-1">Subtítulo Explicativo:</label>
                      <textarea
                        rows={3}
                        value={banner.subheadline}
                        onChange={e => setBanner(prev => ({ ...prev, subheadline: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-semibold mb-1">Texto do Botão CTA:</label>
                      <input
                        type="text"
                        value={banner.buttonText}
                        onChange={e => setBanner(prev => ({ ...prev, buttonText: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-amber-400 font-black uppercase focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black uppercase text-xs transition-colors cursor-pointer"
                    >
                      Salvar Alterações do Banner
                    </button>
                  </form>
                </div>
              )}

              {/* ---------------- 5. ARTICLES TAB ---------------- */}
              {activeTab === 'articles' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-white font-display">Artigos e Dicas de Tecnologia</h2>
                      <p className="text-xs text-zinc-400">Conteúdos originais para atrair visitantes do Google e gerar comissões</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {articles.map(art => (
                      <div key={art.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                        <div className="flex gap-3">
                          <img src={art.image} alt={art.title} className="w-16 h-16 object-cover rounded shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] text-amber-400 font-semibold uppercase">{art.category}</span>
                            <h3 className="text-xs font-bold text-white line-clamp-2 mt-0.5">{art.title}</h3>
                            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{art.summary}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                          <span>{art.date} · {art.readTime}</span>
                          <span className="text-emerald-400 font-semibold">Publicado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---------------- 6. HOSTING R$ 0,00 GUIDE TAB ---------------- */}
              {activeTab === 'hosting' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Custo Total: R$ 0,00 (100% Gratuito)</span>
                    </div>
                    <h2 className="text-2xl font-black text-white font-display">
                      Como Publicar e Hospedar o Tech Oferta Gratuitamente
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                      Este projeto foi desenvolvido com tecnologias modernas de alto desempenho (React + Vite + Tailwind CSS), permitindo que você hospede o site na nuvem sem pagar mensalidades, sem precisar de cartão de crédito e com carregamento instantâneo.
                    </p>
                  </div>

                  {/* Step 1: Platforms Comparison */}
                  <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>1. Melhores Plataformas Gratuitas Recomendadas</span>
                    </h3>
                    
                    <div className="space-y-3 text-xs text-zinc-300">
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>Opção 1: Vercel (Altamente Recomendada)</span>
                          <span className="text-emerald-400 font-bold">100% Grátis</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-1">
                          Hospedagem global ultrarrápida, certificado SSL gratuito (HTTPS), domínio grátis <code className="text-amber-400">seusite.vercel.app</code> e suporte a domínio personalizado sem nenhum custo.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>Opção 2: Netlify</span>
                          <span className="text-emerald-400 font-bold">100% Grátis</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-1">
                          Excelente para sites estáticos. Basta conectar seu repositório do GitHub ou arrastar a pasta <code className="text-amber-400">dist</code> gerada pelo comando <code className="text-amber-400">npm run build</code>.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>Opção 3: GitHub Pages (Deploy Automático Incluso)</span>
                          <span className="text-emerald-400 font-bold">100% Grátis</span>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-1">
                          Este projeto já inclui o arquivo <code className="text-amber-400">.github/workflows/deploy.yml</code> e configuração relativa no Vite! Ao subir para o GitHub e ativar <strong>Settings → Pages → Source: GitHub Actions</strong>, seu site é compilado e publicado automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Step-by-Step Publication */}
                  <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>2. Passo a Passo para Publicar no GitHub ou Vercel</span>
                    </h3>

                    <ol className="space-y-3 text-xs text-zinc-300 list-decimal list-inside">
                      <li className="leading-relaxed">
                        <strong className="text-white">Enviar para o GitHub:</strong> Clique em <strong>Save to GitHub</strong> no topo do AI Studio (ou envie via <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-amber-400 font-mono">git push</code>). Todos os caminhos, imagens e builds já estão prontos para o GitHub.
                      </li>
                      <li className="leading-relaxed">
                        <strong className="text-white">Ativar GitHub Pages (Automático):</strong> No repositório do GitHub, abra <strong>Settings → Pages</strong> e em <em>Build and deployment → Source</em> escolha <strong>GitHub Actions</strong>. Em ~1 minuto o link público entra no ar.
                      </li>
                      <li className="leading-relaxed">
                        <strong className="text-white">Ou usar Vercel / Netlify / Render:</strong> Conecte o mesmo repositório do GitHub em <span className="text-amber-400 font-semibold">vercel.com</span> ou <span className="text-amber-400 font-semibold">render.com</span> para hospedar com Node.js completo e salvamento em servidor.
                      </li>
                    </ol>
                  </div>

                  {/* Step 3: Backups & Data Persistence */}
                  <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3 text-xs">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      <span>3. Backup e Sincronização dos Produtos</span>
                    </h3>
                    <p className="text-zinc-400 leading-relaxed text-[11px]">
                      Todas as alterações feitas no painel são salvas com persistência local. Use os botões abaixo para exportar o catálogo em JSON a qualquer momento ou restaurar dados.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={handleDownloadBackup}
                        className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Exportar Catálogo em JSON</span>
                      </button>

                      <button
                        onClick={handleResetDefaults}
                        className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restaurar Produtos Iniciais</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </main>
          </div>
        )}

        {/* In-app Toast notification */}
        {toastMessage && (
          <div className="absolute bottom-4 right-4 z-50 bg-amber-400 text-zinc-950 px-4 py-2 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
            <Check className="w-4 h-4 text-zinc-950" />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>

      {/* ---------------- PRODUCT MANUAL FORM MODAL ---------------- */}
      {isEditingProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div 
            className="relative w-full max-w-2xl bg-[#14141c] border border-zinc-700 rounded-2xl shadow-2xl p-6 max-h-[92vh] overflow-y-auto space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white font-display">
                {productForm.id ? 'Editar Produto' : 'Cadastrar Novo Produto Manual'}
              </h3>
              <button
                onClick={() => setIsEditingProduct(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Auto-Fill by Link Bar */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-400/30 space-y-2">
              <div className="text-xs text-amber-300 font-bold flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Preenchimento Automático por Link do Mercado Livre:</span>
                </div>
                <span className="text-[10px] text-zinc-400">Opcional</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Cole o link do anúncio abaixo para preencher automaticamente nome, marca, foto, preços e especificações:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://mercadolivre.com/sec/... ou https://produto.mercadolivre.com.br/..."
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-amber-400"
                  onKeyDown={async e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.currentTarget;
                      const val = target.value.trim();
                      if (!val) return;
                      try {
                        showToast('Puxando dados do anúncio...');
                        const res = await fetch('/api/ml/extract-link', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: val, affiliateTag: bulkAffiliateTag.trim() || 'affiliate_techoferta' }),
                        });
                        const data = await res.json();
                        if (data.product) {
                          setProductForm(prev => ({ ...prev, ...data.product }));
                          showToast('Anúncio importado! Todos os campos foram preenchidos.');
                        }
                      } catch (err) {
                        showToast('Erro ao puxar dados do anúncio.');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={async e => {
                    const inputEl = e.currentTarget.previousElementSibling as HTMLInputElement;
                    const val = inputEl?.value?.trim();
                    if (!val) {
                      showToast('Cole o link do anúncio primeiro.');
                      return;
                    }
                    try {
                      showToast('Puxando dados do anúncio...');
                      const res = await fetch('/api/ml/extract-link', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: val, affiliateTag: bulkAffiliateTag.trim() || 'affiliate_techoferta' }),
                      });
                      const data = await res.json();
                      if (data.product) {
                        setProductForm(prev => ({ ...prev, ...data.product }));
                        showToast('Pronto! Dados do anúncio preenchidos automaticamente.');
                      }
                    } catch (err) {
                      showToast('Erro ao puxar dados do anúncio.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase cursor-pointer shrink-0 shadow-sm"
                >
                  Puxar ⚡
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              
              {/* Product Name */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Nome Completo do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Caixa de Som JBL Flip 6 Bluetooth À Prova D'Água"
                  value={productForm.name || ''}
                  onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Brand & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: JBL, Apple, Samsung, Dell..."
                    value={productForm.brand || ''}
                    onChange={e => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Categoria *</label>
                  <select
                    value={productForm.category || 'caixas-de-som-e-fones'}
                    onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value as CategoryId }))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Grid (Auto calculates discount) */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Preços e Desconto Automático</span>
                  {productForm.discountPercent && productForm.discountPercent > 0 ? (
                    <span className="px-2 py-0.5 rounded bg-amber-400 text-zinc-950 font-black">
                      {productForm.discountPercent}% DE DESCONTO
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Preço Anterior (De: R$) - Opcional</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ex: 499.90 (deixe em branco se não houver)"
                      value={productForm.prevPrice || ''}
                      onChange={e => {
                        const val = e.target.value ? parseFloat(e.target.value) : undefined;
                        handlePriceChange(productForm.price || 0, val);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 tabular-nums focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-200 font-bold mb-1">Preço Atual (Por: R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="ex: 349.90"
                      value={productForm.price || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        handlePriceChange(val, productForm.prevPrice);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-amber-400 font-black text-sm tabular-nums focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Affiliate Link */}
              <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-100 font-bold flex items-center gap-1.5 text-xs">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Seu Link de Afiliado Mercado Livre *</span>
                  </label>
                  {productForm.affiliateUrl && (
                    <a
                      href={productForm.affiliateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Testar link no navegador</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  type="url"
                  required
                  placeholder="https://meli.la/... ou https://mercadolivre.com/sec/..."
                  value={productForm.affiliateUrl || ''}
                  onChange={e => setProductForm(prev => ({ ...prev, affiliateUrl: e.target.value }))}
                  className="w-full bg-zinc-950 border border-amber-400/50 rounded-lg px-3 py-2 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  💡 <strong>Onde pegar:</strong> Entre no painel do <em>Mercado Livre Afiliados</em>, acesse o produto no Mercado Livre, clique em <strong>"Gerar Link"</strong> e cole o link gerado acima. Todo clique nos botões "CONFERIR OFERTA" no site redirecionará por este link gerando sua comissão.
                </p>
              </div>

              {/* Image URL & Preview */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">URL da Imagem do Produto *</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://... ou escolha um preset abaixo"
                    value={productForm.image || ''}
                    onChange={e => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-400"
                  />
                  {productForm.image && (
                    <img
                      src={productForm.image}
                      alt="Prévia"
                      className="w-9 h-9 object-contain bg-white rounded p-0.5 shrink-0"
                    />
                  )}
                </div>

                {/* Fast Preset Images */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto text-[11px] text-zinc-400">
                  <span className="shrink-0">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setProductForm(prev => ({ ...prev, image: './images/article_bluetooth_speakers.jpg' }))}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
                  >
                    Caixa Som
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductForm(prev => ({ ...prev, image: './images/article_smart_tv.jpg' }))}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
                  >
                    Smart TV
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductForm(prev => ({ ...prev, image: './images/article_gaming_setup.jpg' }))}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
                  >
                    Setup Gamer
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductForm(prev => ({ ...prev, image: './images/hero_tech_oferta.jpg' }))}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0"
                  >
                    Notebook Tech
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Descrição Breve do Produto</label>
                <textarea
                  rows={2}
                  placeholder="Destaque as principais qualidades e benefícios deste produto..."
                  value={productForm.description || ''}
                  onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Technical Specs Manager */}
              <div className="space-y-2">
                <label className="block text-zinc-300 font-semibold">Especificações Técnicas</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar especificação (ex: Bateria de 12 horas, Conexão USB-C...)"
                    value={specInput}
                    onChange={e => setSpecInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpec();
                      }
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(productForm.specs || []).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] flex items-center gap-1.5"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="text-zinc-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-800">
                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!productForm.isFeatured}
                    onChange={e => setProductForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="rounded text-amber-400 focus:ring-amber-400"
                  />
                  <span>Em Destaque</span>
                </label>

                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!productForm.isBestSeller}
                    onChange={e => setProductForm(prev => ({ ...prev, isBestSeller: e.target.checked }))}
                    className="rounded text-amber-400 focus:ring-amber-400"
                  />
                  <span>Mais Vendido</span>
                </label>

                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!productForm.isSpecialOffer}
                    onChange={e => setProductForm(prev => ({ ...prev, isSpecialOffer: e.target.checked }))}
                    className="rounded text-amber-400 focus:ring-amber-400"
                  />
                  <span>Oferta Especial</span>
                </label>

                <label className="flex items-center gap-2 text-emerald-400 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={productForm.isActive !== false}
                    onChange={e => setProductForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded text-emerald-400 focus:ring-emerald-400"
                  />
                  <span>Oferta Ativa</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingProduct(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black uppercase shadow-md shadow-amber-400/20"
                >
                  Salvar Produto
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
