import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import { MobileImageUploader } from '../components/admin/MobileImageUploader';
import { HeroSectionContent, StoreInfoContent } from '../types';
import { 
  Edit3, 
  Eye, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Truck,
  Image as ImageIcon,
  Smartphone,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminVisualEditorPage: React.FC = () => {
  const { heroContent, storeInfo, updateHeroContent, updateStoreInfo } = useApp();

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [heroForm, setHeroForm] = useState<HeroSectionContent>(heroContent);
  const [storeForm, setStoreForm] = useState<StoreInfoContent>(storeInfo);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateHeroContent(heroForm);
    await updateStoreInfo(storeForm);
    setIsSaving(false);

    setSavedSuccess(true);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#E11D48', '#10B981', '#F59E0B']
    });
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-cream-50 pb-24 max-w-md mx-auto relative border-x border-rose-100/40">
      {/* Sticky Header with Mode Toggle */}
      <div className="sticky top-0 z-30 glass-header border-b border-rose-100/60 p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-deli-600 to-rose-400 text-white flex items-center justify-center font-bold">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 font-sans">
                Editor Visual estilo Wix
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">Edita textos y fotos en vivo</p>
            </div>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`py-2 px-3 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-all ${
              savedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-deli-600 to-rose-500 text-white'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Publicado!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Guardando...' : 'Publicar'}</span>
              </>
            )}
          </button>
        </div>

        {/* Segmented Control Switch: Editor vs Live Preview */}
        <div className="grid grid-cols-2 p-1 bg-cream-200/80 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'editor'
                ? 'bg-white text-deli-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar Campos</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'preview'
                ? 'bg-deli-600 text-white shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Ver Cambios en Celular</span>
          </button>
        </div>
      </div>

      <main className="p-4">
        {activeTab === 'editor' ? (
          <form onSubmit={handleSaveAll} className="space-y-4">
            {/* Section 1: Hero Banner */}
            <div className="bg-white p-4 rounded-2xl shadow-mobile-card border border-rose-100/80 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  1. Cartel Principal de Bienvenida (Hero)
                </h3>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título Principal del Catálogo
                </label>
                <input
                  type="text"
                  value={heroForm.title}
                  onChange={(e) => setHeroForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                  placeholder="Ej: Sabores Artesanales en Tu Mesa"
                />
              </div>

              {/* Subtitle Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtítulo / Mensaje Promocional
                </label>
                <textarea
                  rows={2}
                  value={heroForm.subtitle}
                  onChange={(e) => setHeroForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                  placeholder="Ej: Los mejores fiambres y quesos de la ciudad..."
                />
              </div>

              {/* Banner Image Uploader */}
              <MobileImageUploader
                currentImageUrl={heroForm.banner_image}
                onImageUploaded={(url) => setHeroForm((prev) => ({ ...prev, banner_image: url }))}
                label="Foto Principal del Banner (Cámara / Galería)"
              />

              {/* CTA Button Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Texto del Botón de Acción
                </label>
                <input
                  type="text"
                  value={heroForm.cta_text}
                  onChange={(e) => setHeroForm((prev) => ({ ...prev, cta_text: e.target.value }))}
                  className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                  placeholder="Ej: Ver Ofertas de Hoy"
                />
              </div>
            </div>

            {/* Section 2: Store Information */}
            <div className="bg-white p-4 rounded-2xl shadow-mobile-card border border-rose-100/80 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
                <MessageCircle className="w-4 h-4 text-emerald-500 fill-emerald-400" />
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  2. Datos de Contacto y Negocio
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Oficial de la Fiambrería
                </label>
                <input
                  type="text"
                  value={storeForm.business_name}
                  onChange={(e) => setStoreForm((prev) => ({ ...prev, business_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de WhatsApp para Pedidos (con código de país)
                </label>
                <input
                  type="text"
                  value={storeForm.whatsapp_number}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStoreForm((prev) => ({ ...prev, whatsapp_number: val }));
                    setHeroForm((prev) => ({ ...prev, whatsapp_number: val }));
                  }}
                  className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  placeholder="5492641234567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dirección del Local</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Horarios de Atención</label>
                <input
                  type="text"
                  value={storeForm.schedule}
                  onChange={(e) => setStoreForm((prev) => ({ ...prev, schedule: e.target.value }))}
                  className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nota de Envíos / Delivery</label>
                <input
                  type="text"
                  value={storeForm.delivery_note}
                  onChange={(e) => setStoreForm((prev) => ({ ...prev, delivery_note: e.target.value }))}
                  className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-deli-600 to-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-rose-200 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'GUARDANDO CAMBIOS...' : 'PUBLICAR CAMBIOS EN LA WEB'}</span>
            </button>
          </form>
        ) : (
          /* Live Mobile Preview View */
          <div className="space-y-3 animate-fadeIn">
            <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-2xl text-center">
              <span className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1">
                <Smartphone className="w-4 h-4 text-amber-600" />
                Previsualización en Vivo de la Pantalla del Cliente
              </span>
            </div>

            {/* Smartphone Simulation Wrapper */}
            <div className="bg-slate-900 p-2.5 rounded-[36px] shadow-2xl border-4 border-slate-800 relative">
              <div className="w-16 h-3.5 bg-slate-800 rounded-full mx-auto mb-2" />
              
              <div className="bg-cream-50 rounded-[24px] overflow-hidden p-3 space-y-3 max-h-[550px] overflow-y-auto">
                {/* Live Hero Banner */}
                <div className="bg-gradient-to-br from-rose-100 via-cream-100 to-amber-100 p-4 rounded-2xl border border-rose-200/50">
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight mb-1">
                    {heroForm.title}
                  </h3>
                  <p className="text-xs text-slate-600 mb-3">{heroForm.subtitle}</p>

                  {heroForm.banner_image && (
                    <img
                      src={heroForm.banner_image}
                      alt=""
                      className="w-full h-32 object-cover rounded-xl mb-3 shadow-xs"
                    />
                  )}

                  <div className="py-2 bg-deli-600 text-white font-bold text-xs text-center rounded-xl shadow-xs">
                    {heroForm.cta_text}
                  </div>
                </div>

                {/* Live Store Info Card */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <p className="font-bold text-slate-900">{storeForm.business_name}</p>
                  <p className="text-slate-500 text-[11px]">📍 {storeForm.address}</p>
                  <p className="text-slate-500 text-[11px]">⏰ {storeForm.schedule}</p>
                  <p className="text-emerald-700 font-semibold text-[11px]">🚚 {storeForm.delivery_note}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <AdminBottomNav />
    </div>
  );
};
