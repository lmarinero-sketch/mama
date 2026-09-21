import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import { MobileProductModal } from '../components/admin/MobileProductModal';
import { Product, ProductPriceHistory } from '../types';
import { formatCurrency } from '../lib/utils';
import { fetchPriceHistory } from '../lib/orders';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  History,
  TrendingUp,
  TrendingDown,
  X,
  Percent,
  DollarSign
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const { products, categories, saveProduct, deleteProduct } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [search, setSearch] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Estados para Modal de Historial de Precios
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<ProductPriceHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'todos') {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat && p.category_id !== cat.id) return false;
    }
    if (search.trim()) {
      return p.name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const handleToggleAvailable = async (p: Product) => {
    await saveProduct({ ...p, is_available: !p.is_available });
  };

  const handleToggleFeatured = async (p: Product) => {
    await saveProduct({ ...p, is_featured: !p.is_featured });
  };

  const handleOpenPriceHistory = async (product: Product) => {
    setHistoryProduct(product);
    setLoadingHistory(true);
    const history = await fetchPriceHistory(product.id);
    setPriceHistory(history);
    setLoadingHistory(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark pb-28 max-w-lg mx-auto relative border-x border-brand-secondary/40">
      {/* Header Fijo */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-brand-secondary/80 p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-brown text-white flex items-center justify-center font-bold shadow-soft">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-brand-dark leading-tight">
                Fiambres, Quesos & Precios
              </h2>
              <p className="text-[11px] text-brand-dark/70 font-medium">
                {filteredProducts.length} productos en catálogo
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            className="py-2 px-3 rounded-xl bg-brand-brown hover:bg-brand-brown/90 text-white font-extrabold text-xs shadow-soft flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Producto</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar fiambre por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs border border-brand-secondary/90 focus:outline-none focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20 text-brand-dark placeholder:text-brand-dark/40 shadow-xs"
          />
          <Search className="w-4 h-4 text-brand-dark/40 absolute left-3 top-2.5" />
        </div>

        {/* Categorías */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'todos'
                ? 'bg-brand-brown text-white shadow-soft'
                : 'bg-white text-brand-dark/70 border border-brand-secondary/80'
            }`}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.slug
                  ? 'bg-brand-brown text-white shadow-soft'
                  : 'bg-white text-brand-dark/70 border border-brand-secondary/80'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Productos */}
      <main className="p-3.5 space-y-3">
        {filteredProducts.map((product) => {
          const cost = Number(product.cost_price || 0);
          const price = Number(product.price || 0);
          const profit = price - cost;
          const markup = cost > 0 ? ((profit / cost) * 100).toFixed(0) : '0';

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl p-3.5 shadow-soft border transition-all ${
                product.is_available ? 'border-brand-secondary/60 hover:border-brand-brown/40' : 'border-brand-secondary/40 opacity-65 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1524182576066-1d96117a7616?w=600&q=80'}
                    alt={product.name}
                    className="w-14 h-14 rounded-xl object-cover bg-brand-cream shrink-0 border border-brand-secondary/60"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-xs text-brand-dark truncate">
                        {product.name}
                      </h3>
                      {product.badge_text && (
                        <span className="text-[9px] font-black bg-brand-softYellow text-brand-brown px-1.5 py-0.2 rounded-md border border-brand-yellow shrink-0">
                          {product.badge_text}
                        </span>
                      )}
                    </div>

                    {/* Precios: Venta y Costo */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-black text-brand-brown text-sm font-mono">
                        {formatCurrency(price)}
                        <span className="text-[10px] text-brand-dark/60 font-normal">/{product.unit}</span>
                      </span>

                      {cost > 0 && (
                        <span className="text-[10px] text-brand-dark/60 font-mono">
                          Costo: <strong>{formatCurrency(cost)}</strong>
                        </span>
                      )}
                    </div>

                    {cost > 0 && (
                      <div className="text-[10px] text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-700" />
                        <span>Margen: +{markup}% ({formatCurrency(profit)} netos)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones de Edición e Historial */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenPriceHistory(product)}
                    className="p-2 rounded-xl bg-brand-softYellow/70 hover:bg-brand-softYellow text-brand-brown active:scale-95 transition-all border border-brand-yellow"
                    title="Ver Historial de Cambios de Precio"
                  >
                    <History className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-brand-cream hover:bg-brand-secondary/50 text-brand-dark active:scale-95 transition-all border border-brand-secondary"
                    title="Editar Producto"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-brand-secondary/40 text-[11px]">
                <button
                  onClick={() => handleToggleAvailable(product)}
                  className={`flex items-center gap-1 font-bold ${
                    product.is_available ? 'text-emerald-700' : 'text-brand-dark/40'
                  }`}
                >
                  {product.is_available ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Disponible</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Pausado</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleToggleFeatured(product)}
                  className={`flex items-center gap-1 font-bold ${
                    product.is_featured ? 'text-amber-600' : 'text-brand-dark/40'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${product.is_featured ? 'fill-amber-400' : ''}`} />
                  <span>{product.is_featured ? 'Destacado' : 'Normal'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </main>

      {/* MODAL HISTORIAL DE VARIACIONES DE PRECIO */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-soft-lg overflow-hidden animate-in slide-in-from-bottom duration-200 border border-brand-secondary">
            <div className="p-3.5 bg-brand-cream border-b border-brand-secondary/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-brown text-white flex items-center justify-center font-bold shadow-soft">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-brand-dark text-xs truncate max-w-[240px]">
                    Historial de Precios: {historyProduct.name}
                  </h3>
                  <p className="text-[10px] text-brand-dark/70">
                    Registro de variaciones y aumentos
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setHistoryProduct(null)}
                className="p-1 rounded-full text-brand-dark/60 hover:text-brand-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {loadingHistory ? (
                <div className="py-8 text-center text-xs text-brand-dark/60">
                  Cargando variaciones de precio...
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="py-8 text-center space-y-1">
                  <p className="text-xs text-brand-dark font-bold">Sin cambios de precio registrados aún.</p>
                  <p className="text-[11px] text-brand-dark/60">
                    Cada vez que modifiques el precio de venta o costo en "Editar", quedará registrado aquí automáticamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-brand-dark/70 font-bold px-1">
                    <span>{priceHistory.length} modificaciones de precio registradas</span>
                  </div>

                  {priceHistory.map((h, idx) => {
                    const isIncrease = h.variation_percentage > 0;
                    const isDecrease = h.variation_percentage < 0;

                    return (
                      <div key={h.id || idx} className="p-2.5 bg-brand-bg rounded-xl border border-brand-secondary/70 space-y-1 text-xs shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-brand-dark/70 font-medium">
                            📅 {new Date(h.changed_at).toLocaleDateString('es-AR')} {new Date(h.changed_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5 ${
                            isIncrease 
                              ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                              : isDecrease 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-brand-cream text-brand-dark/70'
                          }`}>
                            {isIncrease ? <TrendingUp className="w-3 h-3 text-rose-700" /> : isDecrease ? <TrendingDown className="w-3 h-3 text-emerald-700" /> : null}
                            {h.variation_percentage > 0 ? `+${h.variation_percentage}%` : `${h.variation_percentage}%`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center font-mono text-xs pt-1">
                          <span className="text-brand-dark/50 line-through">
                            {formatCurrency(h.old_price)}
                          </span>
                          <span className="text-brand-dark/40">➔</span>
                          <span className="font-black text-brand-brown text-sm">
                            {formatCurrency(h.new_price)}
                          </span>
                        </div>

                        {h.new_cost_price > 0 && (
                          <div className="text-[10px] text-brand-dark/70 flex justify-between pt-0.5 border-t border-brand-secondary/40">
                            <span>Costo anterior: {formatCurrency(h.old_cost_price)}</span>
                            <span>Costo nuevo: <strong className="text-brand-dark">{formatCurrency(h.new_cost_price)}</strong></span>
                          </div>
                        )}

                        {h.notes && (
                          <div className="text-[10px] text-brand-dark/60 italic pt-0.5">
                            {h.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar / Crear Producto */}
      <MobileProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={selectedProduct}
      />

      {/* Navegación Móvil Inferior */}
      <AdminBottomNav />
    </div>
  );
};
