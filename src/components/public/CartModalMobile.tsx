import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, buildWhatsappLink } from '../../lib/utils';
import { X, Trash2, MessageCircle, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartModalMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModalMobile: React.FC<CartModalMobileProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, clearCart, storeInfo } = useApp();
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSendOrderWhatsapp = () => {
    if (cart.length === 0) return;

    let text = `¡Hola Fiambrería Mamá! 🥓\n\nQuisiera realizar el siguiente pedido:\n\n`;
    
    cart.forEach((item, idx) => {
      const unitText = item.product.unit === '100g' ? `${item.quantity * 100}g` : `${item.quantity} ${item.product.unit}`;
      const itemSubtotal = formatCurrency(item.product.price * item.quantity);
      text += `${idx + 1}. *${item.product.name}* (${unitText}) -> ${itemSubtotal}\n`;
    });

    text += `\n💰 *TOTAL ESTIMADO:* ${formatCurrency(totalAmount)}\n`;
    if (customerName.trim()) {
      text += `👤 *Cliente:* ${customerName}\n`;
    }
    if (notes.trim()) {
      text += `📝 *Aclaración:* ${notes}\n`;
    }

    text += `\n¿Me confirman disponibilidad y horario de retiro/envío? ¡Muchas gracias!`;

    const link = buildWhatsappLink(storeInfo.whatsapp_number, text);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 animate-slideUp">
        {/* Drawer Handle & Header */}
        <div className="p-4 bg-gradient-to-r from-rose-50 to-cream-100 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-deli-600 text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Tu Pedido de Fiambres</h3>
              <p className="text-[11px] text-slate-500">{cart.length} ítems seleccionados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white text-slate-400 hover:text-slate-700 shadow-xs border border-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-deli-500 mx-auto flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-800 text-sm mb-1">El carrito está vacío</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Selecciona tus fiambres y quesos favoritos del catálogo para armar tu pedido.
              </p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3 pb-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-3 bg-cream-50 p-3 rounded-2xl border border-rose-100/60"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-deli-700">
                          {item.product.unit === '100g' ? `${item.quantity * 100}g` : `${item.quantity} ${item.product.unit}`}
                        </span>
                        <span>•</span>
                        <span>{formatCurrency(item.product.price * item.quantity)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-rose-400 hover:text-rose-600 rounded-xl hover:bg-rose-100/50 transition-colors"
                      title="Eliminar del pedido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={clearCart}
                  className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold underline block text-center w-full pt-1"
                >
                  Vaciar todo el pedido
                </button>
              </div>

              {/* Extra Inputs */}
              <div className="pt-3 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tu Nombre (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: María Pérez"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-deli-500/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Aclaraciones sobre el corte (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Jamón feteado bien finito / Sin grasa"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-deli-500/40"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with Total & Send Order WA */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-rose-100 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Subtotal Estimado:</span>
              <span className="text-lg font-extrabold text-deli-700">{formatCurrency(totalAmount)}</span>
            </div>

            <button
              onClick={handleSendOrderWhatsapp}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>ENVIAR PEDIDO POR WHATSAPP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
