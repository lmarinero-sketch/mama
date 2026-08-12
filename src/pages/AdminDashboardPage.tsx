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
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export const AdminDashboardPage: React.FC = () => {
  const { customers, expenses, simulatedDate, setSimulatedDate, saveCustomer, userEmail } = useApp();
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');

  // Date Label Mapping according to the notebook photos
  const dateLabels: Record<string, { label: string; diaNo: string }> = {
    '2026-07-28': { label: 'Martes 28/07/26', diaNo: 'Día 26' },
    '2026-07-29': { label: 'Miércoles 29/07/26', diaNo: 'Día 26' },
    '2026-07-30': { label: 'Jueves 30/07/26', diaNo: 'Día 27' },
    '2026-07-31': { label: 'Viernes 31/07/26', diaNo: 'Día 28' },
    'TODOS': { label: 'Balance Acumulado Total', diaNo: '30/6 al 31/7' }
  };

  // Filter customers for the active simulated notebook day
  const activeCustomers = customers.filter((c) => {
    if (simulatedDate === 'TODOS') return true;
    return c.last_order_date === simulatedDate;
  });

  // Filter daily expenses for the active simulated notebook day
  const activeExpenses = expenses.filter((e) => {
    if (simulatedDate === 'TODOS') return true;
    return e.date === simulatedDate;
  });

  // Calculate Metrics matching notebook formulas
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
      colors: ['#10B981', '#059669', '#F59E0B']
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
    const text = `¡Hola ${name || ''}! Te contactamos de Fiambrería Mamá para coordinar el cobro/entrega por ${formatCurrency(amount || 0)}.`;
    window.open(buildWhatsappLink(phone, text), '_blank');
  };

  return (
    <div className="min-h-screen bg-cream-50 pb-24 max-w-md mx-auto relative border-x border-rose-100/40">
      {/* Top Header */}
      <div className="sticky top-0 z-30 glass-header border-b border-rose-100/60 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold text-slate-900 font-sans">
                Resumen Diario de Cobranza
              </h2>
              <span className="text-[10px] font-bold bg-deli-100 text-deli-700 px-2 py-0.5 rounded-full">
                {dateLabels[simulatedDate]?.diaNo || 'Libreta'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              San Juan • {dateLabels[simulatedDate]?.label}
            </p>
          </div>

          <Link
            to="/admin/clientes"
            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ Cliente</span>
          </Link>
        </div>

        {/* Date Selector Switcher (Simula los días de las fotos) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs font-bold">
          <button
            onClick={() => setSimulatedDate('2026-07-28')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              simulatedDate === '2026-07-28'
                ? 'bg-deli-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Día 26 (Mar 28/07)
          </button>

          <button
            onClick={() => setSimulatedDate('2026-07-29')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              simulatedDate === '2026-07-29'
                ? 'bg-deli-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Día 26 (Mié 29/07)
          </button>

          <button
            onClick={() => setSimulatedDate('2026-07-30')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              simulatedDate === '2026-07-30'
                ? 'bg-deli-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Día 27 (Jue 30/07)
          </button>

          <button
            onClick={() => setSimulatedDate('2026-07-31')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              simulatedDate === '2026-07-31'
                ? 'bg-deli-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Día 28 (Vie 31/07)
          </button>

          <button
            onClick={() => setSimulatedDate('TODOS')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              simulatedDate === 'TODOS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            📊 Ver Todo
          </button>
        </div>
      </div>

      <main className="p-4 space-y-4">
        {/* Main Financial Summary Box (Igual a la libreta de las fotos) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-300 text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Cierre de Caja del {dateLabels[simulatedDate]?.label}</span>
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] border border-emerald-500/30">
              {activeCustomers.length} clientes
            </span>
          </div>

          {/* Totales Principales */}
          <div className="grid grid-cols-2 gap-3 my-3">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              <span className="text-[10px] text-slate-400 block font-semibold">TOTAL VENDIDO:</span>
              <span className="text-xl font-extrabold text-white">
                {formatCurrency(totalVendidoDia)}
              </span>
            </div>

            <div className="bg-emerald-950/60 p-3 rounded-2xl border border-emerald-500/40">
              <span className="text-[10px] text-emerald-300 block font-semibold">TOTAL COBRADO:</span>
              <span className="text-xl font-extrabold text-emerald-400">
                {formatCurrency(totalCobradoDia)}
              </span>
            </div>
          </div>

          {/* Desglose Efectivo vs Transf vs Gastos */}
          <div className="pt-3 border-t border-slate-700/80 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
            <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/60">
              <span className="text-[9px] text-slate-400 block">EFECTIVO:</span>
              <span className="font-bold text-white">{formatCurrency(totalEfectivo)}</span>
            </div>

            <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/60">
              <span className="text-[9px] text-slate-400 block">TRANSF:</span>
              <span className="font-bold text-white">{formatCurrency(totalTransf)}</span>
            </div>

            <div className="bg-rose-950/50 p-2 rounded-xl border border-rose-500/30">
              <span className="text-[9px] text-rose-300 block">GASTOS:</span>
              <span className="font-bold text-rose-300">{formatCurrency(totalGastosDia)}</span>
            </div>
          </div>

          {/* Pendientes de cobro del día */}
          {totalDeudaPendiente > 0 && (
            <div className="mt-3 bg-amber-950/50 border border-amber-500/40 p-2.5 rounded-xl flex items-center justify-between text-xs text-amber-200">
              <span className="flex items-center gap-1 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Saldo pendiente a cobrar:
              </span>
              <span className="font-extrabold text-amber-300 text-sm">
                {formatCurrency(totalDeudaPendiente)}
              </span>
            </div>
          )}
        </div>

        {/* Detalle de Gastos del Día si los hay */}
        {activeExpenses.length > 0 && (
          <div className="bg-rose-50 border border-rose-200/80 p-3 rounded-2xl text-xs space-y-1.5">
            <span className="font-extrabold text-rose-900 flex items-center gap-1">
              💸 Gastos Registrados del Día:
            </span>
            {activeExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between text-rose-800 font-medium">
                <span>• {exp.concept}</span>
                <span className="font-bold">{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Lista de Clientes y Deudas del Día de la Libreta */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
              📋 Clientes del {dateLabels[simulatedDate]?.label}
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">
              Exactos de la foto
            </span>
          </div>

          {activeCustomers.map((cust) => {
            const isCobrado = cust.payment_status === 'COBRADO_TOTAL';
            const isPospuesto = cust.payment_status === 'POSPUESTO';

            return (
              <div
                key={cust.id}
                className={`bg-white rounded-2xl p-4 shadow-mobile-card border transition-all ${
                  isCobrado
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isPospuesto
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-rose-100/80 hover:border-deli-300'
                }`}
              >
                {/* Header: Name + Amount */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">
                        {cust.name}
                      </h4>
                      {isCobrado ? (
                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          COBRADO
                        </span>
                      ) : isPospuesto ? (
                        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full">
                          POSPUESTO
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold bg-rose-100 text-deli-700 px-2 py-0.2 rounded-full">
                          PENDIENTE
                        </span>
                      )}
                    </div>

                    {cust.address && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{cust.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 block">MONTO:</span>
                    <span className={`text-base font-extrabold ${isCobrado ? 'text-emerald-700' : 'text-deli-700'}`}>
                      {formatCurrency(cust.last_order_amount)}
                    </span>
                  </div>
                </div>

                {/* Pedido Anterior / Detalle de Compra */}
                {cust.last_order_details && (
                  <div className="bg-cream-100/70 p-2.5 rounded-xl border border-amber-200/60 mb-2 text-xs">
                    <span className="font-bold text-amber-900 block text-[11px] mb-0.5">
                      📦 Detalle del Pedido:
                    </span>
                    <p className="text-slate-800 font-medium leading-snug">
                      {cust.last_order_details}
                    </p>
                  </div>
                )}

                {/* Anotaciones de Cobro del Cuaderno */}
                <div className="mb-3">
                  {editingNotesId === cust.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Ej: Pasaron para el Martes Rendido"
                        className="flex-1 px-2.5 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-medium focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveNotes(cust)}
                        className="p-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                      <span className="italic truncate font-medium">
                        💬 {cust.cobro_notes || 'Sin anotaciones de cobro'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingNotesId(cust.id);
                          setTempNotes(cust.cobro_notes || '');
                        }}
                        className="text-deli-600 font-bold ml-1 hover:underline shrink-0"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>

                {/* Acciones Táctiles en 1 Tap */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {!isCobrado ? (
                    <div className="flex gap-1.5 flex-1">
                      <button
                        onClick={() => handleMarkAsCollected(cust, 'EFECTIVO')}
                        className="flex-1 py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>EFECTIVO</span>
                      </button>

                      <button
                        onClick={() => handleMarkAsCollected(cust, 'TRANSFERENCIA')}
                        className="flex-1 py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>TRANSF.</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Cobrado con {cust.payment_method || 'Éxito'}</span>
                    </span>
                  )}

                  {/* Botón GPS */}
                  <button
                    onClick={() => handleNavigateGPS(cust)}
                    className="py-2 px-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1 active:scale-95 shadow-2xs"
                    title="Navegar con GPS"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-white" />
                    <span>GPS</span>
                  </button>

                  {/* Botón WhatsApp */}
                  <button
                    onClick={() => handleOpenWhatsapp(cust.phone, cust.name, cust.last_order_amount)}
                    className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 active:scale-95"
                    title="Enviar WhatsApp al cliente"
                  >
                    <MessageCircle className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
};
