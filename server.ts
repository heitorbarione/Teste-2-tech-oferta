import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { INITIAL_PRODUCTS } from './src/data/initialProducts.ts';
import { INITIAL_ARTICLES } from './src/data/initialArticles.ts';
import { BannerSettings, Product, Article } from './src/types/index.ts';
import { extractProductFromMlUrlOrText, buildRealImageFallbackUrl, extractSlugInfoFromUrl } from './src/services/linkExtractorService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const envPort = Number(process.env.PORT);
const PORT = envPort && envPort !== 8080 ? envPort : 3000;

app.use(express.json({ limit: '10mb' }));

// Persistence file location
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'catalog.json');

function normalizeServerAssetUrl(url?: string): string {
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

interface CatalogData {
  products: Product[];
  articles: Article[];
  banner: BannerSettings;
}

function loadCatalog(): CatalogData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      const initialData: CatalogData = {
        products: INITIAL_PRODUCTS,
        articles: INITIAL_ARTICLES,
        banner: DEFAULT_BANNER,
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const products = (Array.isArray(parsed.products) ? parsed.products : INITIAL_PRODUCTS).map((p: Product) => ({
      ...p,
      image: normalizeServerAssetUrl(p.image),
    }));
    const articles = (Array.isArray(parsed.articles) ? parsed.articles : INITIAL_ARTICLES).map((a: Article) => ({
      ...a,
      image: normalizeServerAssetUrl(a.image),
    }));
    const bannerRaw = parsed.banner || DEFAULT_BANNER;
    const banner = {
      ...bannerRaw,
      backgroundImage: normalizeServerAssetUrl(bannerRaw.backgroundImage) || DEFAULT_BANNER.backgroundImage,
    };
    return { products, articles, banner };
  } catch (err) {
    console.error('Error reading catalog file, using defaults:', err);
    return {
      products: INITIAL_PRODUCTS,
      articles: INITIAL_ARTICLES,
      banner: DEFAULT_BANNER,
    };
  }
}

function saveCatalog(data: CatalogData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save catalog to disk:', err);
  }
}

// ---------------- REST API ROUTES ----------------

// Get complete catalog
app.get('/api/catalog', (req: Request, res: Response) => {
  const data = loadCatalog();
  res.json(data);
});

// Save or Update Product
app.post('/api/products', (req: Request, res: Response) => {
  const productData = req.body;
  if (!productData || !productData.name || !productData.price) {
    return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
  }

  const catalog = loadCatalog();
  const dateStr = new Intl.DateTimeFormat('pt-BR').format(new Date());

  let discountPercent = productData.discountPercent;
  if (productData.prevPrice && productData.prevPrice > productData.price) {
    discountPercent = Math.round(((productData.prevPrice - productData.price) / productData.prevPrice) * 100);
  } else if (!productData.prevPrice) {
    discountPercent = undefined;
  }

  const id = productData.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const finalProduct: Product = {
    ...productData,
    id,
    discountPercent,
    updatedAt: dateStr,
  };

  const existingIndex = catalog.products.findIndex(p => p.id === id);
  if (existingIndex >= 0) {
    catalog.products[existingIndex] = finalProduct;
  } else {
    catalog.products.unshift(finalProduct);
  }

  saveCatalog(catalog);
  res.json({ success: true, product: finalProduct, products: catalog.products });
});

// Delete Product
app.delete('/api/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const catalog = loadCatalog();
  catalog.products = catalog.products.filter(p => p.id !== id);
  saveCatalog(catalog);
  res.json({ success: true, products: catalog.products });
});

// Toggle Product Active State
app.post('/api/products/toggle/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const catalog = loadCatalog();
  catalog.products = catalog.products.map(p =>
    p.id === id ? { ...p, isActive: !p.isActive } : p
  );
  saveCatalog(catalog);
  res.json({ success: true, products: catalog.products });
});

// Helper to intelligently apply affiliate tag/params to an affiliate URL
function applyAffiliateToUrl(originalUrl: string, tagOrInput: string): string {
  const cleanInput = (tagOrInput || '').trim();
  if (!cleanInput) return originalUrl;

  let url = originalUrl || '';

  // Strip existing hash origin like #origin=affiliate_techoferta or any hash
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
    // Input is a plain tag / user ID
    params.set('origin', normalized);
    params.set('matt_word', normalized);
  }

  const newQuery = params.toString();
  return newQuery ? `${baseUrl}?${newQuery}` : baseUrl;
}

// Bulk Affiliate Tag Update
app.post('/api/products/bulk-tag', (req: Request, res: Response) => {
  const { tag } = req.body;
  if (!tag || typeof tag !== 'string') {
    return res.status(400).json({ error: 'Tag inválida' });
  }

  const cleanTag = tag.trim();
  const catalog = loadCatalog();

  catalog.products = catalog.products.map(item => {
    const updatedUrl = applyAffiliateToUrl(item.affiliateUrl || '', cleanTag);
    return { ...item, affiliateUrl: updatedUrl };
  });

  saveCatalog(catalog);
  res.json({ success: true, updatedCount: catalog.products.length, products: catalog.products });
});

// Bulk Links Update (Batch direct affiliate URLs per product)
app.post('/api/products/bulk-links', (req: Request, res: Response) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'Array de atualizações inválido' });
  }

  const catalog = loadCatalog();
  const updateMap = new Map<string, string>();
  for (const item of updates) {
    if (item && item.id && typeof item.affiliateUrl === 'string') {
      updateMap.set(item.id, item.affiliateUrl.trim());
    }
  }

  let count = 0;
  catalog.products = catalog.products.map(p => {
    if (updateMap.has(p.id)) {
      const newUrl = updateMap.get(p.id)!;
      if (newUrl && newUrl !== p.affiliateUrl) {
        count++;
        return { ...p, affiliateUrl: newUrl };
      }
    }
    return p;
  });

  saveCatalog(catalog);
  res.json({ success: true, updatedCount: count, products: catalog.products });
});

let geminiQuotaCooldownUntil = 0;

interface MlResolveOutcome {
  bestUrl: string;
  ogTitle?: string;
  ogImage?: string;
  ogDescription?: string;
  extractedPrice?: number;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

function extractEmbeddedRedirectUrl(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    for (const key of ['go', 'url', 'u', 'redirect', 'target', 'next']) {
      const val = u.searchParams.get(key);
      if (val && /^https?:\/\//i.test(val)) {
        return val;
      }
    }
  } catch {
    // ignore malformed URL
  }
  return null;
}

async function resolveMercadoLivreUrlHopByHop(startUrl: string): Promise<MlResolveOutcome> {
  let current = startUrl.trim();
  let bestUrl = current;
  let ogTitle: string | undefined;
  let ogImage: string | undefined;
  let ogDescription: string | undefined;
  let extractedPrice: number | undefined;

  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
  };

  for (let hop = 0; hop < 8; hop++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        headers: browserHeaders,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      // Update bestUrl if current has a product slug or MLB ID
      if (!current.includes('/gz/account-verification')) {
        const currentSlug = extractSlugInfoFromUrl(current);
        const bestSlug = extractSlugInfoFromUrl(bestUrl);
        if ((currentSlug.slugTitle && !bestSlug.slugTitle) || (currentSlug.mlbId && !bestSlug.mlbId)) {
          bestUrl = current;
        }
      }

      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) break;
        const nextUrl = new URL(loc, current).toString();

        if (nextUrl.includes('/gz/account-verification')) {
          const embedded = extractEmbeddedRedirectUrl(nextUrl);
          if (embedded) {
            const embSlug = extractSlugInfoFromUrl(embedded);
            const bestSlug = extractSlugInfoFromUrl(bestUrl);
            if ((embSlug.slugTitle && !bestSlug.slugTitle) || (embSlug.mlbId && !bestSlug.mlbId) || !bestUrl.includes('mercadolivre.com.br')) {
              bestUrl = embedded;
            }
          }
          break;
        }

        const embedded = extractEmbeddedRedirectUrl(nextUrl);
        if (embedded) {
          const embSlug = extractSlugInfoFromUrl(embedded);
          if (embSlug.slugTitle) {
            bestUrl = embedded;
          }
        }

        current = nextUrl;
        continue;
      }

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          const html = await res.text();
          // Inspect canonical URL
          const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
          if (canonical && !canonical.includes('/gz/account-verification')) {
            const canSlug = extractSlugInfoFromUrl(canonical);
            if (canSlug.slugTitle || canSlug.mlbId) {
              bestUrl = canonical;
            }
          }

          // Inspect OpenGraph metadata
          const rawOgTitle =
            html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1];
          if (rawOgTitle && !/^(mercado\s*li[vb]re|mercado\s*livre\s*brasil)/i.test(rawOgTitle.trim())) {
            ogTitle = decodeHtmlEntities(rawOgTitle).replace(/\s*\|\s*Mercado\s*Livre.*$/i, '').trim();
          }

          const rawOgImg =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1];
          if (rawOgImg && rawOgImg.startsWith('http') && !/logo|favicon|static\.mlstatic\.com\/frontend-assets/i.test(rawOgImg)) {
            ogImage = rawOgImg;
          }

          const rawOgDesc =
            html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
            html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1];
          if (rawOgDesc && !/frete gr[aá]tis no mesmo dia/i.test(rawOgDesc)) {
            ogDescription = decodeHtmlEntities(rawOgDesc).trim();
          }

          const priceMeta = html.match(/property=["']product:price:amount["'][^>]+content=["']([0-9.,]+)["']/i)?.[1];
          if (priceMeta) {
            const n = parseFloat(priceMeta.replace(',', '.'));
            if (!isNaN(n) && n > 0) extractedPrice = n;
          }

          // Check meta refresh or JS redirect if still on shortlink
          const metaRefresh = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"'\s>]+)/i)?.[1];
          const jsRedirect = html.match(/(?:window\.location(?:\.href)?|location\.replace)\s*[=(]\s*["'](https?:\/\/[^"']+)["']/i)?.[1];
          const nextClientUrl = metaRefresh || jsRedirect;
          if (nextClientUrl && nextClientUrl !== current && !nextClientUrl.includes('/gz/account-verification')) {
            current = decodeHtmlEntities(nextClientUrl);
            continue;
          }
        }
      }
      break;
    } catch {
      break;
    }
  }

  return { bestUrl, ogTitle, ogImage, ogDescription, extractedPrice };
}

async function fetchProductWebContext(query: string): Promise<{ title?: string; snippet?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=br-pt`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return {};

    const html = await res.text();
    const titles = [...html.matchAll(/class="result__a"[^>]*>([\s\S]*?)<\/a>/g)]
      .map(m => decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '')).trim())
      .filter(t => t.length > 8 && !/^mercado\s*li[vb]re/i.test(t));

    const snippets = [...html.matchAll(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)]
      .map(m => decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '')).trim())
      .filter(s => {
        if (s.length < 40) return false;
        if (/frete gr[aá]tis|amazon prime|amazon\.com|shopee|magalu|magazine luiza|americanas|casas bahia|submarino|encontre milhares de marcas|compre produtos com|compre .* na /i.test(s)) return false;
        if (/\b(discover|compare now|shop smarter|stop browsing|best deals|free shipping|buy online|reviews|top products)\b/i.test(s)) return false;
        // Require Portuguese indicators so English SEO spam never leaks into Portuguese descriptions
        return /\b(com|para|que|em|um|uma|seu|sua|mais|voc[eê]|ideal|tela|bateria|som|pot[eê]ncia|design|mem[oó]ria)\b/i.test(s);
      });

    return {
      title: titles[0],
      snippet: snippets[0],
    };
  } catch {
    return {};
  }
}

async function fetchRealProductImages(productName: string, brand: string): Promise<string[]> {
  const cleanName = productName
    .replace(/de\s+r\$[\d.,]+/gi, '')
    .replace(/por\s+r\$[\d.,]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const searchQuery = brand && brand !== 'Original' && !cleanName.toLowerCase().includes(brand.toLowerCase())
    ? `${brand} ${cleanName}`
    : cleanName;

  const candidates: string[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const pageRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&kl=br-pt&ia=images&iax=images`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    const pageHtml = await pageRes.text();
    const vqd = pageHtml.match(/vqd=["']?([0-9-]+)["']?/)?.[1];

    if (vqd) {
      const controller2 = new AbortController();
      const timeout2 = setTimeout(() => controller2.abort(), 4500);
      const imgRes = await fetch(
        `https://duckduckgo.com/i.js?l=br-pt&o=json&q=${encodeURIComponent(searchQuery)}&vqd=${vqd}&f=,,,,,&p=1`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Referer': 'https://duckduckgo.com/',
          },
          signal: controller2.signal,
        }
      );
      clearTimeout(timeout2);

      const text = await imgRes.text();
      if (text.trim().startsWith('{')) {
        const json = JSON.parse(text);
        const results: Array<{ image?: string; width?: number; height?: number }> = json.results || [];
        const filtered = results.filter(r => {
          if (!r.image || !r.image.startsWith('https://')) return false;
          if (/shutterstock|istockphoto|alamy|123rf|depositphotos|dreamstime|freepik|vecteezy|gettyimages|wikimedia/i.test(r.image)) return false;
          return true;
        });

        // Sort trusted e-commerce CDNs first
        filtered.sort((a, b) => {
          const score = (u: string) =>
            /mlstatic|mlcdn|magazineluiza|m\.media-amazon|samsung|apple|lg\.com|kabum|vteximg|tcdn|casasbahia|fastshop|jbl/i.test(u) ? 2 : 0;
          return score(b.image!) - score(a.image!);
        });

        for (const r of filtered.slice(0, 3)) {
          if (r.image && !candidates.includes(r.image)) {
            candidates.push(r.image);
          }
        }
      }
    }
  } catch {
    // Fallback below
  }

  // Always include Bing dynamic product thumbnail as a rock-solid verified fallback
  const bingThumb = buildRealImageFallbackUrl(cleanName, brand);
  if (!candidates.includes(bingThumb)) {
    candidates.push(bingThumb);
  }

  return candidates.slice(0, 4);
}

// Extract and auto-generate product from Mercado Livre link
app.post('/api/ml/extract-link', async (req: Request, res: Response) => {
  const { url, snippet, productHint, affiliateTag } = req.body;
  if (!url && !snippet && !productHint) {
    return res.status(400).json({ error: 'Forneça o link ou texto do anúncio' });
  }

  const originalInputUrl = (url || '').trim();
  const combinedHint = [productHint, snippet].filter(Boolean).join(' ').trim();

  try {
    // 1. Resolve shortlinks and capture OG metadata hop-by-hop
    let resolved: MlResolveOutcome = { bestUrl: originalInputUrl };
    if (originalInputUrl && /^https?:\/\//i.test(originalInputUrl)) {
      resolved = await resolveMercadoLivreUrlHopByHop(originalInputUrl);
    }

    // If user also pasted a productHint URL (e.g., long mercadolivre URL), resolve slug from it
    const targetForParsing = productHint && /^https?:\/\//i.test(productHint.trim())
      ? productHint.trim()
      : (resolved.bestUrl || originalInputUrl);

    const slugInfo = targetForParsing ? extractSlugInfoFromUrl(targetForParsing) : { slugTitle: '', mlbId: undefined, isOpaqueShortlink: false };

    // 2. If we have an MLB ID without slug and no ogTitle/productHint, try web lookup for that MLB ID
    let mlbLookupTitle = '';
    let webSnippet = resolved.ogDescription || '';
    if (!slugInfo.slugTitle && !resolved.ogTitle && !productHint && slugInfo.mlbId) {
      const mlbWeb = await fetchProductWebContext(`"${slugInfo.mlbId}" mercadolivre`);
      if (mlbWeb.title) {
        mlbLookupTitle = mlbWeb.title.replace(/\s*\|\s*Mercado\s*Livre.*$/i, '').trim();
      }
      if (mlbWeb.snippet) {
        webSnippet = mlbWeb.snippet;
      }
    }

    // 3. Determine whether we actually identified the product
    const effectiveTitleHint = [
      resolved.ogTitle,
      mlbLookupTitle,
      productHint && !/^https?:\/\//i.test(productHint.trim()) ? productHint.trim() : '',
    ].filter(Boolean).join(' ').trim();

    const preParse = extractProductFromMlUrlOrText(
      targetForParsing,
      [effectiveTitleHint, snippet].filter(Boolean).join('\n'),
      affiliateTag,
      originalInputUrl
    );

    if (preParse.needsProductHint && !effectiveTitleHint && !snippet) {
      return res.json({
        success: true,
        needsProductHint: true,
        preservedAffiliateUrl: preParse.product.affiliateUrl,
        resolvedUrl: resolved.bestUrl,
      });
    }

    // 4. Enrich with real Portuguese web snippet & real product photos (parallel)
    const productName = preParse.product.name;
    const productBrand = preParse.product.brand;

    const [webInfo, imageCandidates] = await Promise.all([
      webSnippet ? Promise.resolve({ snippet: webSnippet }) : fetchProductWebContext(`${productName} ${productBrand !== 'Original' ? productBrand : ''}`),
      fetchRealProductImages(productName, productBrand),
    ]);

    const finalImageCandidates = resolved.ogImage
      ? [resolved.ogImage, ...imageCandidates.filter(i => i !== resolved.ogImage)].slice(0, 4)
      : imageCandidates;

    const finalWebSnippet = webSnippet || webInfo.snippet || '';
    const extraPriceSnippet = resolved.extractedPrice ? ` R$ ${resolved.extractedPrice} ` : '';

    // 5. Try Gemini if GEMINI_API_KEY is present and not in quota cooldown
    if (process.env.GEMINI_API_KEY && Date.now() > geminiQuotaCooldownUntil) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const prompt = `Você é o extrator oficial de produtos do portal TECH OFERTA para o Mercado Livre Brasil.
Produto identificado: "${productName}"
Link: "${targetForParsing}"
Contexto/Preços: "${combinedHint} ${finalWebSnippet}"

Retorne um objeto JSON estritamente válido (sem markdown) com:
{
  "name": "Nome completo e limpo do produto",
  "brand": "Marca (ex: Apple, Samsung, JBL)",
  "category": "Uma destas opções exatas: 'caixas-de-som-e-fones', 'celulares-e-acessorios', 'tvs-e-smart-tvs', 'notebooks-e-computadores', 'produtos-gamer', 'smartwatches', 'carregadores-e-cabos', 'eletrodomesticos', 'informatica', 'todos-os-eletronicos'",
  "price": ${preParse.product.price},
  "prevPrice": ${preParse.product.prevPrice || 0},
  "discountPercent": ${preParse.product.discountPercent || 0},
  "specs": ["Especificação 1", "Especificação 2", "Especificação 3", "Especificação 4", "Especificação 5"],
  "description": "Descrição comercial precisa e específica deste produto em português (2 frases)"
}`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const textResult = aiResponse.text || '';
        const jsonMatch = textResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const enriched = extractProductFromMlUrlOrText(
            targetForParsing,
            [effectiveTitleHint, snippet, extraPriceSnippet].filter(Boolean).join('\n'),
            affiliateTag,
            originalInputUrl,
            parsed.description || finalWebSnippet,
            finalImageCandidates[0]
          );

          enriched.product.name = parsed.name || enriched.product.name;
          enriched.product.brand = parsed.brand || enriched.product.brand;
          enriched.product.category = parsed.category || enriched.product.category;
          if (Number(parsed.price) > 0) enriched.product.price = Number(parsed.price);
          if (Number(parsed.prevPrice) > enriched.product.price) {
            enriched.product.prevPrice = Number(parsed.prevPrice);
            enriched.product.discountPercent = Math.round(((enriched.product.prevPrice - enriched.product.price) / enriched.product.prevPrice) * 100);
          }
          if (Array.isArray(parsed.specs) && parsed.specs.length > 0) {
            enriched.product.specs = parsed.specs;
          }

          return res.json({
            success: true,
            source: 'gemini_ai',
            product: enriched.product,
            imageCandidates: finalImageCandidates,
          });
        }
      } catch (geminiErr: any) {
        const errStr = String(geminiErr?.message || geminiErr || '');
        if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED')) {
          geminiQuotaCooldownUntil = Date.now() + 10 * 60 * 1000;
        }
      }
    }

    // 6. Final enriched deterministic result (with real product image + real web snippet + accurate category)
    const finalResult = extractProductFromMlUrlOrText(
      targetForParsing,
      [effectiveTitleHint, snippet, extraPriceSnippet].filter(Boolean).join('\n'),
      affiliateTag,
      originalInputUrl,
      finalWebSnippet,
      finalImageCandidates[0]
    );

    return res.json({
      success: true,
      source: finalResult.source,
      product: finalResult.product,
      imageCandidates: finalImageCandidates,
    });
  } catch {
    const fallbackResult = extractProductFromMlUrlOrText(
      originalInputUrl,
      combinedHint,
      affiliateTag,
      originalInputUrl
    );
    return res.json({
      success: true,
      source: 'safety_fallback',
      product: fallbackResult.product,
      imageCandidates: [fallbackResult.product.image],
    });
  }
});

app.post('/api/banner', (req: Request, res: Response) => {
  const bannerSettings = req.body;
  const catalog = loadCatalog();
  catalog.banner = { ...catalog.banner, ...bannerSettings };
  saveCatalog(catalog);
  res.json({ success: true, banner: catalog.banner });
});

// Save or Update Article
app.post('/api/articles', (req: Request, res: Response) => {
  const articleData = req.body;
  const catalog = loadCatalog();
  const id = articleData.id || `art-${Date.now()}`;
  const dateStr = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

  const finalArticle: Article = {
    ...articleData,
    id,
    date: articleData.date || dateStr,
  };

  const existingIndex = catalog.articles.findIndex(a => a.id === id);
  if (existingIndex >= 0) {
    catalog.articles[existingIndex] = finalArticle;
  } else {
    catalog.articles.unshift(finalArticle);
  }

  saveCatalog(catalog);
  res.json({ success: true, article: finalArticle, articles: catalog.articles });
});

// Delete Article
app.delete('/api/articles/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const catalog = loadCatalog();
  catalog.articles = catalog.articles.filter(a => a.id !== id);
  saveCatalog(catalog);
  res.json({ success: true, articles: catalog.articles });
});

// Reset Catalog to Defaults
app.post('/api/reset', (req: Request, res: Response) => {
  const resetData: CatalogData = {
    products: INITIAL_PRODUCTS,
    articles: INITIAL_ARTICLES,
    banner: DEFAULT_BANNER,
  };
  saveCatalog(resetData);
  res.json({ success: true, catalog: resetData });
});

// Import Whole Catalog
app.post('/api/import', (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload || (!payload.products && !payload.articles && !payload.banner)) {
    return res.status(400).json({ error: 'Arquivo de catálogo inválido' });
  }

  const current = loadCatalog();
  const updatedData: CatalogData = {
    products: Array.isArray(payload.products) ? payload.products : current.products,
    articles: Array.isArray(payload.articles) ? payload.articles : current.articles,
    banner: payload.banner && typeof payload.banner === 'object' ? payload.banner : current.banner,
  };

  saveCatalog(updatedData);
  res.json({ success: true, catalog: updatedData });
});

// ---------------- VITE OR STATIC SERVING ----------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tech Oferta server running on port ${PORT} (isProd: ${isProd})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
