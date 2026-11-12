import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageCircle, 
  Send,
  Smartphone,
  Globe
} from 'lucide-react';
import { Product } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, product }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  // Determine URL to share
  // If in production/preview, use the current origin or public URL
  const baseUrl = window.location.origin;
  const shareUrl = product 
    ? `${baseUrl}/#produto-${product.id}`
    : baseUrl;

  // Format message for WhatsApp / Telegram
  let formattedMessage = '';
  if (product) {
    formattedMessage = `⚡ *OFERTA NO TECH OFERTA!*\n\n` +
      `📦 *${product.name}*\n` +
      `🏷️ Marca: ${product.brand}\n`;

    if (product.prevPrice && product.prevPrice > product.price) {
      formattedMessage += `💰 De: ~R$ ${product.prevPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}~\n`;
      formattedMessage += `🔥 *Por apenas: R$ ${product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;
      if (product.discountPercent) {
        formattedMessage += ` (${product.discountPercent}% OFF)\n\n`;
      } else {
        formattedMessage += `\n\n`;
      }
    } else {
      formattedMessage += `💰 *Preço: R$ ${product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n`;
    }

    formattedMessage += `👉 *Confira a oferta oficial aqui:*\n${shareUrl}\n\n` +
      `_Preço verificado em ${product.updatedAt}. Sujeito a alteração no Mercado Livre._`;
  } else {
    formattedMessage = `⚡ *TECH OFERTA* — A tecnologia que você quer, pelo preço que você procura!\n\n` +
      `Encontre as melhores ofertas e descontos verificados em celulares, notebooks, caixas de som e games no Mercado Livre!\n\n` +
      `👉 *Acesse o portal agora:*\n${shareUrl}`;
  }

  const whatsappWebUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedMessage)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(formattedMessage)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyFormattedText = async () => {
    try {
      await navigator.clipboard.writeText(formattedMessage);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = formattedMessage;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product ? product.name : 'Tech Oferta – Ofertas de Tecnologia',
          text: formattedMessage,
          url: shareUrl,
        });
      } catch (e) {
        // user cancelled or share failed
      }
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-[#131319] border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-display">
                {product ? 'Compartilhar Oferta' : 'Compartilhar o Tech Oferta'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Envie para amigos, grupos de ofertas ou redes sociais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Preview if sharing product */}
        {product && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 object-contain bg-white rounded p-1 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-zinc-100 truncate">{product.name}</div>
              <div className="text-xs font-black text-amber-400 tabular-nums mt-0.5">
                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                {product.discountPercent && (
                  <span className="ml-1.5 text-[10px] text-emerald-400 font-bold">
                    -{product.discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Primary Share Action Buttons (HTML <a> links — no popup blocker issues!) */}
        <div className="space-y-2.5">
          <a
            href={whatsappWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wide transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Compartilhar Direto no WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>

          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <Send className="w-4 h-4" />
            <span>Enviar no Telegram</span>
          </a>

          {/* Native Mobile Share Button (if supported) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Abrir Opções de Compartilhar do Celular</span>
            </button>
          )}
        </div>

        {/* Copy Tools */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-3">
          
          {/* Copy Direct Link */}
          <div>
            <label className="block text-zinc-400 text-[11px] font-semibold mb-1">
              Link direto para copiar:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 font-mono select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Copy Formatted Promo Text */}
          <button
            onClick={handleCopyFormattedText}
            className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Mensagem Copiada! Pronto para colar</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copiar Mensagem Pronta com Emojis</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
};
