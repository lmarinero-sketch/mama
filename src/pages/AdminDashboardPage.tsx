import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import { Customer } from '../types';
import { formatCurrency, buildWhatsappLink } from '../lib/utils';
import { 
  Calendar, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  MessageCircle, 
  Users,
  Check,
  Receipt,
  Wallet,
  Building2,
  TrendingUp,
  AlertCircle,
  Clock,
  DollarSign,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface WeekDayOption {
  key: string; // 'Lunes' | 'Martes' | ...
  shortName: string; // 'Lun'
  dateNumber: number; // 21
  dateStr: string; // '2026-09-21'
  displayDate: string; // '21/09'
  isToday: boolean;
}

function getWeekDays(): WeekDayOption[] {
  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 is Sunday, 1 is Monday...
  const mondayDiff = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayDiff);

  const weekKeys = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const shortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return weekKeys.map((key, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dayNum = d.getDate();
    const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
    const isToday = now.getDate() === d.getDate() && now.getMonth() === d.getMonth();

    return {
      key,
      shortName: shortNames[idx],
      dateNumber: dayNum,
      dateStr: `${d.getFullYear()}-${monthNum}-${dayNum.toString().padStart(2, '0')}`,
      displayDate: `${dayNum.toString().padStart(2, '0')}/${monthNum}`,
      isToday
    };
  });
}

export const AdminDashboardPage: React.FC = () => {
  const { customers, expenses, saveCustomer } = useApp();
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  const now = new Date();
  const currentDayOfWeek = DAYS_ES[now.getDay()] === 'Domingo' ? 'Lunes' : DAYS_ES[now.getDay()];
  const weekDays = getWeekDays();

  // Estado de día seleccionado: por defecto 'HOY'
  const [selectedDay, setSelectedDay] = useState<string>('HOY');

  // Día activo para el filtro
  const activeDayKey = selectedDay === 'HOY' ? currentDayOfWeek : selectedDay;
  const activeDayOption = weekDays.find(d => d.key === activeDayKey);

  // Fecha legible en español
  const fullDateLabel = `${activeDayKey}, ${activeDayOption ? activeDayOption.dateNumber : now.getDate()} de ${MONTHS_ES[now.getMonth()]} de ${now.getFullYear()}`;

  // Filtrado de clientes según ruta de visita
  const activeCustomers = customers.filter((c) => {
    if (selectedDay === 'TODOS') return true;
    const targetDay = activeDayKey;
    const custDay = c.visit_day || c.preferred_day || (
      c.id.startsWith('c-28') ? (parseInt(c.id.split('-')[2] || '1') <= 5 ? 'Lunes' : 'Martes') :
      c.id.startsWith('c-29') ? 'Miércoles' :
      c.id.startsWith('c-30') ? 'Jueves' :
      c.id.startsWith('c-31') ? 'Viernes' : 'Lunes'
    );
    return custDay === targetDay;
  });

  // Gastos registrados para la fecha seleccionada
  const activeExpenses = expenses.filter((e) => {
    if (selectedDay === 'TODOS') return true;
    return activeDayOption && e.date === activeDayOption.dateStr;
  });

  // Métricas calculadas para la ruta activa
  const totalVendidoDia = activeCustomers.reduce((sum, c) => sum + (c.last_order_amount || 0), 0);
  const totalCobradoDia = activeCustomers
    .filter((c) => c.payment_status === 'COBRADO_TOTAL')
    .reduce((sum, c) => sum + (c.last_order_amount || 0), 0);
  const totalDeudaPendiente = activeCustomers
    .filter((c) => c.payment_status !== 'COBRADO_TOTAL')
    .reduce((sum, c) => sum + (c.debt_amount || c.last_order_amount || 0), 0);
  const totalGastosDia = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const totalEfectivo = activeCustomers
    .filter((c) => c.payment_status === 'COBRADO_TOTAL' && c.payment_method === 'EFECTIVO')
    .reduce((sum, c) => sum + c.last_order_amount, 0);

  const totalTransf = activeCustomers
    .filter((c) => c.payment_status === 'COBRADO_TOTAL' && c.payment_method === 'TRANSFERENCIA')
    .reduce((sum, c) => sum + c.last_order_amount, 0);

  const handleMarkAsCollected = async (customer: Customer, method: 'EFECTIVO' | 'TRANSFERENCIA' = 'EFECTIVO') => {
    await saveCustomer({
      ...customer,
      payment_status: 'COBRADO_TOTAL',
      payment_method: method,
      debt_amount: 0,
      cobro_notes: `Cobrado (${method}) el ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`,
    });

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#5E7B60', '#90A88D', '#DCE6C6']
    });
  };

  const handleSaveNotes = async (customer: Customer) => {
    await saveCustomer({
      ...customer,
      cobro_notes: tempNotes,
    });
    setEditingNotesId(null);
  };

  const handleNavigateGPS = (customer: Customer) => {
    if (customer.google_maps_url) {
      window.open(customer.google_maps_url, '_blank');
    } else if (customer.latitude && customer.longitude) {
      window.open(`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`, '_blank');
    } else if (customer.address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address)}`, '_blank');
    }
  };

  const handleOpenWhatsapp = (phone?: string, name?: string, amount?: number) => {
    if (!phone) return;
    const text = `¡Hola ${name || ''}! Te contactamos de Fiambrería Mamá para coordinar el cobro/entrega de la fecha por ${formatCurrency(amount || 0)}.`;
    window.open(buildWhatsappLink(phone, text), '_blank');
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark pb-28 max-w-lg mx-auto relative border-x border-brand-secondary/40">
      {/* Top Header con Estética Café */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-brand-secondary/80 p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-brand-dark font-sans">
                Ruta & Cobranzas del Día
              </h2>
              <span className="text-[10px] font-black bg-brand-softYellow text-brand-brown border border-brand-yellow px-2 py-0.5 rounded-full">
                {selectedDay === 'HOY' ? 'Hoy' : selectedDay === 'TODOS' ? 'Semana' : activeDayKey}
              </span>
            </div>
            <p className="text-[11px] text-brand-dark/70 font-medium">
              San Juan • {fullDateLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/orders"
              className="py-1.5 px-2.5 rounded-xl bg-brand-brown hover:bg-brand-brown/90 text-white font-bold text-xs shadow-soft flex items-center gap-1 active:scale-95 transition-all"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Pedidos</span>
            </Link>
            <Link
              to="/admin/clientes"
              className="py-1.5 px-3 rounded-xl bg-brand-softYellow hover:bg-brand-yellow text-brand-dark border border-brand-yellow font-bold text-xs shadow-xs flex items-center gap-1 active:scale-95 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-brand-brown" />
              <span>+ Cliente</span>
            </Link>
          </div>
        </div>

        {/* Selector de Rutas Semanales - Septiembre 2026 */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs font-bold pb-0.5">
          <button
            onClick={() => setSelectedDay('HOY')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all flex items-center gap-1 ${
              selectedDay === 'HOY'
                ? 'bg-brand-brown text-white shadow-soft font-black'
                : 'bg-white text-brand-dark/70 border border-brand-secondary/80 hover:bg-brand-softYellow/50'
            }`}
          >
            <span>⭐ Hoy ({currentDayOfWeek.slice(0, 3)})</span>
          </button>

          {weekDays.map(day => (
            <button
              key={day.key}
              onClick={() => setSelectedDay(day.key)}
              className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all text-xs ${
                selectedDay === day.key
                  ? 'bg-brand-brown text-white shadow-soft font-black'
                  : 'bg-white text-brand-dark/70 border border-brand-secondary/80 hover:bg-brand-softYellow/50'
              }`}
            >
              {day.shortName} {day.displayDate}
            </button>
          ))}

          <button
            onClick={() => setSelectedDay('TODOS')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap shrink-0 transition-all ${
              selectedDay === 'TODOS'
                ? 'bg-brand-dark text-white shadow-soft font-black'
                : 'bg-white text-brand-dark/70 border border-brand-secondary/80 hover:bg-brand-softYellow/50'
            }`}
          >
            Ver Todos
          </button>
        </div>
      </div>

      <main className="p-4 space-y-4">
        {/* Tarjeta de Resumen Operativo (Estética Proyecto Café) */}
        <div className="bg-white border border-brand-secondary/80 rounded-3xl p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between text-brand-dark text-xs font-bold pb-2 border-b border-brand-secondary/50">
            <span className="flex items-center gap-1.5 font-extrabold">
              <Receipt className="w-4 h-4 text-brand-brown" />
              <span>Cierre de Caja • {activeDayKey}</span>
            </span>
            <span className="bg-brand-softYellow text-brand-dark px-2.5 py-0.5 rounded-full text-[10px] font-black border border-brand-yellow">
              {activeCustomers.length} clientes en ruta
            </span>
          </div>

          {/* Métricas Principales */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-brand-cream/60 p-3 rounded-2xl border border-brand-secondary/60">
              <span className="text-[10px] text-brand-dark/70 block font-bold uppercase tracking-wider">
                Total de Ventas:
              </span>
              <span className="text-lg font-black text-brand-dark">
                {formatCurrency(totalVendidoDia)}
              </span>
            </div>

            <div className="bg-brand-softYellow/80 p-3 rounded-2xl border border-brand-yellow">
              <span className="text-[10px] text-brand-brown block font-bold uppercase tracking-wider">
                Total Cobrado:
              </span>
              <span className="text-lg font-black text-brand-dark">
                {formatCurrency(totalCobradoDia)}
              </span>
            </div>
          </div>

          {/* Desglose Efectivo vs Transferencia vs Gastos */}
          <div className="pt-2 border-t border-brand-secondary/50 grid grid-cols-3 gap-2 text-[11px]">
            <div className="bg-brand-bg p-2 rounded-xl border border-brand-secondary/60">
              <span className="text-[9px] text-brand-dark/60 block font-bold">EFECTIVO:</span>
              <span className="font-black text-brand-dark">{formatCurrency(totalEfectivo)}</span>
            </div>

            <div className="bg-brand-bg p-2 rounded-xl border border-brand-secondary/60">
              <span className="text-[9px] text-brand-dark/60 block font-bold">TRANSF:</span>
              <span className="font-black text-brand-dark">{formatCurrency(totalTransf)}</span>
            </div>

            <div className="bg-rose-50 p-2 rounded-xl border border-rose-200">
              <span className="text-[9px] text-rose-700 block font-bold">GASTOS:</span>
              <span className="font-black text-rose-800">{formatCurrency(totalGastosDia)}</span>
            </div>
          </div>

          {/* Alerta de Saldo Pendiente a Cobrar */}
          {totalDeudaPendiente > 0 && (
            <div className="bg-rose-50/80 border border-rose-200 p-2.5 rounded-2xl flex items-center justify-between text-xs text-rose-900">
              <span className="flex items-center gap-1 font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                Saldo pendiente en esta ruta:
              </span>
              <span className="font-black text-rose-700 text-sm">
                {formatCurrency(totalDeudaPendiente)}
              </span>
            </div>
          )}
        </div>

        {/* Detalle de Gastos del Día si los hay */}
        {activeExpenses.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-xs space-y-1.5 shadow-xs">
            <span className="font-black text-rose-900 flex items-center gap-1">
              💸 Gastos Registrados:
            </span>
            {activeExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between text-rose-800 font-medium">
                <span>• {exp.concept}</span>
                <span className="font-bold">{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Lista de Clientes en Hoja de Ruta */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-xs text-brand-dark uppercase tracking-wider">
              📋 Clientes en Ruta • {activeDayKey}
            </h3>
            <span className="text-[10px] text-brand-dark/60 font-bold">
              {activeCustomers.length} a visitar
            </span>
          </div>

          {activeCustomers.length === 0 ? (
            <div className="p-8 text-center bg-white border border-brand-secondary/80 rounded-2xl space-y-2 shadow-soft">
              <div className="w-10 h-10 rounded-full bg-brand-softYellow text-brand-brown mx-auto flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-sm text-brand-dark">Sin clientes para este día</h4>
              <p className="text-xs text-brand-dark/60">
                Podés crear un nuevo cliente o seleccionar otro día de la semana.
              </p>
              <Link
                to="/admin/clientes"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-brown text-white text-xs font-bold rounded-xl shadow-soft mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Cliente</span>
              </Link>
            </div>
          ) : (
            activeCustomers.map((cust) => {
              const isCobrado = cust.payment_status === 'COBRADO_TOTAL';
              const isPospuesto = cust.payment_status === 'POSPUESTO';

              return (
                <div
                  key={cust.id}
                  className={`bg-white rounded-2xl p-3.5 shadow-soft border transition-all space-y-2.5 ${
                    isCobrado
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : isPospuesto
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-brand-secondary/80 hover:border-brand-brown/40'
                  }`}
                >
                  {/* Encabezado: Nombre + Monto */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-xs sm:text-sm text-brand-dark truncate">
                          {cust.name}
                        </h4>
                        {isCobrado ? (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            COBRADO
                          </span>
                        ) : isPospuesto ? (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            POSPUESTO
                          </span>
                        ) : cust.debt_amount > 0 ? (
                          <span className="text-[9px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                            DEBE
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            AL DÍA
                          </span>
                        )}
                      </div>

                      {cust.address && (
                        <p className="text-[11px] text-brand-dark/60 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-brand-brown shrink-0" />
                          <span className="truncate">{cust.address}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold text-brand-dark/50 block">DEUDA/MONTO:</span>
                      <span className={`text-sm font-black ${isCobrado ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(cust.debt_amount || cust.last_order_amount || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Pedido Anterior / Detalle de Entrega */}
                  {cust.last_order_details && (
                    <div className="bg-brand-cream/60 p-2 rounded-xl border border-brand-secondary/60 text-xs">
                      <span className="font-bold text-brand-brown block text-[10px] mb-0.5">
                        📦 Detalle habitual / Último pedido:
                      </span>
                      <p className="text-brand-dark/80 font-medium leading-snug text-[11px]">
                        {cust.last_order_details}
                      </p>
                    </div>
                  )}

                  {/* Anotaciones de Cobro / Reparto */}
                  <div>
                    {editingNotesId === cust.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={tempNotes}
                          onChange={(e) => setTempNotes(e.target.value)}
                          placeholder="Ej: Pasó para el próximo reparto"
                          className="flex-1 px-2.5 py-1.5 bg-brand-bg border border-brand-secondary rounded-xl text-xs font-medium focus:outline-none focus:border-brand-brown"
                        />
                        <button
                          onClick={() => handleSaveNotes(cust)}
                          className="p-1.5 rounded-xl bg-brand-brown text-white font-bold text-xs active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-brand-dark/70 bg-brand-bg p-2 rounded-xl border border-brand-secondary/50">
                        <span className="italic truncate font-medium">
                          💬 {cust.cobro_notes || 'Sin anotaciones de cobro'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingNotesId(cust.id);
                            setTempNotes(cust.cobro_notes || '');
                          }}
                          className="text-brand-brown font-bold ml-1 hover:underline shrink-0"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Botones de Cobranza y Acciones Rápidas */}
                  <div className="pt-2 border-t border-brand-secondary/40 flex items-center justify-between gap-1.5">
                    {!isCobrado ? (
                      <div className="flex gap-1.5 flex-1">
                        <button
                          onClick={() => handleMarkAsCollected(cust, 'EFECTIVO')}
                          className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-[10px] rounded-xl shadow-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>EFECTIVO</span>
                        </button>

                        <button
                          onClick={() => handleMarkAsCollected(cust, 'TRANSFERENCIA')}
                          className="flex-1 py-1.5 px-2 bg-brand-brown hover:bg-brand-brown/90 text-white font-extrabold text-[10px] rounded-xl shadow-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                        >
                          <Wallet className="w-3 h-3" />
                          <span>TRANSF.</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-black text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cobrado ({cust.payment_method || 'OK'})</span>
                      </span>
                    )}

                    {/* Botón GPS */}
                    <button
                      onClick={() => handleNavigateGPS(cust)}
                      className="py-1.5 px-2 bg-brand-dark hover:bg-brand-dark/90 text-white font-bold text-[10px] rounded-xl flex items-center gap-1 active:scale-95 shadow-xs"
                      title="Navegar con GPS"
                    >
                      <Navigation className="w-3 h-3 fill-white" />
                      <span>GPS</span>
                    </button>

                    {/* Botón WhatsApp */}
                    <button
                      onClick={() => handleOpenWhatsapp(cust.phone, cust.name, cust.debt_amount || cust.last_order_amount)}
                      className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 active:scale-95 transition-all"
                      title="Enviar WhatsApp al cliente"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
};
