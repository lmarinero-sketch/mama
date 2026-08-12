import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HeaderMobile } from '../components/public/HeaderMobile';
import { HeroBannerMobile } from '../components/public/HeroBannerMobile';
import { CategoryPills } from '../components/public/CategoryPills';
import { ProductCardMobile } from '../components/public/ProductCardMobile';
import { PriceListMobile } from '../components/public/PriceListMobile';
import { CartModalMobile } from '../components/public/CartModalMobile';
import { LayoutGrid, ListFilter, MapPin, Clock, Truck, MessageCircle, Heart, Lock } from 'lucide-react';
import { buildWhatsappLink } from '../lib/utils';
import { Link } from 'react-router-dom';

export const PublicCatalogPage: React.FC = () => {
  const { products, categories, selectedCategory, searchQuery, storeInfo } = useApp();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter products by selected category and search query
  const filteredProducts = products.filter((p) => {
    if (!p.is_available) return false;

    // Category Filter
    if (selectedCategory !== 'todos') {
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (cat && p.category_id !== cat.id) return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q) || false;
      return matchName || matchDesc;
    }

    return true;
  });

  const handleGeneralWhatsapp = () => {
    window.open(
      buildWhatsappLink(storeInfo.whatsapp_number, '¡Hola! Quisiera consultar precios y horarios en Fiambrería Mamá.'),
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-cream-50 pb-20 max-w-md mx-auto relative border-x border-rose-100/40 shadow-sm">
      {/* Top Mobile Header */}
      <HeaderMobile
        onOpenCart={() => setIsCartOpen(true)}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
      />

      {/* Hero Banner Section */}
      <HeroBannerMobile />

      {/* Category Pills Slider */}
      <CategoryPills />

      {/* Catalog & View Mode Section */}
      <main id="catalogo-section" className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight font-sans">
              {selectedCategory === 'todos' ? 'Todos los Productos' : 'Categoría Selección'}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {filteredProducts.length} fiambres y quesos disponibles
            </p>
          </div>

          {/* View Toggle Switch */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-deli-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-deli-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista en Lista de Precios"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Cards Grid or Price List */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-rose-100 shadow-sm my-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-deli-600 flex items-center justify-center mx-auto mb-2">
              🔍
            </div>
            <p className="font-bold text-slate-800 text-sm">No encontramos productos</p>
            <p className="text-xs text-slate-400 mt-1">Prueba seleccionando otra categoría o limpiando la búsqueda.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-3.5">
            {filteredProducts.map((product) => (
              <ProductCardMobile key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <PriceListMobile products={filteredProducts} />
        )}
      </main>

      {/* Footer & Location Info */}
      <footer className="mt-6 px-4 py-6 bg-slate-900 text-slate-300 rounded-t-3xl text-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-deli-600 text-white flex items-center justify-center font-extrabold text-base">
            M
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">{storeInfo.business_name}</h4>
            <p className="text-[11px] text-slate-400">Fiambres, Embutidos & Delicatessen Artesanales</p>
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-800 pt-3 text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{storeInfo.address}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{storeInfo.schedule}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{storeInfo.delivery_note}</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[10px] text-slate-500">
          <span>© 2026 Fiambrería Mamá • San Juan</span>
          <Link to="/login" className="hover:text-rose-400 flex items-center gap-1 font-semibold">
            <Lock className="w-3 h-3" />
            <span>Acceso Admin</span>
          </Link>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <button
        onClick={handleGeneralWhatsapp}
        className="fixed bottom-4 right-4 z-40 p-3.5 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition-all flex items-center justify-center border-2 border-white"
        aria-label="Contacto por WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-white" />
      </button>

      {/* Cart Drawer Modal */}
      <CartModalMobile isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};
