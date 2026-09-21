import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import { MobileCustomerModal } from '../components/admin/MobileCustomerModal';
import { Customer, Order, CustomerPayment } from '../types';
import { 
  generateWhatsAppCobroUrl, 
  generateWhatsAppPedidoUrl, 
  fetchCustomerOrders, 
  fetchCustomerPayments, 
  fetchCustomerFavoriteProducts, 
  registerPayment 
} from '../lib/orders';
import { downloadOrderPDF } from '../lib/pdfGenerator';
import { formatCurrency } from '../lib/utils';
import { 
  Users, 
  Plus, 
  Search, 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  Edit3, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Wallet, 
  ShoppingBag, 
  Download, 
  X 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getCurrentDayOfWeek(): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const today = days[new Date().getDay()];
  return today === 'Domingo' ? 'Lunes' : today;
}

export const AdminCustomersPage: React.FC = () => {
  const { customers } = useApp();
  const [search, setSearch] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('TODOS');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados para Modal de Historial y "Qué es lo que más pide"
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [customerFavorites, setCustomerFavorites] = useState<Array<{
    productId: string;
    name: string;
    unit: string;
    totalQty: number;
    totalSpent: number;
    orderCount: number;
  }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Estados para Modal Cobro Directo a Cuenta Corriente
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  const currentDay = getCurrentDayOfWeek();

  const filteredCustomers = customers.filter((c) => {
    // Filtro por día de visita
    if (selectedDayFilter === 'HOY') {
      const custDay = c.visit_day || c.preferred_day || 'Lunes';
      if (custDay !== currentDay) return false;
    } else if (selectedDayFilter !== 'TODOS') {
      const custDay = c.visit_day || c.preferred_day || 'Lunes';
      if (custDay !== selectedDayFilter) return false;
    }

    // Filtro por búsqueda
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  const handleOpenCobroWhatsapp = (cust: Customer) => {
    if (!cust.phone) return;
    const url = generateWhatsAppCobroUrl(
      cust.name,
      cust.phone,
      cust.debt_amount || 0,
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

  const handleOpenHistoryModal = async (cust: Customer) => {
    setHistoryCustomer(cust);
    setLoadingHistory(true);
    const [orders, payments, favorites] = await Promise.all([
      fetchCustomerOrders(cust.id),
      fetchCustomerPayments(cust.id),
      fetchCustomerFavoriteProducts(cust.id)
    ]);
    setCustomerOrders(orders);
    setCustomerPayments(payments);
    setCustomerFavorites(favorites);
    setLoadingHistory(false);
  };

  const handleOpenDirectPayModal = (cust: Customer) => {
    setPaymentCustomer(cust);
    setPayAmount(cust.debt_amount || 0);
    setPayMethod('EFECTIVO');
    setPayNotes('');
  };

  const handleSubmitDirectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer || payAmount <= 0) return;

    setIsSubmittingPay(true);
    const ok = await registerPayment({
      customerId: paymentCustomer.id,
      amount: payAmount,
      paymentMethod: payMethod,
      notes: payNotes || `Cobranza de cuenta corriente ($${payAmount})`
    });
    setIsSubmittingPay(false);

    if (ok) {
      setPaymentCustomer(null);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#5E7B60', '#DCE6C6', '#243627']
      });
      window.location.reload();
    }
  };

  const totalDeudaFiltrada = filteredCustomers.reduce((acc, c) => acc + (c.debt_amount || 0), 0);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark pb-28 max-w-lg mx-auto relative border-x border-brand-secondary/40">
      {/* Header Fijo con estética Café */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-brand-secondary/80 p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-brown text-white flex items-center justify-center font-bold shadow-soft">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-brand-dark leading-tight">
                Clientes & Ruta de Visita
              </h2>
              <p className="text-[11px] text-brand-dark/70 font-medium">
                {filteredCustomers.length} clientes • Deuda: <strong className="text-brand-brown font-black">{formatCurrency(totalDeudaFiltrada)}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedCustomer(null);
              setIsModalOpen(true);
            }}
            className="py-2 px-3 rounded-xl bg-brand-brown hover:bg-brand-brown/90 text-white font-extrabold text-xs shadow-soft flex items-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cliente</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, dirección, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-brand-secondary/90 rounded-xl text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20 shadow-xs"
          />
          <Search className="w-4 h-4 text-brand-dark/40 absolute left-3 top-2.5" />
        </div>

        {/* Selector de Ruta por Día de Visita */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <button
            onClick={() => setSelectedDayFilter('HOY')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition-all flex items-center gap-1 ${
              selectedDayFilter === 'HOY'
                ? 'bg-brand-brown text-white shadow-soft scale-105'
                : 'bg-brand-softYellow text-brand-dark border border-brand-yellow'
            }`}
          >
            <span>📍 Ruta de Hoy ({currentDay})</span>
          </button>

          <button
            onClick={() => setSelectedDayFilter('TODOS')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
              selectedDayFilter === 'TODOS'
                ? 'bg-brand-brown text-white shadow-soft'
                : 'bg-white text-brand-dark/70 border border-brand-secondary/80'
            }`}
          >
            Todos
          </button>

          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDayFilter(day)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                selectedDayFilter === day
                  ? 'bg-brand-brown text-white shadow-soft'
                  : 'bg-white text-brand-dark/70 border border-brand-secondary/80'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Clientes en Tarjetas Blancas con Sombra Suave */}
      <div className="p-3.5 space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-brand-secondary/70 shadow-soft space-y-2">
            <Users className="w-8 h-8 text-brand-secondary mx-auto" />
            <p className="text-xs text-brand-dark/60 font-medium">No se encontraron clientes para este filtro.</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const hasDebt = (cust.debt_amount || 0) > 0;
            const visitDay = cust.visit_day || cust.preferred_day || 'Lunes';
            const isToday = visitDay === currentDay;

            return (
              <div
                key={cust.id}
                className={`bg-white rounded-2xl p-3.5 space-y-3 shadow-soft border transition-all ${
                  isToday 
                    ? 'border-brand-brown/60 ring-2 ring-brand-brown/10' 
                    : 'border-brand-secondary/60 hover:border-brand-brown/40'
                }`}
              >
                {/* Header Cliente */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-brand-dark leading-snug">
                        {cust.name}
                      </h3>
                      {isToday && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-brand-softYellow text-brand-brown px-2 py-0.5 rounded-full border border-brand-yellow">
                          Visita Hoy
                        </span>
                      )}
                    </div>
                    {cust.address && (
                      <p className="text-[11px] text-brand-dark/70 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand-brown shrink-0" />
                        <span className="truncate">{cust.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Estado de Deuda / Saldo */}
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        hasDebt
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-brand-softYellow text-brand-dark border border-brand-yellow'
                      }`}
                    >
                      {hasDebt ? `Debe ${formatCurrency(cust.debt_amount)}` : 'Al Día'}
                    </span>
                    <div className="text-[10px] text-brand-dark/60 font-medium mt-0.5">
                      Día: <strong className="text-brand-brown">{visitDay}</strong>
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {cust.notes && (
                  <div className="bg-brand-bg p-2 rounded-xl text-[11px] text-brand-dark/80 border border-brand-secondary/60">
                    <span className="text-brand-dark/50 font-bold">Nota: </span>
                    {cust.notes}
                  </div>
                )}

                {/* Barra de Acciones Móviles */}
                <div className="grid grid-cols-5 gap-1.5 pt-1 border-t border-brand-secondary/40">
                  {/* Botón Ver Favoritos */}
                  <button
                    onClick={() => handleOpenHistoryModal(cust)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-brand-softYellow/70 hover:bg-brand-softYellow text-brand-brown text-[10px] font-bold border border-brand-yellow/80 active:scale-95 transition-all"
                    title="Historial de consumos y qué es lo que más pide"
                  >
                    <Award className="w-3.5 h-3.5 mb-0.5 text-brand-brown" />
                    <span>Favoritos</span>
                  </button>

                  {/* Botón Cobrar Cta Cte */}
                  <button
                    onClick={() => handleOpenDirectPayModal(cust)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-brand-cream hover:bg-brand-secondary/50 text-brand-dark text-[10px] font-bold border border-brand-secondary active:scale-95 transition-all"
                    title="Cobrar a Cuenta Corriente"
                  >
                    <Wallet className="w-3.5 h-3.5 mb-0.5 text-brand-brown" />
                    <span>Cobrar</span>
                  </button>

                  {/* WhatsApp Preventa o Cobro */}
                  <button
                    onClick={() => hasDebt ? handleOpenCobroWhatsapp(cust) : handleOpenPedidoWhatsapp(cust)}
                    disabled={!cust.phone}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 disabled:opacity-40 active:scale-95 transition-all"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mb-0.5 text-emerald-700" />
                    <span>WhatsApp</span>
                  </button>

                  {/* GPS Maps */}
                  <button
                    onClick={() => handleNavigateMaps(cust)}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-brand-cream hover:bg-brand-secondary/50 text-brand-dark text-[10px] font-bold border border-brand-secondary active:scale-95 transition-all"
                    title="Navegar con Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5 mb-0.5 text-brand-brown" />
                    <span>GPS</span>
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setIsModalOpen(true);
                    }}
                    className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-brand-cream hover:bg-brand-secondary/50 text-brand-dark text-[10px] font-bold border border-brand-secondary active:scale-95 transition-all"
                    title="Editar Cliente"
                  >
                    <Edit3 className="w-3.5 h-3.5 mb-0.5 text-brand-dark/70" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL HISTORIAL & QUÉ ES LO QUE MÁS PIDE */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-brand-secondary rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-soft-lg overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-3.5 border-b border-brand-secondary/70 flex items-center justify-between bg-brand-cream">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-brown" />
                <div>
                  <h3 className="font-extrabold text-brand-dark text-sm">
                    {historyCustomer.name}
                  </h3>
                  <p className="text-[11px] text-brand-dark/70">
                    Historial de consumo y qué es lo que más pide
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setHistoryCustomer(null)}
                className="text-brand-dark/60 hover:text-brand-dark p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {loadingHistory ? (
                <div className="py-12 text-center text-brand-dark/60 text-xs flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-brand-brown border-t-transparent rounded-full animate-spin" />
                  Analizando historial de compras del cliente...
                </div>
              ) : (
                <>
                  {/* SECCIÓN 1: QUÉ ES LO QUE MÁS PIDE */}
                  <div className="bg-brand-softYellow/40 border border-brand-yellow rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-brand-yellow/80 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-brand-brown" />
                        <h4 className="text-xs font-black text-brand-dark uppercase tracking-wider">
                          ¿Qué es lo que más pide? (Top Fiambres)
                        </h4>
                      </div>
                      <span className="text-[10px] text-brand-dark/60 font-bold">Por Kg / Cantidad</span>
                    </div>

                    {customerFavorites.length === 0 ? (
                      <p className="text-xs text-brand-dark/60 italic py-2">
                        Aún no registra compras finalizadas para calcular estadísticas de productos favoritos.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {customerFavorites.map((fav, index) => (
                          <div key={fav.productId} className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-brand-secondary/60 shadow-xs">
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-full bg-brand-softYellow text-brand-brown font-black flex items-center justify-center text-[10px] shrink-0 border border-brand-yellow">
                                {index + 1}
                              </span>
                              <span className="font-extrabold text-brand-dark truncate">
                                {fav.name}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-mono font-black text-brand-brown">
                                {fav.totalQty.toFixed(2)} {fav.unit}
                              </div>
                              <div className="text-[10px] text-brand-dark/60">
                                {formatCurrency(fav.totalSpent)} • {fav.orderCount} pedidos
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN 2: HISTORIAL DE PEDIDOS */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-brand-dark/80 uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-brand-brown" />
                      Historial de Pedidos ({customerOrders.length})
                    </h4>

                    {customerOrders.length === 0 ? (
                      <p className="text-xs text-brand-dark/50 italic">No hay pedidos registrados.</p>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {customerOrders.map(o => (
                          <div key={o.id} className="p-2.5 bg-white rounded-xl border border-brand-secondary/60 shadow-xs text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-brand-brown font-extrabold">
                                {o.order_number ? `#${o.order_number}` : `#${o.id.slice(0, 6)}`} • {o.order_date}
                              </span>
                              <button
                                onClick={() => downloadOrderPDF(o, historyCustomer)}
                                className="px-2 py-0.5 bg-brand-cream hover:bg-brand-secondary text-brand-dark rounded text-[10px] font-bold flex items-center gap-1 border border-brand-secondary"
                              >
                                <Download className="w-3 h-3 text-brand-brown" />
                                <span>PDF</span>
                              </button>
                            </div>
                            <div className="text-brand-dark/80 text-[11px]">
                              Total: <strong className="text-brand-dark">{formatCurrency(o.actual_total || o.estimated_total)}</strong> • Estado: <strong className="text-brand-brown">{o.payment_status}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN 3: HISTORIAL DE PAGOS */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-brand-dark/80 uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-brand-brown" />
                      Historial de Pagos y Cobranzas ({customerPayments.length})
                    </h4>

                    {customerPayments.length === 0 ? (
                      <p className="text-xs text-brand-dark/50 italic">No hay pagos registrados aún.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {customerPayments.map(p => (
                          <div key={p.id} className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-brand-secondary/60 text-xs shadow-xs">
                            <div>
                              <div className="font-bold text-emerald-700">+{formatCurrency(p.amount)}</div>
                              <div className="text-[10px] text-brand-dark/60">{new Date(p.payment_date).toLocaleDateString('es-AR')} • {p.payment_method}</div>
                            </div>
                            {p.notes && <div className="text-[10px] text-brand-dark/60 italic max-w-[150px] truncate">{p.notes}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBRO DIRECTO A CUENTA CORRIENTE */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-brand-secondary rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-brand-secondary/60 pb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-brown" />
                <h3 className="font-bold text-brand-dark text-sm">Cobrar a Cuenta Corriente</h3>
              </div>
              <button onClick={() => setPaymentCustomer(null)} className="text-brand-dark/60 hover:text-brand-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDirectPayment} className="space-y-3">
              <div className="bg-brand-cream p-2.5 rounded-xl border border-brand-secondary/80 text-xs space-y-1">
                <div className="text-brand-dark/70">Cliente: <strong className="text-brand-dark">{paymentCustomer.name}</strong></div>
                <div className="text-brand-dark/70">Deuda Actual: <strong className="text-rose-700">{formatCurrency(paymentCustomer.debt_amount || 0)}</strong></div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-dark mb-1">Monto Cobrado ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-brand-brown rounded-xl p-2.5 text-base font-mono font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-dark mb-1">Medio de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('EFECTIVO')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === 'EFECTIVO'
                        ? 'bg-brand-softYellow text-brand-brown border-brand-brown font-black'
                        : 'bg-white text-brand-dark/60 border-brand-secondary'
                    }`}
                  >
                    💵 Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('TRANSFERENCIA')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === 'TRANSFERENCIA'
                        ? 'bg-brand-softYellow text-brand-brown border-brand-brown font-black'
                        : 'bg-white text-brand-dark/60 border-brand-secondary'
                    }`}
                  >
                    🏦 Transferencia
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-dark mb-1">Nota de Cobro</label>
                <input
                  type="text"
                  placeholder="Ej: Pago parcial entregado en mano"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full bg-white border border-brand-secondary rounded-xl p-2 text-xs text-brand-dark focus:outline-none focus:border-brand-brown"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPay || payAmount <= 0}
                className="w-full bg-brand-brown hover:bg-brand-brown/90 disabled:opacity-50 text-white font-black py-3 rounded-xl text-xs transition-all shadow-soft active:scale-95"
              >
                {isSubmittingPay ? 'Registrando...' : 'Confirmar Cobro e Imputar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nuevo / Editar Cliente con GPS */}
      <MobileCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerToEdit={selectedCustomer}
      />

      {/* Navegación Móvil Inferior */}
      <AdminBottomNav />
    </div>
  );
};
