import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import { MobileCustomerModal } from '../components/admin/MobileCustomerModal';
import { Customer } from '../types';
import { buildWhatsappLink } from '../lib/utils';
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  Edit3, 
  ExternalLink,
  Compass
} from 'lucide-react';

export const AdminCustomersPage: React.FC = () => {
  const { customers } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCustomers = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const handleOpenWhatsapp = (phone?: string) => {
    if (!phone) return;
    window.open(buildWhatsappLink(phone, '¡Hola! Te contactamos desde Fiambrería Mamá.'), '_blank');
  };

  const handleNavigateMaps = (customer: Customer) => {
    if (customer.google_maps_url) {
      window.open(customer.google_maps_url, '_blank');
    } else if (customer.latitude && customer.longitude) {
      window.open(`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`, '_blank');
    } else if (customer.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 pb-24 max-w-md mx-auto relative border-x border-rose-100/40">
      {/* Header */}
      <div className="sticky top-0 z-30 glass-header border-b border-rose-100/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 font-sans">
                Clientes & Rutas GPS
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                {filteredCustomers.length} clientes registrados
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsModalOpen(true);
            }}
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cliente</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-slate-800"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Customer List */}
      <main className="p-4 space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-rose-100 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Compass className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm">No hay clientes en esta búsqueda</p>
            <p className="text-xs text-slate-400 mt-1">Toca "+ Cliente" para registrar uno con su posición GPS.</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="bg-white rounded-2xl p-4 shadow-mobile-card border border-rose-100/80 hover:border-emerald-200 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {cust.name}
                  </h3>
                  {cust.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{cust.address}</span>
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setIsModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-cream-100 hover:bg-emerald-100 text-slate-700 active:scale-95 shrink-0"
                  title="Editar cliente y GPS"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {cust.notes && (
                <p className="text-[11px] text-slate-600 bg-cream-50 p-2 rounded-xl border border-slate-200/60 italic">
                  "{cust.notes}"
                </p>
              )}

              {/* Action Bar: WhatsApp & Google Maps */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {cust.phone ? (
                  <button
                    onClick={() => handleOpenWhatsapp(cust.phone)}
                    className="py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 active:scale-95 border border-emerald-200"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                    <span>WhatsApp</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400">Sin teléfono</span>
                )}

                <button
                  onClick={() => handleNavigateMaps(cust)}
                  className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-2xs ${
                    cust.latitude && cust.longitude
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                      : 'bg-cream-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 fill-white" />
                  <span>
                    {cust.latitude && cust.longitude ? '📍 NAVEGAR GPS' : 'Buscar en Mapa'}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      <MobileCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerToEdit={selectedCustomer}
      />

      <AdminBottomNav />
    </div>
  );
};
