import React, { useState } from 'react';
import { X, ShieldCheck, Mail, MessageSquare, Send, CheckCircle, Info, FileText } from 'lucide-react';
import { ActiveView } from '../types';

interface InstitutionalModalsProps {
  view: ActiveView;
  onClose: () => void;
}

export const InstitutionalModals: React.FC<InstitutionalModalsProps> = ({ view, onClose }) => {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (view !== 'about' && view !== 'contact' && view !== 'privacy' && view !== 'terms') {
    return null;
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#121217] border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0d0d12]">
          <h2 className="text-base font-black text-white font-display">
            {view === 'about' && 'Sobre o Tech Oferta'}
            {view === 'contact' && 'Fale Conosco · Contato'}
            {view === 'privacy' && 'Política de Privacidade'}
            {view === 'terms' && 'Termos de Uso do Portal'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 text-xs text-zinc-300 space-y-5 leading-relaxed">
          
          {/* ---------------- SOBRE NÓS ---------------- */}
          {view === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-medium">
                <strong className="text-white">Nossa Missão: </strong>
                Democratizar o acesso às melhores tecnologias e eletrônicos, filtrando preços inflacionados e trazendo apenas descontos reais e verificados no Mercado Livre.
              </div>

              <h3 className="text-sm font-bold text-white">Quem Somos?</h3>
              <p>
                O <strong>Tech Oferta</strong> nasceu com o objetivo de ser o seu radar diário de oportunidades em produtos eletrônicos e gadgets. Sabemos como é cansativo navegar por centenas de anúncios, desconfiar de promoções duvidosas e perder horas tentando saber se um desconto é verdadeiro.
              </p>

              <h3 className="text-sm font-bold text-white">Como Trabalhamos?</h3>
              <p>
                Nossa equipe monitora constantemente as oscilações de preço no Mercado Livre Brasil. Apenas produtos originais, de marcas consagradas (como JBL, Apple, Samsung, Dell, Sony, Logitech e Xiaomi), com avaliações positivas e lojas com reputação consolidada são listados no Tech Oferta.
              </p>

              <h3 className="text-sm font-bold text-white">Transparência Total</h3>
              <p>
                Não cobramos nada de nossos visitantes. Nos mantemos por meio de comissões de afiliados quando você conclui uma compra através de nossos links, sem pagar nenhum centavo a mais por isso.
              </p>
            </div>
          )}

          {/* ---------------- CONTATO ---------------- */}
          {view === 'contact' && (
            <div className="space-y-5">
              <p>
                Tem alguma dúvida sobre uma oferta divulgada, sugestão de produto ou deseja anunciar uma parceria? Preencha o formulário abaixo ou fale diretamente conosco pelo WhatsApp.
              </p>

              {sentSuccess ? (
                <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-700/80 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Mensagem Enviada com Sucesso!</h4>
                  <p className="text-zinc-400 text-[11px]">Nossa equipe responderá ao seu e-mail o mais breve possível.</p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Seu Nome Completo:</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: João da Silva"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Seu E-mail:</label>
                    <input
                      type="email"
                      required
                      placeholder="ex: joao@email.com"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Sua Mensagem:</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Como podemos te ajudar hoje?"
                      value={contactMsg}
                      onChange={e => setContactMsg(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-400/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Mensagem</span>
                  </button>
                </form>
              )}

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>contato@techoferta.com.br</span>
                </span>
                <span className="text-zinc-500">Atendimento seg. a sex.</span>
              </div>
            </div>
          )}

          {/* ---------------- PRIVACIDADE ---------------- */}
          {view === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">1. Tratamento de Dados (LGPD)</h3>
              <p>
                O Tech Oferta preza pela sua privacidade em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD). Nós não vendemos, alugamos ou comercializamos quaisquer dados pessoais de nossos visitantes.
              </p>

              <h3 className="text-sm font-bold text-white">2. Cookies e Rastreamento de Afiliados</h3>
              <p>
                Ao clicar em um link para o Mercado Livre, um cookie seguro de afiliado pode ser armazenado temporariamente em seu navegador pelo Mercado Livre para identificar que a indicação partiu do nosso portal. Esse cookie não armazena dados bancários, senhas ou informações sensíveis.
              </p>

              <h3 className="text-sm font-bold text-white">3. Isenção sobre Pagamentos</h3>
              <p>
                O Tech Oferta <strong>não processa pagamentos</strong> e não solicita números de cartão de crédito. Toda a transação de compra ocorre diretamente dentro do ambiente seguro e criptografado do Mercado Livre com garantia do Mercado Pago.
              </p>
            </div>
          )}

          {/* ---------------- TERMOS DE USO ---------------- */}
          {view === 'terms' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">1. Aceitação dos Termos</h3>
              <p>
                Ao navegar no Tech Oferta, você concorda com estes termos de uso. O site atua estritamente como um portal informativo e divulgador de ofertas do Mercado Livre.
              </p>

              <h3 className="text-sm font-bold text-white">2. Preços e Disponibilidade de Estoque</h3>
              <p>
                Os preços, cupons e condições de parcelamento divulgados refletem o momento de verificação da oferta. Devido à dinâmica do comércio eletrônico e ações dos vendedores no Mercado Livre, os preços e estoques podem variar ou se esgotar sem aviso prévio. Sempre confirme o valor final diretamente no site do Mercado Livre antes de concluir a compra.
              </p>

              <h3 className="text-sm font-bold text-white">3. Responsabilidade sobre Entrega e Garantia</h3>
              <p>
                A entrega, emissão de nota fiscal, suporte pós-venda e garantia dos produtos adquiridos são de responsabilidade exclusiva dos vendedores e do Mercado Livre.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
