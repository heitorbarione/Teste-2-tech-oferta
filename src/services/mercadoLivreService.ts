import { CategoryId, Product } from '../types';

export interface MLSearchResultItem {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  currency_id: string;
  thumbnail: string;
  permalink: string;
  condition: string;
  brand?: string;
  category_id?: string;
  attributes?: { id: string; name: string; value_name: string }[];
}

function normalizeForCategory(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasKeyword(normalizedText: string, keywords: string[]): boolean {
  for (const kw of keywords) {
    const cleanKw = normalizeForCategory(kw);
    if (!cleanKw) continue;
    // Use word boundary matching for short or ambiguous tokens to avoid false positives like 'pc' in 'opcao'
    const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const regex = new RegExp(`(?:^|\\s|-)${escaped}(?:$|\\s|-)`, 'i');
    if (regex.test(normalizedText)) {
      return true;
    }
  }
  return false;
}

/**
 * Maps common Mercado Livre title keywords or ML categories to Tech Oferta categories
 */
export function guessCategory(title: string): CategoryId {
  const t = normalizeForCategory(title);

  // 1. Carregadores, cabos e energia (checked BEFORE celulares/notebooks so 'cabo iphone' or 'carregador samsung' lands here)
  if (hasKeyword(t, [
    'carregador', 'cabo usb', 'cabo hdmi', 'cabo lightning', 'cabo tipo c', 'cabo type c',
    'cabo de forca', 'cabo de rede', 'fonte carregador', 'fonte turbo', 'power bank',
    'powerbank', 'bateria portatil', 'adaptador usb', 'hub usb', 'filtro de linha',
    'extensao eletrica', 'tomada inteligente', 'nobreak', 'estabilizador', 'magsafe'
  ])) {
    return 'carregadores-e-cabos';
  }

  // 2. Smartwatches e pulseiras inteligentes (checked BEFORE celulares so 'apple watch' / 'galaxy watch' lands here)
  if (hasKeyword(t, [
    'smartwatch', 'smart watch', 'relogio inteligente', 'galaxy watch', 'apple watch',
    'mi band', 'smartband', 'smart band', 'amazfit', 'redmi watch', 'huawei watch',
    'garmin', 'forerunner', 'haylou', 'zeblaze', 'colmi', 'pulseira inteligente'
  ])) {
    return 'smartwatches';
  }

  // 3. Produtos Gamer (checked BEFORE audio/informatica so 'headset gamer' / 'teclado gamer' / 'monitor gamer' / 'cadeira gamer' lands here)
  if (hasKeyword(t, [
    'gamer', 'playstation', 'ps5', 'ps4', 'xbox', 'nintendo', 'nintendo switch',
    'dualsense', 'dualshock', 'joystick', 'controle sem fio', 'volante gamer',
    'cadeira gamer', 'mesa gamer', 'headset gamer', 'mousepad', 'placa de captura',
    'steam deck', 'rog ally', 'console', 'rtx', 'geforce', 'radeon'
  ])) {
    return 'produtos-gamer';
  }

  // 4. Caixas de som, fones e áudio inteligente
  if (hasKeyword(t, [
    'caixa de som', 'caixinha de som', 'fone', 'fones', 'headphone', 'earphone',
    'earbuds', 'headset', 'bluetooth speaker', 'airpods', 'galaxy buds', 'jbl',
    'boombox', 'partybox', 'soundcore', 'edifier', 'echo dot', 'echo pop', 'echo show',
    'alexa', 'microfone', 'caixa amplificada', 'torre de som', 'home theater', 'soundbar',
    'tws', 'tune 520', 'tune 720', 'flip 6', 'charge 5', 'go 3', 'go 4'
  ])) {
    return 'caixas-de-som-e-fones';
  }

  // 5. TVs e Smart TVs
  if (hasKeyword(t, [
    'smart tv', 'televisor', 'televisao', 'tv led', 'tv qled', 'tv oled', 'tv 4k',
    'tv 32', 'tv 43', 'tv 50', 'tv 55', 'tv 65', 'tv 75', 'android tv', 'google tv',
    'roku', 'chromecast', 'fire tv', 'mi tv', 'mi box', 'tv box', 'apple tv',
    'suporte de tv', 'suporte para tv', 'conversor digital', 'antena digital', 'tv'
  ])) {
    return 'tvs-e-smart-tvs';
  }

  // 6. Eletrodomésticos e casa inteligente
  if (hasKeyword(t, [
    'air fryer', 'airfryer', 'fritadeira', 'aspirador', 'robo aspirador', 'cafeteira',
    'dolce gusto', 'nespresso', 'micro ondas', 'microondas', 'geladeira', 'refrigerador',
    'freezer', 'lavadora', 'maquina de lavar', 'lava e seca', 'tanquinho', 'secadora',
    'liquidificador', 'batedeira', 'mixer', 'processador de alimentos', 'multiprocessador',
    'sanduicheira', 'grill', 'chaleira eletrica', 'ferro de passar', 'vaporizador',
    'ventilador', 'circulador de ar', 'ar condicionado', 'climatizador', 'umidificador',
    'purificador de agua', 'bebedouro', 'forno eletrico', 'cooktop', 'fogao',
    'panela eletrica', 'panela de pressao eletrica', 'escova secadora', 'secador de cabelo',
    'chapinha', 'prancha de cabelo', 'barbeador', 'aparador de pelos', 'eletrodomestico'
  ])) {
    return 'eletrodomesticos';
  }

  // 7. Notebooks e Computadores
  if (hasKeyword(t, [
    'notebook', 'macbook', 'laptop', 'computador', 'desktop', 'all in one',
    'ideapad', 'inspiron', 'vivobook', 'thinkpad', 'chromebook', 'imac', 'mac mini',
    'mini pc', 'pc completo', 'pc escritorio', 'ultrabook', 'base cooler'
  ])) {
    return 'notebooks-e-computadores';
  }

  // 8. Informática e Periféricos
  if (hasKeyword(t, [
    'monitor', 'ssd', 'nvme', 'hd externo', 'pendrive', 'pen drive', 'cartao de memoria',
    'microsd', 'memoria ram', 'roteador', 'repetidor', 'wi fi mesh', 'switch de rede',
    'impressora', 'multifuncional', 'scanner', 'webcam', 'teclado', 'mouse',
    'placa mae', 'placa de video', 'processador', 'ryzen', 'intel core', 'gabinete',
    'water cooler', 'mesa digitalizadora', 'toner', 'cartucho'
  ])) {
    return 'informatica';
  }

  // 9. Celulares e Acessórios
  if (hasKeyword(t, [
    'iphone', 'galaxy s', 'galaxy a', 'galaxy m', 'galaxy z', 'celular', 'smartphone',
    'redmi', 'redmi note', 'poco', 'moto g', 'moto e', 'motorola edge', 'motorola',
    'xiaomi', 'realme', 'infinix', 'capinha', 'capa para celular', 'capa iphone',
    'capa samsung', 'pelicula', 'suporte veicular', 'suporte celular', 'ring light'
  ])) {
    return 'celulares-e-acessorios';
  }

  return 'todos-os-eletronicos';
}

/**
 * Searches Mercado Livre MLB official public endpoint
 */
export async function searchMercadoLivre(query: string, limit = 10): Promise<{ items: MLSearchResultItem[]; error?: string }> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encoded}&limit=${limit}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Mercado Livre API respondeu com status ${res.status}`);
    }

    const data = await res.json();
    const rawResults = data.results || [];

    const items: MLSearchResultItem[] = rawResults.map((item: any) => {
      // High-res image conversion if thumbnail has -I.jpg or similar
      let highResImg = item.thumbnail || '';
      if (highResImg.includes('-I.jpg')) {
        highResImg = highResImg.replace('-I.jpg', '-O.jpg');
      }

      // Brand search in attributes
      let brand = 'Mercado Livre';
      if (Array.isArray(item.attributes)) {
        const brandAttr = item.attributes.find((a: any) => a.id === 'BRAND');
        if (brandAttr && brandAttr.value_name) {
          brand = brandAttr.value_name;
        }
      }

      return {
        id: item.id,
        title: item.title,
        price: item.price,
        original_price: item.original_price,
        currency_id: item.currency_id,
        thumbnail: highResImg,
        permalink: item.permalink,
        condition: item.condition,
        brand,
        attributes: item.attributes,
      };
    });

    return { items };
  } catch (err: any) {
    console.warn('Erro ao consultar API do Mercado Livre:', err);
    return {
      items: [],
      error: err.message || 'Não foi possível conectar à API do Mercado Livre. Verifique sua conexão ou tente buscar por outros termos.',
    };
  }
}

/**
 * Fetches single item from Mercado Livre API by Item ID (e.g. MLB123456789)
 */
export async function getMercadoLivreItem(itemId: string): Promise<{ item?: MLSearchResultItem; error?: string }> {
  try {
    const cleanId = itemId.trim().toUpperCase();
    const res = await fetch(`https://api.mercadolibre.com/items/${cleanId}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Item ${cleanId} não encontrado no Mercado Livre (${res.status})`);
    }

    const data = await res.json();
    let highResImg = '';
    if (data.pictures && data.pictures.length > 0) {
      highResImg = data.pictures[0].secure_url || data.pictures[0].url;
    } else {
      highResImg = (data.thumbnail || '').replace('-I.jpg', '-O.jpg');
    }

    let brand = 'Mercado Livre';
    if (Array.isArray(data.attributes)) {
      const brandAttr = data.attributes.find((a: any) => a.id === 'BRAND');
      if (brandAttr && brandAttr.value_name) {
        brand = brandAttr.value_name;
      }
    }

    return {
      item: {
        id: data.id,
        title: data.title,
        price: data.price,
        original_price: data.original_price,
        currency_id: data.currency_id,
        thumbnail: highResImg,
        permalink: data.permalink,
        condition: data.condition,
        brand,
        attributes: data.attributes,
      },
    };
  } catch (err: any) {
    return {
      error: err.message || 'Erro ao buscar item pelo código do Mercado Livre.',
    };
  }
}

/**
 * Converts ML Search Item into a Tech Oferta Product structure
 */
export function convertMlItemToProduct(item: MLSearchResultItem, affiliateCustomTag = 'affiliate_techoferta'): Omit<Product, 'id' | 'updatedAt'> {
  let affiliateUrl = item.permalink;
  if (!affiliateUrl.includes('origin=')) {
    affiliateUrl += (affiliateUrl.includes('?') ? '&' : '?') + `origin=${affiliateCustomTag}`;
  }

  const category = guessCategory(item.title);
  
  let discountPercent: number | undefined;
  let prevPrice: number | undefined;

  if (item.original_price && item.original_price > item.price) {
    prevPrice = item.original_price;
    discountPercent = Math.round(((item.original_price - item.price) / item.original_price) * 100);
  }

  // Extract specs from attributes
  const specs: string[] = [];
  if (Array.isArray(item.attributes)) {
    const importantAttributes = ['MODEL', 'LINE', 'PROCESSOR_MODEL', 'RAM', 'STORAGE_CAPACITY', 'BATTERY_CAPACITY', 'SCREEN_SIZE', 'RESOLUTION', 'AUDIO_POWER'];
    item.attributes.forEach(attr => {
      if (importantAttributes.includes(attr.id) && attr.value_name) {
        specs.push(`${attr.name}: ${attr.value_name}`);
      }
    });
  }

  if (specs.length === 0) {
    specs.push('Produto 100% Original Mercado Livre');
    specs.push('Envio rápido com Compra Garantida');
    specs.push('Garantia oficial do fabricante');
  }

  return {
    name: item.title,
    brand: item.brand || 'Original',
    category,
    description: `Aproveite esta oferta verificada no Mercado Livre. Produto de alta qualidade, garantido e com excelente avaliação dos compradores.`,
    specs: specs.slice(0, 5),
    image: item.thumbnail,
    price: item.price,
    prevPrice,
    discountPercent,
    affiliateUrl,
    isFeatured: false,
    isBestSeller: false,
    isSpecialOffer: discountPercent !== undefined && discountPercent >= 20,
    isActive: true,
    rating: 4.8,
    mlItemId: item.id,
  };
}
