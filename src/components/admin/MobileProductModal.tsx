import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { MobileImageUploader } from './MobileImageUploader';
import { X, Save, Check, Trash2, Package, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface MobileProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const MobileProductModal: React.FC<MobileProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, saveProduct, deleteProduct } = useApp();

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    unit: 'kg',
    category_id: categories[0]?.id || '',
    badge_text: '',
    image_url: '',
    is_featured: false,
    is_available: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setFormData(productToEdit);
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        cost_price: 0,
        unit: 'kg',
        category_id: categories[0]?.id || '',
        badge_text: '',
        image_url: '',
        is_featured: false,
        is_available: true,
      });
    }
  }, [productToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const cost = Number(formData.cost_price || 0);
  const price = Number(formData.price || 0);
  const profit = price - cost;
  const markupPercent = cost > 0 ? ((profit / cost) * 100).toFixed(1) : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Por favor ingrese el nombre del producto');
      return;
    }
    setIsSaving(true);
    await saveProduct(formData);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (productToEdit?.id && confirm(`¿Eliminar "${productToEdit.name}"?`)) {
      await deleteProduct(productToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-slideUp">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-50 to-cream-100 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-deli-600 text-white flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {productToEdit ? 'Editar Fiambre / Queso' : 'Cargar Nuevo Fiambre'}
              </h3>
              <p className="text-[10px] text-slate-500">Precios por peso, costos y variaciones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white text-slate-400 hover:text-slate-700 shadow-xs border border-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {/* Image Uploader */}
          <MobileImageUploader
            currentImageUrl={formData.image_url}
            onImageUploaded={(url) => setFormData((prev) => ({ ...prev, image_url: url }))}
            label="Foto del Fiambre / Queso (Subir desde cámara o galería)"
          />

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre del Fiambre / Producto *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Queso Tybo Danbo Barra / Jamón Cocido"
              value={formData.name || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2.5 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
            <select
              value={formData.category_id || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
              className="w-full px-3 py-2.5 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cost Price, Sale Price & Unit Grid */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Precio de Costo ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  required
                  placeholder="Ej: 6900"
                  value={formData.cost_price ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cost_price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-mono font-bold focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-deli-700 mb-1">
                  Precio de Venta ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  required
                  placeholder="Ej: 9800"
                  value={formData.price ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 bg-white border border-deli-300 rounded-xl text-xs text-deli-700 font-mono font-black focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unidad de Venta</label>
                <select
                  value={formData.unit || 'kg'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:outline-none"
                >
                  <option value="kg">por Kilo (kg)</option>
                  <option value="100g">por 100g</option>
                  <option value="Horma">Horma / Barra</option>
                  <option value="Pieza">Pieza</option>
                  <option value="Unidad">Unidad</option>
                </select>
              </div>

              {/* Ganancia y Margen Estimado */}
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <div className="text-[10px] text-emerald-700 font-bold">Margen de Ganancia:</div>
                <div className="text-xs font-black text-emerald-800 font-mono">
                  {cost > 0 ? `+${markupPercent}%` : '-'}
                  <span className="text-[10px] block font-medium">({formatCurrency(profit)} / {formData.unit || 'kg'})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Badge & Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Etiqueta Destacada (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Oferta Semanal, Más Pedido, Promo"
              value={formData.badge_text || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, badge_text: e.target.value }))}
              className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
            <textarea
              rows={2}
              placeholder="Ej: Queso Tybo en barra entera, suave y de fácil feteado..."
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Disponible para Venta</span>
              <span className="text-[10px] text-slate-400">Habilitar en toma de pedidos y catálogo</span>
            </div>
            <input
              type="checkbox"
              checked={formData.is_available ?? true}
              onChange={(e) => setFormData((prev) => ({ ...prev, is_available: e.target.checked }))}
              className="w-5 h-5 accent-deli-600 rounded"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {productToEdit?.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl border border-rose-200 transition-all active:scale-95"
                title="Eliminar"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-deli-600 to-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-rose-200 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'GUARDAR FIAMBRE & REGISTRAR PRECIO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
