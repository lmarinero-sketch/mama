import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import { MobileProductModal } from '../components/admin/MobileProductModal';
import { Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Star, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  ListFilter
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const { products, categories, saveProduct, deleteProduct } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [search, setSearch] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

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

  return (
    <div className="min-h-screen bg-cream-50 pb-24 max-w-md mx-auto relative border-x border-rose-100/40">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-header border-b border-rose-100/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-deli-600 text-white flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 font-sans">
                Gestión de Productos
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                {filteredProducts.length} productos en lista
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsModalOpen(true);
            }}
            className="py-2 px-3 rounded-xl bg-deli-600 hover:bg-deli-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-deli-500/40 text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Category Pills Filter */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedCategory('todos')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'todos'
                ? 'bg-deli-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
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
                  ? 'bg-deli-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <main className="p-4 space-y-3">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-2xl p-3 shadow-mobile-card border transition-all ${
              product.is_available ? 'border-rose-100/80' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-12 h-12 rounded-xl object-cover bg-cream-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-xs text-slate-900 truncate">
                      {product.name}
                    </h3>
                    {product.badge_text && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
                        {product.badge_text}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-extrabold text-deli-700 text-xs">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">/{product.unit}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedProduct(product);
                  setIsModalOpen(true);
                }}
                className="p-2 rounded-xl bg-cream-100 hover:bg-rose-100 text-deli-700 active:scale-95"
                title="Editar"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Status Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
              <button
                onClick={() => handleToggleAvailable(product)}
                className={`flex items-center gap-1 font-bold ${
                  product.is_available ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {product.is_available ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>En Stock (Público)</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Pausado (Oculto)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleToggleFeatured(product)}
                className={`flex items-center gap-1 font-bold ${
                  product.is_featured ? 'text-amber-500' : 'text-slate-400'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${product.is_featured ? 'fill-amber-400' : ''}`} />
                <span>{product.is_featured ? 'Destacado' : 'Normal'}</span>
              </button>
            </div>
          </div>
        ))}
      </main>

      <MobileProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={selectedProduct}
      />

      <AdminBottomNav />
    </div>
  );
};
