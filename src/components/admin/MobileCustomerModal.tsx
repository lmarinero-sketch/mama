import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Save, MapPin, Navigation, Compass, Phone, Loader2, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MobileCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
}

export const MobileCustomerModal: React.FC<MobileCustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
}) => {
  const { saveCustomer, deleteCustomer } = useApp();

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    address: '',
    notes: '',
    latitude: undefined,
    longitude: undefined,
    google_maps_url: '',
  });

  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setFormData(customerToEdit);
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        notes: '',
        latitude: undefined,
        longitude: undefined,
        google_maps_url: '',
      });
    }
    setGeoError(null);
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  // GPS Geolocation trigger
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGeoError('Tu dispositivo o navegador no soporta geolocalización GPS.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          google_maps_url: mapsUrl,
        }));

        setIsLocating(false);

        // Confetti for successful GPS lock
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#10B981', '#3B82F6']
        });
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Permiso de ubicación denegado. Permite el GPS en tu navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('La señal GPS no está disponible en este momento.');
            break;
          case error.TIMEOUT:
            setGeoError('Tiempo de espera agotado al obtener el GPS.');
            break;
          default:
            setGeoError('Error desconocido al obtener la geolocalización.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    setIsSaving(true);
    await saveCustomer(formData);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (customerToEdit?.id && confirm(`¿Eliminar cliente "${customerToEdit.name}"?`)) {
      await deleteCustomer(customerToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-slideUp">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-cream-100 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {customerToEdit ? 'Editar Cliente & GPS' : 'Nuevo Cliente & Geolocalización'}
              </h3>
              <p className="text-[10px] text-slate-500">Captura la ubicación exacta desde el celular</p>
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
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* GPS Capture Button */}
          <div className="bg-gradient-to-br from-emerald-50 via-cream-50 to-emerald-100/50 p-4 rounded-2xl border border-emerald-200/80 text-center space-y-2.5">
            <div className="flex items-center justify-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600 animate-spin-slow" />
              <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Geolocalización GPS en Tiempo Real
              </h4>
            </div>

            <p className="text-[11px] text-slate-600">
              Al llegar al negocio o casa del cliente, presiona el botón para guardar las coordenadas exactas de su ubicación.
            </p>

            <button
              type="button"
              onClick={handleCaptureGPS}
              disabled={isLocating}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Obteniendo GPS de alta precisión...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>📍 OBTENER Y GUARDAR MI UBICACIÓN GPS AHORA</span>
                </>
              )}
            </button>

            {/* Geo error display */}
            {geoError && (
              <p className="text-[11px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                ⚠️ {geoError}
              </p>
            )}

            {/* Latitude & Longitude Preview Badges */}
            {formData.latitude && formData.longitude && (
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2 text-xs">
                <div className="bg-white px-3 py-1.5 rounded-xl border border-emerald-300 font-mono text-[11px] text-emerald-800 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Lat: {formData.latitude} | Lng: {formData.longitude}</span>
                </div>

                {formData.google_maps_url && (
                  <a
                    href={formData.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300 font-bold text-[11px] flex items-center gap-1 shrink-0"
                    title="Probar en Google Maps"
                  >
                    <span>Mapa</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre del Cliente / Negocio *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Almacén Don Pedro / Rotisería San José"
              value={formData.name || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2.5 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teléfono / WhatsApp (con código de país)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej: 5492645112233"
                value={formData.phone || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full pl-9 pr-3 py-2.5 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Address Text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dirección Texto / Referencia
            </label>
            <input
              type="text"
              placeholder="Ej: Av. España 450 (frente a la plaza)"
              value={formData.address || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2.5 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>

          {/* Día de Visita */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Día de Visita de Ruta *
            </label>
            <select
              value={formData.visit_day || 'Lunes'}
              onChange={(e) => setFormData((prev) => ({ ...prev, visit_day: e.target.value }))}
              className="w-full px-3 py-2.5 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            >
              <option value="Lunes">Lunes</option>
              <option value="Martes">Martes</option>
              <option value="Miércoles">Miércoles</option>
              <option value="Jueves">Jueves</option>
              <option value="Viernes">Viernes</option>
              <option value="Sábado">Sábado</option>
            </select>
          </div>

          {/* Saldo de Cuenta Corriente / Deuda */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deuda / Saldo en Cuenta Corriente ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.debt_amount ?? 0}
              onChange={(e) => setFormData((prev) => ({ ...prev, debt_amount: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2.5 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notas de Entrega / Preferencias de Corte
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Entrega los martes por la mañana. Pide feteado fino..."
              value={formData.notes || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {customerToEdit?.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl border border-rose-200 transition-all active:scale-95"
                title="Eliminar Cliente"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-emerald-200 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'GUARDANDO...' : 'GUARDAR CLIENTE CON GPS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
