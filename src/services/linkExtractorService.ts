import { CategoryId, Product } from '../types';
import { guessCategory } from './mercadoLivreService';

const POPULAR_BRANDS = [
  'Apple', 'Samsung', 'JBL', 'Sony', 'LG', 'Dell', 'Logitech', 'Xiaomi',
  'Redmi', 'Motorola', 'Philips', 'Lenovo', 'Asus', 'Acer', 'TP-Link',
  'Anker', 'Baseus', 'Ugreen', 'QCY', 'Edifier', 'Huawei', 'Amazfit',
  'Garmin', 'Razer', 'HyperX', 'Corsair', 'Redragon', 'Havit', 'Fifine',
  'Elgato', 'PlayStation', 'Xbox', 'Nintendo', 'Microsoft', 'Amazon',
  'Google', 'Roku', 'Mondial', 'Britânia', 'Electrolux', 'Consul',
  'Brastemp', 'Walita', 'Oster', 'Arno', 'Cadence', 'Midea', 'Philco',
  'Nespresso', 'Karcher', 'Wap', 'TCL', 'Hisense', 'Poco', 'Realme',
  'Infinix', 'Kingston', 'SanDisk', 'Seagate', 'Crucial', 'Adata',
  'Multilaser', 'Positivo', 'Vaio', 'HP', 'Epson', 'Canon', 'Intelbras',
  'Mercusys', 'Tenda', 'D-Link', 'Stanley'
];

const BRAND_ALIASES: Array<[RegExp, string]> = [
  [/\b(iphone|ipad|macbook|airpods|apple watch|imac|magsafe)\b/i, 'Apple'],
  [/\b(galaxy|odyssey|crystal uhd|qled)\b/i, 'Samsung'],
  [/\b(dualsense|dualshock|playstation|ps5|ps4|bravia)\b/i, 'Sony'],
  [/\b(echo dot|echo pop|echo show|fire tv|kindle|alexa)\b/i, 'Amazon'],
  [/\b(mi band|redmi|poco|mi tv|mi box)\b/i, 'Xiaomi'],
  [/\b(xbox|surface)\b/i, 'Microsoft'],
  [/\b(moto g|moto e|motorola edge|razr)\b/i, 'Motorola'],
  [/\b(ideapad|thinkpad|legion|yoga)\b/i, 'Lenovo'],
  [/\b(inspiron|alienware|vostro|latitude)\b/i, 'Dell'],
  [/\b(vivobook|zenbook|rog|tuf gaming)\b/i, 'Asus'],
  [/\b(nitro|aspire|predator)\b/i, 'Acer'],
  [/\b(flip 5|flip 6|charge 5|boombox|partybox|tune \d+|wave \d+|go 3|go 4)\b/i, 'JBL'],
  [/\b(dolce gusto)\b/i, 'Arno'],
];

const UPPERCASE_TOKENS = new Set([
  'JBL', 'LG', 'TCL', 'HP', 'SSD', 'NVME', 'HD', 'RAM', 'USB', 'USB-C',
  'HDMI', 'TV', 'LED', 'OLED', 'QLED', '4K', '8K', 'UHD', 'FHD', '5G',
  '4G', 'RMS', 'ANC', 'TWS', 'PS5', 'PS4', 'PC', 'RGB', 'GB', 'TB', 'W',
  'V', 'NFC', 'GPS', 'HDR', 'DDR4', 'DDR5', 'CPU', 'GPU', 'RTX', 'GTX',
  'QCY', 'WAP', 'MLB', 'WI-FI', 'WIFI', 'BT', 'IOS', 'ATX', 'IP67', 'IP68'
]);

const LOWERCASE_CONNECTORS = new Set([
  'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'por', 'com', 'e', 'o', 'a', 'os', 'as', 'para', 'ao', 'à'
]);

const RESERVED_ML_ROUTES = new Set([
  'sec', 'gz', 'p', 'up', 'social', 'ofertas', 'cupons', 'jm', 'categoria',
  'lista', 'v', 'l', 'mlb', 'checkout', 'cart', 'navigation', 'c', 'a', 's',
  'ml', 'produto', 'item', 'loja', 'perfil', 'busca', 'search'
]);

export function formatPortugueseTitle(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  const words = cleaned.split(' ');
  return words
    .map((word, index) => {
      const upper = word.toUpperCase();
      if (UPPERCASE_TOKENS.has(upper)) {
        return upper;
      }
      if (/^\d+(gb|tb|w|v|mah|hz|l|ml|pol|mm)$/i.test(word)) {
        return word.toUpperCase().replace('MAH', 'mAh').replace('HZ', 'Hz').replace('POL', 'pol');
      }
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_CONNECTORS.has(lower)) {
        return lower;
      }
      // Capitalize properly without breaking accented characters
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function buildRealImageFallbackUrl(title: string, brand?: string): string {
  const cleanTitle = title
    .replace(/de\s+r\$[\d.,]+/gi, '')
    .replace(/por\s+r\$[\d.,]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const query = brand && brand !== 'Original' && !cleanTitle.toLowerCase().includes(brand.toLowerCase())
    ? `${brand} ${cleanTitle}`
    : cleanTitle;
  return `https://tse2.mm.bing.net/th?q=${encodeURIComponent(query)}&w=600&h=600&c=7&rs=1&p=0&pid=1.7&mkt=pt-BR&cc=BR`;
}

export function detectBrandFromText(text: string): string {
  for (const b of POPULAR_BRANDS) {
    const escaped = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|\\s|-|\\b)${escaped}(?:$|\\s|-|\\b)`, 'i').test(text)) {
      return b;
    }
  }
  for (const [regex, brandName] of BRAND_ALIASES) {
    if (regex.test(text)) {
      return brandName;
    }
  }
  return 'Original';
}

export function extractSpecsFromTitle(title: string, extraText = ''): string[] {
  const specs: string[] = [];
  const source = `${title} ${extraText}`.trim();
  const t = source.toLowerCase();

  // Storage
  const storageMatch = source.match(/\b(32|64|128|256|512)\s*(gb|tb)\b/i) || source.match(/\b(1|2|4)\s*tb\b/i);
  if (storageMatch) specs.push(`Armazenamento: ${storageMatch[0].toUpperCase().replace(/\s+/, '')}`);

  // RAM
  const ramMatch = source.match(/\b(4|6|8|12|16|24|32|64)\s*gb\s*(?:de\s*)?ram\b/i);
  if (ramMatch) {
    specs.push(`Memória RAM: ${ramMatch[1]}GB`);
  }

  // Capacity in Liters (Air Fryers, etc.)
  const literMatch = source.match(/\b([0-9]+(?:[.,][0-9]+)?)\s*(?:l|litros?)\b/i);
  if (literMatch && (t.includes('fryer') || t.includes('fritadeira') || t.includes('forno') || t.includes('geladeira') || t.includes('garrafa'))) {
    specs.push(`Capacidade: ${literMatch[1]} Litros`);
  }

  // Voltage
  if (t.includes('bivolt')) specs.push('Voltagem: Bivolt Automático');
  else if (t.includes('110v') || t.includes('127v')) specs.push('Voltagem: 110V / 127V');
  else if (t.includes('220v')) specs.push('Voltagem: 220V');

  // Connectivity
  if (/\b5g\b/i.test(t)) specs.push('Conectividade: 5G Ultra-rápido');
  else if (/\b4g\b/i.test(t)) specs.push('Conectividade: 4G');
  if (t.includes('bluetooth')) specs.push('Conectividade: Bluetooth sem fio');
  if (t.includes('wi-fi') || t.includes('wifi')) specs.push('Conectividade: Wi-Fi integrado');
  if (t.includes('sem fio') || t.includes('wireless')) specs.push('Conexão: Totalmente sem fio');

  // Screen & Display
  const screenMatch = source.match(/\b([0-9]{1,2}(?:[.,][0-9])?)\s*(?:"|polegadas|pol)\b/i);
  if (screenMatch) specs.push(`Tela: ${screenMatch[1]}" Polegadas`);
  if (t.includes('oled')) specs.push('Painel: OLED de alto contraste');
  else if (t.includes('qled')) specs.push('Painel: QLED');
  else if (t.includes('amoled')) specs.push('Display: AMOLED');
  if (/\b4k\b/i.test(t)) specs.push('Resolução: 4K Ultra HD');

  // Audio & Power
  const wattMatch = source.match(/\b([0-9]{2,4})\s*w(?:\s*rms)?\b/i);
  if (wattMatch) specs.push(`Potência: ${wattMatch[0].toUpperCase()}`);

  // Battery
  const mahMatch = source.match(/\b([0-9]{3,5})\s*mah\b/i);
  if (mahMatch) specs.push(`Bateria: ${mahMatch[1]} mAh`);

  // General features
  if (t.includes("prova d'agua") || t.includes('prova d agua') || t.includes('ip67') || t.includes('ip68')) {
    specs.push("Proteção: Resistente à água");
  }
  if (t.includes('cancelamento de ruido') || t.includes('noise cancelling') || /\banc\b/i.test(t)) {
    specs.push('Áudio: Cancelamento Ativo de Ruído (ANC)');
  }
  if (t.includes('usb-c') || t.includes('tipo c') || t.includes('type-c')) {
    specs.push('Interface: USB-C moderno');
  }
  if (t.includes('alexa')) specs.push('Assistente: Compatível com Alexa');

  // Fill in meaningful guarantees if list is short
  const defaults = [
    'Produto Original com Nota Fiscal',
    'Compra Garantida pelo Mercado Livre',
    'Envio rápido com rastreamento'
  ];
  for (const d of defaults) {
    if (specs.length >= 4) break;
    if (!specs.includes(d)) specs.push(d);
  }

  return specs.slice(0, 5);
}

export function parsePricesFromSnippet(text?: string): { price?: number; prevPrice?: number; discountPercent?: number } {
  if (!text) return {};

  const cleanNum = (str?: string): number | undefined => {
    if (!str) return undefined;
    // Handle both "1.299,90" and "1299.90"
    let norm = str.trim();
    if (norm.includes(',') && norm.includes('.')) {
      norm = norm.replace(/\./g, '').replace(',', '.');
    } else if (norm.includes(',')) {
      norm = norm.replace(',', '.');
    } else if (/^\d{1,3}\.\d{3}$/.test(norm)) {
      norm = norm.replace(/\./g, '');
    }
    const n = parseFloat(norm);
    return isNaN(n) || n <= 0 ? undefined : n;
  };

  const deMatch = text.match(/de\s*r?\$?\s*([0-9][0-9.,]*)/i);
  const porMatch = text.match(/por\s*r?\$?\s*([0-9][0-9.,]*)/i);

  const prevPrice = deMatch ? cleanNum(deMatch[1]) : undefined;
  let price = porMatch ? cleanNum(porMatch[1]) : undefined;

  if (!price) {
    const allPrices = [...text.matchAll(/r\$\s*([0-9][0-9.,]*)/gi)]
      .map(m => cleanNum(m[1]))
      .filter((n): n is number => n !== undefined && n >= 5);
    if (allPrices.length >= 2) {
      const sorted = [...allPrices].sort((a, b) => a - b);
      price = sorted[0];
    } else if (allPrices.length === 1) {
      price = allPrices[0];
    }
  }

  let discountPercent: number | undefined = undefined;
  if (prevPrice && price && prevPrice > price) {
    discountPercent = Math.round(((prevPrice - price) / prevPrice) * 100);
  }

  return { price, prevPrice, discountPercent };
}

export function extractSlugInfoFromUrl(rawUrl: string): { slugTitle: string; mlbId?: string; isOpaqueShortlink: boolean } {
  const cleanUrl = rawUrl.split('?')[0].split('#')[0].trim();

  let mlbId: string | undefined;
  const mlbMatch = rawUrl.match(/\b(MLBU?-?[0-9]{6,15})\b/i) || rawUrl.match(/\/p\/(MLB[0-9]{6,15})/i);
  if (mlbMatch) {
    mlbId = mlbMatch[1].replace('-', '').toUpperCase();
  }

  // Case 1: /produto-slug/p/MLB12345 or /produto-slug/up/MLBU12345
  const catalogMatch = cleanUrl.match(/https?:\/\/[^/]+\/([^/]+)\/(?:p|up)\/(?:MLBU?[0-9]+)/i);
  if (catalogMatch && catalogMatch[1] && !RESERVED_ML_ROUTES.has(catalogMatch[1].toLowerCase())) {
    return {
      slugTitle: decodeURIComponent(catalogMatch[1]).replace(/[-_+]+/g, ' ').trim(),
      mlbId,
      isOpaqueShortlink: false,
    };
  }

  // Case 2: /MLB-123456789-produto-slug-_JM
  const itemMatch = cleanUrl.match(/MLB-?[0-9]+-([^/]+)/i);
  if (itemMatch && itemMatch[1]) {
    const cleaned = decodeURIComponent(itemMatch[1].replace(/_JM.*$/i, '')).replace(/[-_+]+/g, ' ').trim();
    if (cleaned.length >= 3) {
      return {
        slugTitle: cleaned,
        mlbId,
        isOpaqueShortlink: false,
      };
    }
  }

  // Case 3: Direct slug path e.g. mercadolivre.com.br/smartphone-samsung-galaxy-a55
  const pathAfterDomain = cleanUrl.replace(/^https?:\/\/[^/]+\/?/, '');
  const segments = pathAfterDomain.split('/').filter(Boolean);

  if (
    cleanUrl.includes('/sec/') ||
    cleanUrl.includes('meli.la/') ||
    cleanUrl.includes('/gz/') ||
    cleanUrl.includes('/social/')
  ) {
    return { slugTitle: '', mlbId, isOpaqueShortlink: true };
  }

  if (segments.length > 0) {
    const first = segments[0].toLowerCase();
    if (!RESERVED_ML_ROUTES.has(first) && !/^mlbu?\d+$/i.test(first)) {
      const candidate = decodeURIComponent(segments[0]).replace(/[-_+]+/g, ' ').trim();
      if (candidate.length >= 5 && candidate.includes(' ')) {
        return { slugTitle: candidate, mlbId, isOpaqueShortlink: false };
      }
    }
  }

  return { slugTitle: '', mlbId, isOpaqueShortlink: false };
}

export function buildSmartDescription(
  title: string,
  brand: string,
  category: CategoryId,
  specs: string[],
  webSnippet?: string
): string {
  const cleanSnippet = (webSnippet || '').replace(/\s+/g, ' ').trim();
  const isGenericMlBoilerplate =
    !cleanSnippet ||
    cleanSnippet.length < 35 ||
    /frete gr[aá]tis no mesmo dia|encontre milhares de marcas|compre produtos com/i.test(cleanSnippet);

  if (!isGenericMlBoilerplate) {
    return cleanSnippet.length > 260 ? `${cleanSnippet.slice(0, 257)}...` : cleanSnippet;
  }

  const brandLabel = brand !== 'Original' ? ` da ${brand}` : '';
  const specHighlight = specs
    .filter(s => !s.includes('Mercado Livre') && !s.includes('Nota Fiscal') && !s.includes('Envio rápido'))
    .slice(0, 2)
    .join(' • ');

  const categoryContext: Record<CategoryId, string> = {
    'caixas-de-som-e-fones': 'Qualidade sonora envolvente, graves definidos e praticidade para ouvir suas músicas e chamadas em qualquer lugar.',
    'celulares-e-acessorios': 'Desempenho fluido no dia a dia, câmeras nítidas e excelente autonomia para trabalho, fotos e redes sociais.',
    'tvs-e-smart-tvs': 'Imagem vibrante com alta definição e sistema Smart completo para assistir filmes, séries e esportes com máxima imersão.',
    'notebooks-e-computadores': 'Performance confiável para estudos, home office, multitarefas e produtividade com inicialização rápida.',
    'produtos-gamer': 'Precisão, resposta imediata e conforto projetados para elevar sua experiência nos jogos competitivos e casuais.',
    'smartwatches': 'Monitoramento de saúde, notificações inteligentes no pulso e design versátil para treinos e rotina diária.',
    'carregadores-e-cabos': 'Carregamento seguro, estável e eficiente com proteção contra sobrecarga e alta durabilidade no uso contínuo.',
    'eletrodomesticos': 'Praticidade e eficiência para facilitar sua rotina doméstica com acabamento robusto e baixo consumo de energia.',
    'informatica': 'Mais velocidade, estabilidade e desempenho para o seu setup de trabalho ou estudo com compatibilidade garantida.',
    'todos-os-eletronicos': 'Tecnologia confiável, ótimo custo-benefício e entrega garantida pelo Mercado Livre.',
  };

  const extra = specHighlight ? ` Destaques: ${specHighlight}.` : '';
  return `${title}${brandLabel}. ${categoryContext[category]}${extra} Produto original com envio rápido e Compra Garantida.`;
}

export interface ExtractedProductResult {
  product: Omit<Product, 'id' | 'updatedAt'>;
  source: 'direct_slug' | 'gemini_search' | 'text_parser' | 'web_enriched';
  mlbId?: string;
  originalLink: string;
  needsProductHint?: boolean;
}

/**
 * Main parser that turns any Mercado Livre URL, resolved URL, or raw text into a complete product
 */
export function extractProductFromMlUrlOrText(
  urlOrText: string,
  extraSnippet?: string,
  affiliateTag = 'affiliate_techoferta',
  preservedOriginalUrl?: string,
  webSnippet?: string,
  realImageUrl?: string
): ExtractedProductResult {
  const input = urlOrText.trim();
  const fullText = `${input} ${extraSnippet || ''}`;

  let rawUrl = '';
  let extraText = extraSnippet || '';

  if (input.startsWith('http://') || input.startsWith('https://')) {
    rawUrl = input;
  } else {
    const urlMatch = input.match(/(https?:\/\/[^\s]+)/i);
    if (urlMatch) {
      rawUrl = urlMatch[1];
      extraText = input.replace(rawUrl, '') + ' ' + (extraSnippet || '');
    } else {
      extraText = input + ' ' + (extraSnippet || '');
    }
  }

  // 1. Extract slug & MLB ID from URL
  const { slugTitle, mlbId: urlMlbId, isOpaqueShortlink } = rawUrl
    ? extractSlugInfoFromUrl(rawUrl)
    : { slugTitle: '', mlbId: undefined, isOpaqueShortlink: false };

  let mlbId = urlMlbId;
  if (!mlbId) {
    const mlbMatch = fullText.match(/\b(MLBU?-?[0-9]{6,15})\b/i);
    if (mlbMatch) mlbId = mlbMatch[1].replace('-', '').toUpperCase();
  }

  // 2. Determine product title
  let title = slugTitle;

  if (!title || title.length < 4) {
    const textWithoutUrl = extraText
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/\bMLBU?-?[0-9]{6,15}\b/gi, '')
      .trim();

    if (textWithoutUrl.length >= 4) {
      const cleanedText = textWithoutUrl
        .split('\n')[0]
        .replace(/de\s+r\$.*$/i, '')
        .replace(/por\s+r\$.*$/i, '')
        .replace(/r\$\s*[0-9.,]+.*$/i, '')
        .replace(/\b\d+%\s*off\b/gi, '')
        .trim();
      if (cleanedText.length >= 4) {
        title = cleanedText;
      }
    }
  }

  const hasValidTitle = Boolean(title && title.trim().length >= 4);
  const formattedTitle = hasValidTitle
    ? formatPortugueseTitle(title)
    : 'Oferta de Tecnologia Mercado Livre';

  // 3. Detect Brand & Category
  const brand = detectBrandFromText(`${formattedTitle} ${extraText}`);
  const category = guessCategory(`${formattedTitle} ${extraText}`);

  // 4. Extract Specs
  const specs = extractSpecsFromTitle(formattedTitle, `${extraText} ${webSnippet || ''}`);

  // 5. Extract Prices
  const { price: extractedPrice, prevPrice: extractedPrev, discountPercent: extractedDisc } =
    parsePricesFromSnippet(`${fullText} ${webSnippet || ''}`);

  const price = extractedPrice || 299.9;
  const prevPrice = extractedPrev;
  let discountPercent = extractedDisc;

  if (prevPrice && prevPrice > price && !discountPercent) {
    discountPercent = Math.round(((prevPrice - price) / prevPrice) * 100);
  }

  // 6. Select real product image
  const image = realImageUrl || buildRealImageFallbackUrl(formattedTitle, brand);

  // 7. Always preserve the user's original affiliate link when present
  let finalAffiliateUrl = (preservedOriginalUrl || rawUrl || `https://lista.mercadolivre.com.br/?origin=${affiliateTag}`).trim();
  if (
    !finalAffiliateUrl.includes('/sec/') &&
    !finalAffiliateUrl.includes('meli.la') &&
    !finalAffiliateUrl.includes('/social/') &&
    !finalAffiliateUrl.includes('origin=') &&
    !finalAffiliateUrl.includes('matt_word=')
  ) {
    finalAffiliateUrl += (finalAffiliateUrl.includes('?') ? '&' : '?') + `origin=${affiliateTag}&matt_word=${affiliateTag}`;
  }

  // 8. Build product-aware Portuguese description
  const description = buildSmartDescription(formattedTitle, brand, category, specs, webSnippet);

  return {
    source: webSnippet || realImageUrl ? 'web_enriched' : 'direct_slug',
    mlbId,
    originalLink: preservedOriginalUrl || rawUrl || input,
    needsProductHint: !hasValidTitle && isOpaqueShortlink,
    product: {
      name: formattedTitle,
      brand,
      category,
      description,
      specs,
      image,
      price,
      prevPrice,
      discountPercent,
      affiliateUrl: finalAffiliateUrl,
      isFeatured: false,
      isBestSeller: false,
      isSpecialOffer: discountPercent !== undefined && discountPercent >= 15,
      isActive: true,
      rating: 4.8,
      mlItemId: mlbId,
    },
  };
}
