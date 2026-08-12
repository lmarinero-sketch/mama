import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency, getFallbackImage, buildWhatsappLink } from '../../lib/utils';
import { Plus, Minus, ShoppingBag, Check, MessageCircle } from 'lucide-react';

interface ProductCardMobileProps {
  product: Product;
}

export const ProductCardMobile: React.FC<ProductCardMobileProps> = ({ product }) => {
  const { addToCart, storeInfo } = useApp();
  const [quantity, setQuantity] = useState<number>(1);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  const handleAdd = () => {
    addToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 1500);
  };

  const handleQuickWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const qtyText = product.unit === '100g' ? `${quantity * 100}g` : `${quantity} ${product.unit}`;
    const text = `¡Hola! Quisiera encargar *${product.name}* (${qtyText}) por ${formatCurrency(product.price * quantity)}.`;
    window.open(buildWhatsappLink(storeInfo.whatsapp_number, text), '_blank');
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-mobile-card border border-rose-100/70 hover:border-rose-200 transition-all flex flex-col justify-between relative overflow-hidden group">
      {/* Badge Tag */}
      {product.badge_text && (
        <span className="absolute top-3 right-3 z-10 bg-gradient-to-r from-deli-600 to-rose-500 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
          {product.badge_text}
        </span>
      )}

      <div>
        {/* Product Image */}
        <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 bg-cream-100">
          <img
            src={product.image_url || getFallbackImage(product.name)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[11px] font-bold">
            {formatCurrency(product.price)} <span className="text-[9px] text-slate-300 font-normal">/ {product.unit}</span>
          </div>
        </div>

        {/* Product Details */}
        <h3 className="font-extrabold text-slate-900 text-sm leading-snug mb-1 font-sans line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-slate-500 leading-snug line-clamp-2 mb-3">
            {product.description}
          </p>
        )}
      </div>

      {/* Touch Quantity & Add Controls */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Counter */}
        <div className="flex items-center bg-cream-100 rounded-xl p-1 border border-slate-200/60">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-90 transition-all"
            aria-label="Disminuir"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center text-xs font-bold text-slate-800">
            {product.unit === '100g' ? `${quantity * 100}g` : quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs active:scale-90 transition-all"
            aria-label="Aumentar"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Add Button */}
        <div className="flex items-center gap-1.5 flex-1">
          <button
            onClick={handleAdd}
            className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 ${
              addedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-deli-600 text-white hover:bg-deli-700'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Agregado!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>+ Agregar</span>
              </>
            )}
          </button>

          {/* Direct WA Button */}
          <button
            onClick={handleQuickWhatsapp}
            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 active:scale-90 transition-all"
            title="Pedir este fiambre directo por WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-emerald-500" />
          </button>
        </div>
      </div>
    </div>
  );
};
