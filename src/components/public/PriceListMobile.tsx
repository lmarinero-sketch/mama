import React from 'react';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useApp } from '../../context/AppContext';
import { Plus, ShoppingBag, MessageCircle } from 'lucide-react';

interface PriceListMobileProps {
  products: Product[];
}

export const PriceListMobile: React.FC<PriceListMobileProps> = ({ products }) => {
  const { addToCart, categories } = useApp();

  const getCategoryName = (catId?: string) => {
    return categories.find((c) => c.id === catId)?.name || 'General';
  };

  return (
    <div className="bg-white rounded-2xl shadow-mobile-card border border-rose-100/80 overflow-hidden">
      <div className="bg-gradient-to-r from-deli-600 to-rose-500 p-3.5 text-white flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm tracking-tight">📋 Lista de Precios Actualizada</h3>
          <p className="text-[11px] text-rose-100">Precios por 100g / Kg / Unidad</p>
        </div>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
          {products.length} productos
        </span>
      </div>

      <div className="divide-y divide-rose-50">
        {products.map((product) => (
          <div
            key={product.id}
            className="p-3 flex items-center justify-between gap-3 hover:bg-rose-50/40 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-bold text-slate-900 text-xs truncate font-sans">
                  {product.name}
                </span>
                {product.badge_text && (
                  <span className="text-[9px] font-extrabold bg-rose-100 text-deli-700 px-1.5 py-0.2 rounded-md">
                    {product.badge_text}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                {getCategoryName(product.category_id)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-extrabold text-deli-700 text-sm">
                  {formatCurrency(product.price)}
                </div>
                <div className="text-[9px] font-semibold text-slate-400">
                  / {product.unit}
                </div>
              </div>

              <button
                onClick={() => addToCart(product, 1)}
                className="w-8 h-8 rounded-xl bg-deli-50 hover:bg-deli-100 text-deli-700 flex items-center justify-center font-bold text-xs active:scale-90 transition-all border border-deli-200/60"
                title="Agregar 1 unidad al pedido"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
