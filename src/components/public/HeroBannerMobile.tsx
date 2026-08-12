import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, MessageCircle, ArrowDown } from 'lucide-react';
import { buildWhatsappLink } from '../../lib/utils';

export const HeroBannerMobile: React.FC = () => {
  const { heroContent, storeInfo } = useApp();

  const handleWhatsappClick = () => {
    const link = buildWhatsappLink(
      heroContent.whatsapp_number || storeInfo.whatsapp_number,
      "¡Hola! Quisiera realizar una consulta sobre las ofertas de hoy en Fiambrería Mamá."
    );
    window.open(link, '_blank');
  };

  const scrollToCatalog = () => {
    const catalogEl = document.getElementById('catalogo-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="px-4 pt-3 pb-2 max-w-md mx-auto">
      <div className="relative rounded-3xl overflow-hidden shadow-mobile-card bg-gradient-to-br from-rose-100/80 via-cream-100 to-amber-100/60 border border-rose-200/50 p-5">
        {/* Decorative pastel circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-rose-200/40 blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-amber-200/40 blur-xl pointer-events-none" />

        <div className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 shadow-sm border border-rose-200/80 text-deli-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Calidad & Frescura Garantizada</span>
          </div>

          {/* Dynamic Editable Title */}
          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight mb-2 font-sans">
            {heroContent.title}
          </h2>

          {/* Dynamic Editable Subtitle */}
          <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
            {heroContent.subtitle}
          </p>

          {/* Banner Image Preview */}
          {heroContent.banner_image && (
            <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-4 shadow-sm border border-white/80 group">
              <img
                src={heroContent.banner_image}
                alt="Banner Fiambrería"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] font-semibold text-white/90 bg-slate-900/50 backdrop-blur-md px-2.5 py-1 rounded-lg">
                  📍 {storeInfo.address}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={scrollToCatalog}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-deli-600 to-rose-500 text-white font-bold text-xs shadow-md shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <span>{heroContent.cta_text || "Ver Lista de Precios"}</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleWhatsappClick}
              className="py-3 px-3.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-1 hover:bg-emerald-600"
              title="Pedir por WhatsApp"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
            </button>
          </div>

          {/* Delivery Note */}
          {storeInfo.delivery_note && (
            <div className="mt-3 text-center">
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
                🚚 {storeInfo.delivery_note}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
