import { Article } from '../types';

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-caixas-bluetooth',
    title: 'Melhores Caixas de Som Bluetooth em 2026: Potência, Graves e Custo-Benefício',
    slug: 'melhores-caixas-de-som-bluetooth',
    image: './images/article_bluetooth_speakers.jpg',
    category: 'Caixas de som e fones',
    readTime: '6 min de leitura',
    date: '08 Nov 2026',
    summary: 'Guia completo para escolher a caixa de som ideal: entenda sobre potência RMS, certificação contra água IP67, bateria e os modelos mais vantajosos no Mercado Livre.',
    keywords: ['caixa de som bluetooth', 'jbl flip 6', 'jbl boombox', 'melhor caixa bluetooth', 'som potente'],
    content: [
      {
        subtitle: '1. Potência RMS real vs Potência de Pico',
        text: 'Ao buscar uma caixa de som, muitos anúncios destacam potências absurdas como 1000W PMPO. O que realmente importa para a fidelidade sonora é a potência RMS contínua. Para ambientes internos ou reuniões pequenas, modelos entre 20W e 40W RMS (como a JBL Flip 6) entregam volume cristalino sem distorção. Já para áreas abertas ou festas à beira da piscina, procure equipamentos acima de 100W RMS.',
      },
      {
        subtitle: '2. Resistência à Água e Poeira: Entenda a sigla IP',
        text: 'Caixas de som com certificação IPX7 suportam submersão temporária de até 1 metro em água doce por 30 minutos. Já a certificação IP67 adiciona proteção total contra poeira e areia, sendo a escolha ideal para praia e churrascos.',
      },
      {
        subtitle: '3. Nossas Recomendações em Oferta',
        text: 'Se você busca portabilidade e clareza vocal, a linha JBL Flip é imbatível na faixa dos R$ 400 a R$ 500. Para quem não abre mão de graves profundos e conexão Wi-Fi com Dolby Atmos, a JBL Boombox 3 Wi-Fi é o modelo definitivo.',
        recommendedProductIds: ['prod-jbl-flip-6', 'prod-jbl-boombox-3'],
      },
    ],
  },
  {
    id: 'art-como-escolher-notebook',
    title: 'Como Escolher um Notebook em 2026 Sem Gastar Dinheiro à Toa',
    slug: 'como-escolher-notebook',
    image: './images/hero_tech_oferta.jpg',
    category: 'Notebooks e computadores',
    readTime: '7 min de leitura',
    date: '07 Nov 2026',
    summary: 'Saiba quais especificações priorizar: processador, memória RAM mínima para 2026, por que nunca comprar notebook sem SSD NVMe e como economizar no Mercado Livre.',
    keywords: ['notebook dell', 'como escolher notebook', 'notebook para estudo', 'notebook custo beneficio'],
    content: [
      {
        subtitle: '1. Processador: A base do seu rendimento',
        text: 'Evite processadores Celeron ou versões antigas anteriores à 11ª geração Intel ou Ryzen série 4000. Para um uso fluido que dure pelos próximos 4 anos, a escolha segura começa no Intel Core i5 ou AMD Ryzen 5, que contam com múltiplos núcleos e alta eficiência energética.',
      },
      {
        subtitle: '2. Memória RAM: O novo padrão mínimo é 16GB',
        text: 'Com os navegadores modernos consumindo cada vez mais recursos e o Windows 11 em operação, 8GB de RAM rapidamente chegam ao limite ao abrir várias abas e planilhas. Dê preferência a notebooks que já venham com 16GB de fábrica ou que possuam slot livre para expansão.',
      },
      {
        subtitle: '3. Armazenamento SSD NVMe é inegociável',
        text: 'Esqueça HDs mecânicos tradicionais. O SSD NVMe M.2 inicializa o computador em menos de 10 segundos e abre programas instantaneamente. Um modelo de 512GB é o equilíbrio ideal entre custo e espaço para arquivos e softwares.',
        recommendedProductIds: ['prod-dell-inspiron-15'],
      },
    ],
  },
  {
    id: 'art-guia-smart-tv',
    title: 'O Que Observar Antes de Comprar uma Smart TV 4K: OLED, QLED ou LED?',
    slug: 'guia-smart-tv-4k',
    image: './images/article_smart_tv.jpg',
    category: 'TVs e Smart TVs',
    readTime: '8 min de leitura',
    date: '05 Nov 2026',
    summary: 'Entenda as diferenças reais entre tecnologias de tela, taxa de 120Hz para consoles da nova geração (PS5/Xbox) e recursos que fazem a diferença na sala de estar.',
    keywords: ['smart tv 4k', 'lg oled', 'samsung crystal', 'tv para ps5', 'melhor smart tv'],
    content: [
      {
        subtitle: '1. Diferenças entre Painéis: Preto Puro vs Brilho Intenso',
        text: 'As TVs OLED possuem pixels que acendem e apagam individualmente, gerando contraste infinito e preto absoluto. Se você assiste filmes com as luzes apagadas ou joga à noite, a imagem de uma OLED (como a LG C3) é revolucionária. Já se a sua sala for muito iluminada com luz solar direta, painéis QLED ou LED de alto brilho garantem excelente visibilidade.',
      },
      {
        subtitle: '2. 60Hz vs 120Hz e Entradas HDMI 2.1',
        text: 'Para novelas, streaming e canais abertos, 60Hz é suficiente. No entanto, se você possui um PlayStation 5, Xbox Series X ou PC Gamer conectado na TV, a taxa de 120Hz e portas HDMI 2.1 com VRR (Variable Refresh Rate) proporcionam fluidez extrema sem rasgos na tela.',
      },
      {
        subtitle: '3. Sistema Operacional e Aplicativos',
        text: 'Tanto o webOS da LG quanto o Tizen da Samsung oferecem suporte a todos os principais aplicativos de streaming brasileiros (Globoplay, Netflix, Prime Video, Disney+, Max) e contam com integração com assistentes de voz.',
        recommendedProductIds: ['prod-smart-tv-lg-oled-55', 'prod-smart-tv-samsung-50'],
      },
    ],
  },
  {
    id: 'art-carregador-rapido',
    title: 'Carregador Rápido GaN: Como Escolher a Potência Certa Sem Danificar a Bateria',
    slug: 'como-escolher-carregador-rapido',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80',
    category: 'Carregadores e cabos',
    readTime: '5 min de leitura',
    date: '04 Nov 2026',
    summary: 'Descubra como a tecnologia de Nitreto de Gálio (GaN) substituiu o silício, reduzindo o calor e permitindo carregar múltiplos aparelhos com apenas um adaptador.',
    keywords: ['carregador gan', 'carregador anker', 'carregador rapido iphone', 'carregador samsung 45w'],
    content: [
      {
        subtitle: '1. O que é a tecnologia GaN?',
        text: 'Nitreto de Gálio (GaN) é um material semicondutor que conduz elétrons com muito mais eficiência do que o silício convencional. Isso permite componentes menores, menos dissipação de calor e potências de 65W a 100W em fontes do tamanho de uma caixa de fósforos.',
      },
      {
        subtitle: '2. Carregador potente estraga a bateria do celular?',
        text: 'Mito! Dispositivos modernos utilizam protocolos inteligentes como Power Delivery (PD) e PPS. O smartphone se comunica com o carregador e solicita exatamente a voltagem e amperagem seguras para o estado atual da bateria. Conectar um carregador de 65W em um celular que aceita no máximo 25W é 100% seguro.',
        recommendedProductIds: ['prod-anker-nano-65w'],
      },
    ],
  },
  {
    id: 'art-setup-gamer',
    title: 'Guia Setup Gamer 2026: Periféricos Essenciais e Onde Vale a Pena Investir',
    slug: 'guia-setup-gamer',
    image: './images/article_gaming_setup.jpg',
    category: 'Produtos gamer',
    readTime: '6 min de leitura',
    date: '02 Nov 2026',
    summary: 'Dicas práticas para escolher mouse com sensor sem atraso, teclado mecânico com switches duráveis e monitor de alta taxa de atualização com o melhor custo-benefício.',
    keywords: ['setup gamer', 'mouse g502', 'teclado mecanico sem fio', 'monitor 144hz', 'ofertas gamer'],
    content: [
      {
        subtitle: '1. Sensor do Mouse: O segredo da mira precisa',
        text: 'Em jogos competitivos como Valorant, CS2 e Fortnite, a precisão do sensor sem aceleração de hardware e sem perda de rastreio em movimentos rápidos faz toda a diferença. Modelos consagrados como o Logitech G502 com sensor HERO 25K continuam sendo referências globais.',
      },
      {
        subtitle: '2. Teclado Mecânico: Layout e Switches',
        text: 'Teclados compactos Tenkeyless (TKL) ou 60% liberam espaço valioso na mesa para mover o mouse com baixas sensibilidades. Switches táteis (como Brown) oferecem feedback sem o barulho excessivo dos switches Blue.',
      },
      {
        subtitle: '3. Monitor 144Hz IPS: O upgrade mais perceptível',
        text: 'Passar de um monitor padrão de 60Hz para 144Hz IPS com 1ms de resposta é como tirar uma venda dos olhos: toda movimentação fica nítida e as reações tornam-se instantâneas.',
        recommendedProductIds: ['prod-teclado-logitech-pro-x', 'prod-mouse-g502-hero', 'prod-monitor-lg-ultragear-27'],
      },
    ],
  },
];
