import React from 'react';
import { 
  Share2, 
  Lock, 
  ShieldCheck, 
  ExternalLink, 
  Mail, 
  HelpCircle,
  FileText,
  Heart
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { ActiveView, CategoryId } from '../types';

interface FooterProps {
  onNavigate: (view: ActiveView, cat?: CategoryId | null) => void;
  onOpenAdmin: () => void;
  onOpenShareModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAdmin, onOpenShareModal }) => {
  return (
    <footer className="bg-[#0b0b0f] border-t border-zinc-800/90 text-zinc-400 text-xs">
      
      {/* Transparency Affiliate Disclaimer Banner */}
      <div className="bg-[#101017] border-b border-zinc-800/70 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-start sm:items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-zinc-300 leading-relaxed text-[11px] sm:text-xs">
              <strong className="text-white">Aviso de Transparência: </strong>
              O Tech Oferta participa de programas de afiliados. Podemos receber comissões por compras realizadas através dos links divulgados em nosso site, sem custo adicional para o consumidor.
            </p>
          </div>
          <button
            onClick={onOpenShareModal}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartilhar Portal</span>
          </button>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                <svg className="w-4 h-4 text-zinc-950 font-black" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-lg font-black tracking-tight text-white">
                TECH <span className="text-amber-400">OFERTA</span>
              </span>
            </div>

            <p className="text-zinc-400 text-xs leading-relaxed font-normal">
              Portal independente especializado em garimpar, verificar e divulgar as melhores ofertas, promoções e descontos de eletrônicos e tecnologia no Mercado Livre.
            </p>

            <div className="text-[11px] text-zinc-400 font-medium">
              <span className="text-amber-400 font-semibold">Slogan Oficial:</span>
              <p className="italic text-zinc-300 mt-0.5">"A tecnologia que você quer, pelo preço que você procura."</p>
            </div>
          </div>

          {/* Categories 1-5 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-amber-400">
              Categorias Principais
            </h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 5).map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => onNavigate('category', cat.id)}
                    className="hover:text-amber-400 transition-colors text-left truncate max-w-full cursor-pointer"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories 6-10 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-amber-400">
              Mais Tecnologias
            </h4>
            <ul className="space-y-2">
              {CATEGORIES.slice(5).map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => onNavigate('category', cat.id)}
                    className="hover:text-amber-400 transition-colors text-left truncate max-w-full cursor-pointer"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider text-amber-400">
              Institucional & Ajuda
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Sobre Nós
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contato & Fale Conosco
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Política de Privacidade (LGPD)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Termos de Uso
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('articles')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Artigos e Dicas de Compra
                </button>
              </li>
              <li className="pt-2">
                <button
                  onClick={onOpenAdmin}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Acesso Administrativo</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
          <div>
            © {new Date().getFullYear()} TECH OFERTA. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4">
            <span>Mercado Livre Afiliado Oficial</span>
            <span>·</span>
            <span>Segurança SSL 256-bit</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
