import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import { MobileCustomerModal } from '../components/admin/MobileCustomerModal';
import { Customer } from '../types';
import { generateWhatsAppCobroUrl, generateWhatsAppPedidoUrl, formatWhatsAppPhone } from '../lib/orders';
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
  Compass,
  Calendar,
  DollarSign
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

  const handleOpenCobroWhatsapp = (cust: Customer) => {
    if (!cust.phone) return;
    const url = generateWhatsAppCobroUrl(
      cust.name,
      cust.phone,
      cust.debt_amount || cust.last_order_amount || 0,
      cust.last_order_date,
      cust.last_order_details
    );
    window.open(url, '_blank');
  };

  const handleOpenPedidoWhatsapp = (cust: Customer) => {
    if (!cust.phone) return;
    const url = generateWhatsAppPedidoUrl(cust.name, cust.phone);
    window.open(url, '_blank');
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
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-28 max-w-lg mx-auto relative border-x border-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-800/90 backdrop-blur-md border-b border-slate-700 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Clientes & Ruta de Cobro
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {filteredCustomers.length} clientes registrados en San Juan
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsModalOpen(true);
            }}
            className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cliente</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 rounded-xl text-xs border border-slate-700 focus:outline-none focus:border-amber-500 text-white placeholder-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Customer List */}
      <main className="p-4 space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-slate-800 rounded-3xl p-8 text-center border border-slate-700 shadow-sm space-y-2">
            <Compass className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="font-bold text-slate-200 text-sm">No se encontraron clientes</p>
            <p className="text-xs text-slate-400">Presiona "+ Cliente" para registrar un nuevo cliente con GPS.</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const hasDebt = (cust.debt_amount || 0) > 0;
            const formattedPhone = formatWhatsAppPhone(cust.phone);

            return (
              <div
                key={cust.id}
                className="bg-slate-800 rounded-2xl p-4 shadow-md border border-slate-700/80 hover:border-slate-600 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-white truncate">
                        {cust.name}
                      </h3>
                      {cust.is_referred && (
                        <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Referido
                        </span>
                      )}
                    </div>

                    {cust.address && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{cust.address}</span>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 active:scale-95 shrink-0"
                    title="Editar cliente y GPS"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Resumen Financiero y Deuda a 7 días */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-slate-400">Última Venta: <span className="text-white font-bold">{cust.last_order_date || 'S/D'}</span></div>
                    <div className="text-slate-400 truncate max-w-[180px]">{cust.last_order_details || 'Surtido Fiambrería'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Saldo a Cobrar (7 días)</div>
                    <div className={`font-extrabold text-sm font-mono ${hasDebt ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ${(cust.debt_amount || cust.last_order_amount || 0).toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>

                {/* Action Bar: WhatsApp & Google Maps */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {cust.phone ? (
                      <>
                        <button
                          onClick={() => handleOpenCobroWhatsapp(cust)}
                          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Cobrar 7 Días</span>
                        </button>

                        <button
                          onClick={() => handleOpenPedidoWhatsapp(cust)}
                          className="py-2 px-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs flex items-center gap-1 active:scale-95"
                          title="Tomar Pedido por WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pedido</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Sin teléfono registrado</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleNavigateMaps(cust)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 active:scale-95 shadow-sm ${
                      cust.latitude && cust.longitude
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        : 'bg-slate-700 text-slate-200 border border-slate-600'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 fill-current" />
                    <span>{cust.latitude && cust.longitude ? 'GPS' : 'Mapa'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
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
