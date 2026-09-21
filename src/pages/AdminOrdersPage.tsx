import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Calendar, DollarSign, MessageCircle, CheckCircle2, 
  Clock, AlertCircle, FileText, Scale, User, Search, RefreshCw, X, 
  Download, Share2, Check, ArrowRight, Wallet, Percent, Tag
} from 'lucide-react';
import { Order, Customer, Product } from '../types';
import { 
  fetchOrders, 
  createOrder, 
  updateOrderActualWeight, 
  registerPayment, 
  generateWhatsAppCobroUrl, 
  ALIAS_TRANSFERENCIA 
} from '../lib/orders';
import { downloadOrderPDF, shareOrderViaWhatsApp } from '../lib/pdfGenerator';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import confetti from 'canvas-confetti';

interface CartItemEntry {
  product: Product;
  qty: number;
}

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDIENTE' | 'TODOS' | 'COBRADO'>('PENDIENTE');
  const [searchTerm, setSearchTerm] = useState('');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<{ order: Order; customer: Customer } | null>(null);

  // Formulario nuevo pedido
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cartItems, setCartItems] = useState<CartItemEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [customerModalSearch, setCustomerModalSearch] = useState('');
  const [productModalSearch, setProductModalSearch] = useState('');

  // Estado para el modal de cobranza rápida
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Formulario ajuste de balanza / pesaje real
  const [weightItems, setWeightItems] = useState<Array<{ 
    id: string; 
    product_id: string; 
    name: string; 
    unit: string; 
    requested: number; 
    actual: number; 
    price: number 
  }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [ordersData, { data: custData }, { data: prodData }] = await Promise.all([
      fetchOrders(),
      supabase.from('customers').select('*').order('name'),
      supabase.from('products').select('*').eq('is_available', true).order('name')
    ]);

    setOrders(ordersData);
    setCustomers(custData || []);
    setProducts(prodData || []);
    setLoading(false);
  }

  // Manejo de Carrito con soporte de decimales (ej. 1.5kg, 0.450kg)
  function handleAddToCart(product: Product, defaultQty: number = 1.0) {
    const existingIndex = cartItems.findIndex(i => i.product.id === product.id);
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].qty = +(updated[existingIndex].qty + defaultQty).toFixed(3);
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { product, qty: defaultQty }]);
    }
  }

  function handleSetCartQty(productId: string, newQty: number) {
    if (newQty <= 0) {
      setCartItems(cartItems.filter(i => i.product.id !== productId));
      return;
    }
    setCartItems(cartItems.map(i => i.product.id === productId ? { ...i, qty: +newQty.toFixed(3) } : i));
  }

  function handleAddQuickQty(productId: string, delta: number) {
    setCartItems(cartItems.map(i => {
      if (i.product.id === productId) {
        const next = Math.max(0.05, +(i.qty + delta).toFixed(3));
        return { ...i, qty: next };
      }
      return i;
    }));
  }

  async function handleCreateOrderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId || cartItems.length === 0) return;

    setSubmitting(true);
    const items = cartItems.map(i => ({
      product_id: i.product.id,
      product_name: i.product.name,
      requested_qty: i.qty,
      unit_price: i.product.price,
      unit_cost: i.product.cost_price || 0,
      unit: i.product.unit || 'kg'
    }));

    const created = await createOrder(selectedCustomerId, items, orderNotes);
    setSubmitting(false);

    if (created) {
      const cust = customers.find(c => c.id === selectedCustomerId) || created.customer;
      if (cust) {
        setLastCreatedOrder({ order: created, customer: cust });
        setShowSuccessModal(true);
      }

      setShowCreateModal(false);
      setSelectedCustomerId('');
      setCartItems([]);
      setOrderNotes('');
      loadData();

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5E7B60', '#DCE6C6', '#243627']
      });
    }
  }

  function handleOpenPaymentModal(order: Order) {
    setSelectedOrder(order);
    const remaining = (order.actual_total || order.estimated_total || 0) - (order.paid_amount || 0);
    setPaymentAmount(Math.max(0, remaining));
    setPaymentMethod('EFECTIVO');
    setPaymentNotes('');
    setShowPaymentModal(true);
  }

  async function handleRegisterPaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder || paymentAmount <= 0) return;

    setSubmitting(true);
    const success = await registerPayment({
      customerId: selectedOrder.customer_id,
      orderId: selectedOrder.id,
      amount: paymentAmount,
      paymentMethod,
      notes: paymentNotes || `Cobro de Pedido #${selectedOrder.order_number || selectedOrder.id.slice(0, 6)}`
    });
    setSubmitting(false);

    if (success) {
      setShowPaymentModal(false);
      setSelectedOrder(null);
      loadData();
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#5E7B60', '#DCE6C6', '#243627']
      });
    }
  }

  function handleOpenWeightModal(order: Order) {
    setSelectedOrder(order);
    if (order.items) {
      setWeightItems(
        order.items.map(item => ({
          id: item.id || '',
          product_id: item.product_id || '',
          name: item.product_name || item.product?.name || 'Fiambre',
          unit: item.unit || item.product?.unit || 'kg',
          requested: Number(item.requested_qty || 0),
          actual: Number(item.actual_qty_weight || item.requested_qty || 0),
          price: Number(item.unit_price || 0)
        }))
      );
    }
    setShowWeightModal(true);
  }

  async function handleSaveWeightSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;

    setSubmitting(true);
    const updated = await updateOrderActualWeight(
      selectedOrder.id,
      weightItems.map(w => ({
        id: w.id,
        product_id: w.product_id,
        actual_qty_weight: w.actual,
        unit_price: w.price
      }))
    );
    setSubmitting(false);

    if (updated) {
      setShowWeightModal(false);
      loadData();
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(order.order_number || '').includes(searchTerm);
    
    if (activeTab === 'PENDIENTE') {
      return matchesSearch && order.payment_status !== 'COBRADO_TOTAL';
    }
    if (activeTab === 'COBRADO') {
      return matchesSearch && order.payment_status === 'COBRADO_TOTAL';
    }
    return matchesSearch;
  });

  const totalPendienteCobro = orders
    .filter(o => o.payment_status !== 'COBRADO_TOTAL')
    .reduce((sum, o) => {
      const orderTotal = o.actual_total || o.estimated_total || 0;
      const paid = o.paid_amount || 0;
      return sum + Math.max(0, orderTotal - paid);
    }, 0);

  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark pb-28 max-w-lg mx-auto relative border-x border-brand-secondary/40">
      {/* Sticky Mobile Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-brand-secondary/80 p-3.5 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-brown text-white p-2 rounded-xl shadow-soft">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-brand-dark flex items-center gap-1.5">
                Pedidos & Remitos
              </h1>
              <p className="text-[11px] text-brand-dark/70">Venta por peso y cobro a 7 días</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-brand-brown hover:bg-brand-brown/90 text-white font-bold px-3 py-2 rounded-xl text-xs transition-all shadow-soft active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Pedido</span>
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-3.5">
        {/* Banner Total Pendiente de Cobro */}
        <div className="bg-white border border-brand-secondary/80 rounded-2xl p-3.5 flex items-center justify-between shadow-soft">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-brand-brown uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Pendiente de Cobro
            </span>
            <div className="text-2xl font-black text-brand-dark">
              {formatCurrency(totalPendienteCobro)}
            </div>
            <p className="text-[10px] text-brand-dark/60">
              {orders.filter(o => o.payment_status !== 'COBRADO_TOTAL').length} boletas por cobrar
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-brand-dark/60">Alias Transferencia:</div>
            <div className="font-mono text-brand-brown font-black text-xs bg-brand-softYellow/70 px-2 py-1 rounded-lg border border-brand-yellow mt-0.5 inline-block">
              {ALIAS_TRANSFERENCIA}
            </div>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-brand-dark/40" />
            <input
              type="text"
              placeholder="Buscar cliente, nº pedido..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-brand-secondary/80 rounded-xl pl-9 pr-3 py-2 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20 shadow-xs"
            />
          </div>

          <div className="flex bg-white p-1 rounded-xl border border-brand-secondary/80 shadow-xs">
            <button
              onClick={() => setActiveTab('PENDIENTE')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'PENDIENTE' ? 'bg-brand-brown text-white shadow-soft' : 'text-brand-dark/70 hover:text-brand-dark'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setActiveTab('COBRADO')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'COBRADO' ? 'bg-brand-brown text-white shadow-soft' : 'text-brand-dark/70 hover:text-brand-dark'
              }`}
            >
              Cobrados
            </button>
            <button
              onClick={() => setActiveTab('TODOS')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'TODOS' ? 'bg-brand-softYellow text-brand-dark font-black' : 'text-brand-dark/70 hover:text-brand-dark'
              }`}
            >
              Todos ({orders.length})
            </button>
          </div>
        </div>

        {/* Lista de Pedidos en Tarjetas Blancas */}
        {loading ? (
          <div className="text-center py-12 text-brand-dark/60 flex items-center justify-center gap-2 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-brown" />
            Cargando pedidos de fiambrería...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-brand-secondary/70 rounded-2xl p-8 text-center space-y-2 shadow-soft">
            <ShoppingBag className="w-10 h-10 text-brand-secondary mx-auto" />
            <h3 className="text-sm font-bold text-brand-dark">No hay pedidos para mostrar</h3>
            <p className="text-xs text-brand-dark/60">Toca el botón "+ Pedido" para registrar el primero.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const totalAmount = order.actual_total || order.estimated_total || 0;
              const paidAmount = order.paid_amount || 0;
              const pendingOrderDebt = Math.max(0, totalAmount - paidAmount);
              const isPaid = order.payment_status === 'COBRADO_TOTAL';
              const isPartial = order.payment_status === 'COBRADO_PARCIAL';

              return (
                <div 
                  key={order.id}
                  className="bg-white border border-brand-secondary/60 rounded-2xl p-3.5 space-y-3 shadow-soft hover:border-brand-brown/40 transition-all"
                >
                  {/* Encabezado Pedido */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-brand-brown bg-brand-softYellow px-2 py-0.5 rounded-md border border-brand-yellow">
                          {order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 6)}`}
                        </span>
                        <h3 className="text-sm font-extrabold text-brand-dark leading-tight">
                          {order.customer?.name || 'Cliente'}
                        </h3>
                      </div>
                      <div className="text-[11px] text-brand-dark/70 flex items-center gap-2 mt-1">
                        <span>📅 {order.order_date}</span>
                        {order.customer?.visit_day && (
                          <span className="text-brand-brown font-bold">
                            • Visita: {order.customer.visit_day}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge Estado */}
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        isPaid 
                          ? 'bg-brand-softYellow text-brand-brown border border-brand-yellow' 
                          : isPartial
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}>
                        {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isPaid ? 'COBRADO' : isPartial ? 'PARCIAL' : 'PENDIENTE'}
                      </span>
                    </div>
                  </div>

                  {/* Detalle de Productos en este Pedido */}
                  <div className="bg-brand-bg rounded-xl p-2.5 space-y-1.5 border border-brand-secondary/60">
                    {(order.items || []).map((item, idx) => {
                      const qty = Number(item.actual_qty_weight || item.requested_qty || 0);
                      const unit = item.unit || item.product?.unit || 'kg';
                      return (
                        <div key={idx} className="flex justify-between text-xs items-center">
                          <span className="text-brand-dark font-medium truncate max-w-[200px]">
                            • {item.product_name || item.product?.name || 'Fiambre'}
                          </span>
                          <span className="text-brand-dark/70 font-mono text-[11px]">
                            <strong className="text-brand-brown">{qty} {unit}</strong> x ${item.unit_price} = <strong className="text-brand-dark">${item.subtotal}</strong>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Totales y Saldo */}
                  <div className="flex items-center justify-between pt-1 border-t border-brand-secondary/40 text-xs">
                    <div>
                      <div className="text-brand-dark/60 text-[11px]">Total Boleta:</div>
                      <div className="text-base font-black text-brand-brown font-mono">
                        {formatCurrency(totalAmount)}
                      </div>
                    </div>

                    {!isPaid && (
                      <div className="text-right">
                        <div className="text-brand-dark/60 text-[11px]">Saldo a Cobrar:</div>
                        <div className="text-sm font-extrabold text-rose-700 font-mono">
                          {formatCurrency(pendingOrderDebt)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Barra de Acciones Móviles: PDF, WhatsApp, Cobrar, Balanza */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {/* Botón Descargar PDF */}
                    <button
                      onClick={() => order.customer && downloadOrderPDF(order, order.customer)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-brand-cream hover:bg-brand-secondary/50 text-brand-dark text-[10px] font-bold transition-all active:scale-95 border border-brand-secondary"
                      title="Descargar comprobante PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-brown mb-0.5" />
                      <span>PDF</span>
                    </button>

                    {/* Botón WhatsApp */}
                    <button
                      onClick={() => order.customer && shareOrderViaWhatsApp(order, order.customer)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold transition-all active:scale-95 border border-emerald-200"
                      title="Enviar por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700 mb-0.5" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Botón Balanza */}
                    <button
                      onClick={() => handleOpenWeightModal(order)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-brand-cream hover:bg-brand-secondary/50 text-brand-dark text-[10px] font-bold transition-all active:scale-95 border border-brand-secondary"
                      title="Ajustar peso real en balanza"
                    >
                      <Scale className="w-3.5 h-3.5 text-brand-brown mb-0.5" />
                      <span>Balanza</span>
                    </button>

                    {/* Botón Cobrar */}
                    <button
                      onClick={() => handleOpenPaymentModal(order)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                        isPaid 
                          ? 'bg-brand-cream text-brand-dark/50 border border-brand-secondary/60' 
                          : 'bg-brand-brown hover:bg-brand-brown/90 text-white shadow-soft font-black'
                      }`}
                      title={isPaid ? 'Ver pagos / Cobrado' : 'Registrar Cobro'}
                    >
                      <Wallet className="w-3.5 h-3.5 mb-0.5" />
                      <span>{isPaid ? 'Cobrado' : 'Cobrar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL NUEVO PEDIDO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-brand-secondary rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-soft-lg overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Header Modal */}
            <div className="p-3.5 border-b border-brand-secondary/70 flex items-center justify-between bg-brand-cream">
              <h2 className="font-extrabold text-brand-dark text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-brown" />
                Nueva Orden de Pedido
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-brand-dark/60 hover:text-brand-dark p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-3.5 overflow-y-auto space-y-3.5 flex-1">
              {/* Selector de Cliente con Buscador en Tiempo Real */}
              <div>
                <label className="block text-[11px] font-bold text-brand-dark mb-1 uppercase tracking-wider">
                  1. Cliente *
                </label>

                {selectedCustomerObj ? (
                  /* Cliente Seleccionado */
                  <div className="p-3 bg-brand-softYellow/70 border border-brand-yellow rounded-2xl flex items-center justify-between shadow-xs">
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-black text-brand-dark flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-brand-brown shrink-0" />
                        <span className="truncate">{selectedCustomerObj.name}</span>
                      </div>
                      <div className="text-[10px] text-brand-dark/70 flex items-center gap-2 mt-0.5">
                        <span>Ruta: <strong className="text-brand-brown">{selectedCustomerObj.visit_day || 'Sin asignar'}</strong></span>
                        {selectedCustomerObj.debt_amount > 0 ? (
                          <span className="text-rose-700 font-extrabold">• Debe: {formatCurrency(selectedCustomerObj.debt_amount)}</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">• Al Día</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId('');
                        setCustomerModalSearch('');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white text-brand-dark border border-brand-secondary text-[10px] font-bold hover:bg-rose-50 hover:text-rose-700 active:scale-95 transition-all shrink-0"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  /* Buscador de Clientes */
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-brand-dark/40 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Buscar cliente por nombre, dirección o teléfono..."
                        value={customerModalSearch}
                        onChange={e => setCustomerModalSearch(e.target.value)}
                        className="w-full bg-white border border-brand-secondary rounded-xl pl-8 pr-7 py-2 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20 shadow-xs"
                      />
                      {customerModalSearch && (
                        <button
                          type="button"
                          onClick={() => setCustomerModalSearch('')}
                          className="absolute right-2.5 top-2 text-brand-dark/40 hover:text-brand-dark p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Lista Desplegable Filtrada de Clientes */}
                    <div className="max-h-36 overflow-y-auto border border-brand-secondary/80 rounded-xl bg-white divide-y divide-brand-secondary/40 shadow-xs">
                      {customers.filter(c => {
                        if (!customerModalSearch.trim()) return true;
                        const q = customerModalSearch.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(q) ||
                          (c.address && c.address.toLowerCase().includes(q)) ||
                          (c.phone && c.phone.includes(q)) ||
                          (c.visit_day && c.visit_day.toLowerCase().includes(q))
                        );
                      }).length === 0 ? (
                        <div className="p-3 text-center text-xs text-brand-dark/50">
                          No se encontró ningún cliente con ese nombre
                        </div>
                      ) : (
                        customers.filter(c => {
                          if (!customerModalSearch.trim()) return true;
                          const q = customerModalSearch.toLowerCase();
                          return (
                            c.name.toLowerCase().includes(q) ||
                            (c.address && c.address.toLowerCase().includes(q)) ||
                            (c.phone && c.phone.includes(q)) ||
                            (c.visit_day && c.visit_day.toLowerCase().includes(q))
                          );
                        }).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerModalSearch('');
                            }}
                            className="w-full text-left p-2.5 hover:bg-brand-softYellow/60 transition-colors flex items-center justify-between gap-2 active:bg-brand-softYellow"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-brand-dark truncate">{c.name}</div>
                              <div className="text-[10px] text-brand-dark/60 truncate">
                                {c.address ? `${c.address} • ` : ''}Visita: <strong className="text-brand-brown">{c.visit_day || 'Lunes'}</strong>
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              {c.debt_amount > 0 ? (
                                <span className="text-[9px] font-black text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                  Debe ${c.debt_amount}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Al Día
                                </span>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Buscador y Catálogo de Fiambres para Agregar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-brand-dark uppercase tracking-wider">
                    2. Buscar y Agregar Fiambres y Quesos
                  </label>
                </div>

                {/* Input Buscador de Productos */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-brand-dark/40 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre (ej: Tybo, Jamón, Gouda, Salame)..."
                    value={productModalSearch}
                    onChange={e => setProductModalSearch(e.target.value)}
                    className="w-full bg-white border border-brand-secondary rounded-xl pl-8 pr-7 py-2 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20 shadow-xs"
                  />
                  {productModalSearch && (
                    <button
                      type="button"
                      onClick={() => setProductModalSearch('')}
                      className="absolute right-2.5 top-2 text-brand-dark/40 hover:text-brand-dark p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Lista Filtrada de Productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {products.filter(p => {
                    if (!productModalSearch.trim()) return true;
                    const q = productModalSearch.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      (p.description && p.description.toLowerCase().includes(q)) ||
                      (p.badge_text && p.badge_text.toLowerCase().includes(q))
                    );
                  }).length === 0 ? (
                    <div className="col-span-2 p-4 text-center text-xs text-brand-dark/50 bg-white rounded-xl border border-brand-secondary/60">
                      No se encontraron fiambres o quesos para "{productModalSearch}".
                    </div>
                  ) : (
                    products.filter(p => {
                      if (!productModalSearch.trim()) return true;
                      const q = productModalSearch.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        (p.description && p.description.toLowerCase().includes(q)) ||
                        (p.badge_text && p.badge_text.toLowerCase().includes(q))
                      );
                    }).map(p => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 bg-white border border-brand-secondary/70 rounded-xl text-left shadow-xs hover:border-brand-brown/40 transition-all"
                      >
                        <div className="truncate pr-1">
                          <div className="text-xs font-extrabold text-brand-dark truncate">{p.name}</div>
                          <div className="text-[10px] text-brand-brown font-mono font-bold">
                            ${p.price.toLocaleString('es-AR')} / {p.unit}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(p, 0.5)}
                            className="px-1.5 py-1 bg-brand-cream hover:bg-brand-secondary/50 text-brand-dark rounded text-[10px] font-bold border border-brand-secondary active:scale-95"
                            title="Agregar 0.5 kg"
                          >
                            +0.5kg
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(p, 1.0)}
                            className="px-2 py-1 bg-brand-brown hover:bg-brand-brown/90 text-white rounded text-[10px] font-bold shadow-xs active:scale-95"
                            title="Agregar 1 kg"
                          >
                            +1kg
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Ítems Seleccionados con Input Numérico Decimal y Atajos */}
              {cartItems.length > 0 && (
                <div className="bg-brand-bg border border-brand-secondary/80 rounded-2xl p-3 space-y-2.5 shadow-xs">
                  <div className="text-xs font-bold text-brand-brown border-b border-brand-secondary/70 pb-1 flex justify-between">
                    <span>Ítems en el Pedido ({cartItems.length})</span>
                    <span>Subtotal</span>
                  </div>

                  {cartItems.map(item => {
                    const itemSubtotal = +(item.qty * item.product.price).toFixed(2);
                    return (
                      <div key={item.product.id} className="p-2 bg-white rounded-xl border border-brand-secondary/60 space-y-1.5 shadow-xs">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-brand-dark truncate max-w-[180px]">
                            {item.product.name}
                          </span>
                          <span className="font-mono font-black text-brand-brown text-xs">
                            {formatCurrency(itemSubtotal)}
                          </span>
                        </div>

                        {/* Control de cantidad con decimales y chips rápidos */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-brand-dark/70 font-medium">Peso/Cant:</span>
                            <input
                              type="number"
                              step="0.05"
                              min="0.05"
                              value={item.qty}
                              onChange={e => handleSetCartQty(item.product.id, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-brand-bg border border-brand-brown rounded-lg py-1 px-1.5 text-center text-xs font-mono font-bold text-brand-dark focus:outline-none"
                            />
                            <span className="text-[10px] text-brand-dark/70 font-bold">{item.product.unit}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAddQuickQty(item.product.id, -0.25)}
                              className="px-1.5 py-0.5 bg-brand-cream text-brand-dark rounded text-[10px] font-bold border border-brand-secondary"
                            >
                              -0.25
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddQuickQty(item.product.id, 0.25)}
                              className="px-1.5 py-0.5 bg-brand-cream text-brand-dark rounded text-[10px] font-bold border border-brand-secondary"
                            >
                              +0.25
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddQuickQty(item.product.id, 0.5)}
                              className="px-1.5 py-0.5 bg-brand-softYellow text-brand-brown rounded text-[10px] font-black border border-brand-yellow"
                            >
                              +0.5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetCartQty(item.product.id, 0)}
                              className="p-1 text-rose-600 hover:text-rose-700"
                              title="Quitar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2 flex justify-between text-sm font-extrabold text-brand-dark border-t border-brand-secondary/70">
                    <span>Total Estimado del Pedido:</span>
                    <span className="text-base font-black text-brand-brown font-mono">
                      {formatCurrency(cartItems.reduce((s, i) => s + (i.qty * i.product.price), 0))}
                    </span>
                  </div>
                </div>
              )}

              {/* Notas de la Entrega */}
              <div>
                <label className="block text-[11px] font-bold text-brand-dark mb-1">
                  Notas de Entrega o Balanza
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tybo en barra entera, jamón feteado fino..."
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="w-full bg-white border border-brand-secondary rounded-xl p-2.5 text-xs text-brand-dark focus:outline-none focus:border-brand-brown shadow-xs"
                />
              </div>

              {/* Botón Guardar */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting || !selectedCustomerId || cartItems.length === 0}
                  className="w-full bg-brand-brown hover:bg-brand-brown/90 disabled:opacity-50 text-white font-black py-3.5 rounded-xl text-sm transition-all shadow-soft active:scale-95 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {submitting ? 'Emitiendo Pedido...' : 'Confirmar Pedido & Generar PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO & ACCIONES DE PDF / WHATSAPP TRAS CREAR PEDIDO */}
      {showSuccessModal && lastCreatedOrder && (
        <div className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-brand-secondary rounded-2xl w-full max-w-sm p-4 space-y-4 shadow-soft-lg text-center">
            <div className="w-12 h-12 bg-brand-softYellow text-brand-brown rounded-full flex items-center justify-center mx-auto border border-brand-yellow">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-brand-dark">¡Pedido Registrado con Éxito!</h3>
              <p className="text-xs text-brand-dark/70">
                Cliente: <strong className="text-brand-dark">{lastCreatedOrder.customer.name}</strong>
              </p>
              <div className="text-xl font-black text-brand-brown font-mono pt-1">
                {formatCurrency(lastCreatedOrder.order.actual_total || lastCreatedOrder.order.estimated_total)}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => downloadOrderPDF(lastCreatedOrder.order, lastCreatedOrder.customer)}
                className="w-full flex items-center justify-center gap-2 bg-brand-brown hover:bg-brand-brown/90 text-white font-bold py-2.5 rounded-xl text-xs shadow-soft transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Remito en PDF</span>
              </button>

              <button
                onClick={() => shareOrderViaWhatsApp(lastCreatedOrder.order, lastCreatedOrder.customer)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-soft transition-all active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Compartir Detalle por WhatsApp</span>
              </button>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-2 text-xs font-semibold text-brand-dark/60 hover:text-brand-dark"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COBRAR PEDIDO */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-brand-secondary rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-4 space-y-3.5 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-brand-secondary/60 pb-2.5">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-brown" />
                <h3 className="font-bold text-brand-dark text-sm">Registrar Cobranza</h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-brand-dark/60 hover:text-brand-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPaymentSubmit} className="space-y-3">
              <div className="bg-brand-cream p-2.5 rounded-xl border border-brand-secondary/80 text-xs space-y-1">
                <div className="text-brand-dark/70">Cliente: <strong className="text-brand-dark">{selectedOrder.customer?.name}</strong></div>
                <div className="text-brand-dark/70">Total Boleta: <strong className="text-brand-brown font-mono font-bold">{formatCurrency(selectedOrder.actual_total || selectedOrder.estimated_total)}</strong></div>
                <div className="text-brand-dark/70">Cobrado previamente: <strong className="text-brand-dark font-mono">{formatCurrency(selectedOrder.paid_amount || 0)}</strong></div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-dark mb-1">Monto a Cobrar ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-brand-brown rounded-xl p-2.5 text-base font-mono font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-brown/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-dark mb-1">Medio de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('EFECTIVO')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'EFECTIVO'
                        ? 'bg-brand-softYellow text-brand-brown border-brand-brown font-black'
                        : 'bg-white text-brand-dark/60 border-brand-secondary'
                    }`}
                  >
                    💵 Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFERENCIA')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === 'TRANSFERENCIA'
                        ? 'bg-brand-softYellow text-brand-brown border-brand-brown font-black'
                        : 'bg-white text-brand-dark/60 border-brand-secondary'
                    }`}
                  >
                    🏦 Transferencia
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-dark mb-1">Notas del Pago</label>
                <input
                  type="text"
                  placeholder="Ej: Pago total en mano / Transferencia acreditada"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full bg-white border border-brand-secondary rounded-xl p-2 text-xs text-brand-dark focus:outline-none focus:border-brand-brown"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || paymentAmount <= 0}
                className="w-full bg-brand-brown hover:bg-brand-brown/90 disabled:opacity-50 text-white font-black py-3 rounded-xl text-xs transition-all shadow-soft active:scale-95"
              >
                {submitting ? 'Registrando...' : 'Confirmar Cobro e Imputar a Cta Cte'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BALANZA (Pesaje Real) */}
      {showWeightModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-brand-secondary rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-soft-lg">
            <div className="flex items-center justify-between border-b border-brand-secondary/60 pb-2">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-brand-brown" />
                <h3 className="font-bold text-brand-dark text-sm">Pesaje Real en Balanza</h3>
              </div>
              <button onClick={() => setShowWeightModal(false)} className="text-brand-dark/60 hover:text-brand-dark">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWeightSubmit} className="space-y-3">
              <p className="text-[11px] text-brand-dark/70">
                Cliente: <strong className="text-brand-dark">{selectedOrder.customer?.name}</strong>
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {weightItems.map((item, idx) => (
                  <div key={item.id} className="bg-brand-bg p-2.5 rounded-xl border border-brand-secondary/70 space-y-1.5">
                    <div className="text-xs font-bold text-brand-dark flex justify-between">
                      <span className="truncate">{item.name}</span>
                      <span className="text-brand-brown font-mono font-bold">${item.price}/{item.unit}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-brand-dark/70">
                      <span>Estimado: {item.requested} {item.unit}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-brand-dark">Real:</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.actual}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setWeightItems(weightItems.map((w, i) => i === idx ? { ...w, actual: val } : w));
                          }}
                          className="w-20 bg-white border border-brand-brown rounded-lg p-1 text-center text-brand-dark font-black font-mono text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex justify-between text-xs font-extrabold text-brand-dark">
                <span>Nuevo Total Real:</span>
                <span className="text-sm font-black text-brand-brown font-mono">
                  {formatCurrency(weightItems.reduce((sum, w) => sum + w.actual * w.price, 0))}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-brown hover:bg-brand-brown/90 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-soft active:scale-95"
              >
                {submitting ? 'Guardando...' : 'Guardar Pesaje Real'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navegación Móvil Inferior */}
      <AdminBottomNav />
    </div>
  );
};
