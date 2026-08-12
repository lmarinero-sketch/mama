import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Plus, Calendar, DollarSign, MessageCircle, CheckCircle2, 
  Clock, AlertCircle, FileText, Scale, User, Search, RefreshCw, X, ChevronRight 
} from 'lucide-react';
import { Order, Customer, Product } from '../types';
import { fetchOrders, createOrder, updateOrderActualWeight, markOrderAsPaid, generateWhatsAppCobroUrl, ALIAS_TRANSFERENCIA } from '../lib/orders';
import { supabase } from '../lib/supabase';

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Formulario nuevo pedido
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [cartItems, setCartItems] = useState<Array<{ product: Product; qty: number }>>([]);
  const [submitting, setSubmitting] = useState(false);

  // Formulario ajuste de balanza / pesaje real
  const [weightItems, setWeightItems] = useState<Array<{ id: string; product_id: string; name: string; unit: string; requested: number; actual: number; price: number }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [ordersData, { data: custData }, { data: prodData }] = await Promise.all([
      fetchOrders(),
      supabase.from('customers').select('*').order('name'),
      supabase.from('products').select('*').order('name')
    ]);

    setOrders(ordersData);
    setCustomers(custData || []);
    setProducts(prodData || []);
    setLoading(false);
  }

  function handleAddToCart(product: Product) {
    const existing = cartItems.find(i => i.product.id === product.id);
    if (existing) {
      setCartItems(cartItems.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCartItems([...cartItems, { product, qty: 1 }]);
    }
  }

  function handleUpdateCartQty(productId: string, delta: number) {
    setCartItems(cartItems.map(i => {
      if (i.product.id === productId) {
        const newQty = Math.max(0.1, +(i.qty + delta).toFixed(2));
        return { ...i, qty: newQty };
      }
      return i;
    }).filter(i => i.qty > 0));
  }

  async function handleCreateOrderSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomerId || cartItems.length === 0) return;

    setSubmitting(true);
    const items = cartItems.map(i => ({
      product_id: i.product.id,
      requested_qty: i.qty,
      unit_price: i.product.price
    }));

    const created = await createOrder(selectedCustomerId, items, orderNotes);
    setSubmitting(false);

    if (created) {
      setShowCreateModal(false);
      setSelectedCustomerId('');
      setCartItems([]);
      setOrderNotes('');
      loadData();
    }
  }

  function handleOpenWeightModal(order: Order) {
    setSelectedOrder(order);
    if (order.items) {
      setWeightItems(
        order.items.map(item => ({
          id: item.id || '',
          product_id: item.product_id,
          name: item.product?.name || 'Producto',
          unit: item.product?.unit || 'Unidad',
          requested: item.requested_qty,
          actual: item.actual_qty_weight || item.requested_qty,
          price: item.unit_price
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

  async function handleMarkPaid(order: Order, method: 'EFECTIVO' | 'TRANSFERENCIA') {
    const success = await markOrderAsPaid(order.id, order.customer_id, method, order.actual_total || order.estimated_total);
    if (success) {
      loadData();
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
    .reduce((sum, o) => sum + (o.actual_total || o.estimated_total), 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-24">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/30">
              <ShoppingBag className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Boletas y Cobros a 7 Días
              </h1>
              <p className="text-xs text-slate-400">Ruta semanal de pedidos y pesaje real</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-sm transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Pedido</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Banner Total Pendiente */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
              Total Pendiente de Cobro (7 Días)
            </span>
            <div className="text-2xl font-extrabold text-white">
              ${totalPendienteCobro.toLocaleString('es-AR')}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Alias de Transferencia:</div>
            <div className="font-mono text-amber-300 font-bold text-sm bg-slate-800 px-2 py-1 rounded-md border border-slate-700 mt-1">
              {ALIAS_TRANSFERENCIA}
            </div>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o nota..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('PENDIENTE')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'PENDIENTE' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pendientes de Cobro
            </button>
            <button
              onClick={() => setActiveTab('COBRADO')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'COBRADO' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cobrados
            </button>
            <button
              onClick={() => setActiveTab('TODOS')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'TODOS' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Lista de Pedidos */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            Cargando boletas y cobros...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-300">No se encontraron pedidos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Presiona "Nuevo Pedido" para cargar una boleta en la ruta de visitas de San Juan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const isPaid = order.payment_status === 'COBRADO_TOTAL';
              const whatsappUrl = generateWhatsAppCobroUrl(
                order.customer?.name || 'Cliente',
                order.customer?.phone,
                order.actual_total || order.estimated_total,
                order.order_date,
                order.items?.map(i => `${i.actual_qty_weight || i.requested_qty} ${i.product?.name || ''}`).join(', ')
              );

              return (
                <div 
                  key={order.id}
                  className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl p-4 transition-all space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-700/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-400" />
                        <h3 className="font-bold text-white text-base">
                          {order.customer?.name || 'Cliente Sin Nombre'}
                        </h3>
                        {order.customer?.is_referred && (
                          <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Referido
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        📍 {order.customer?.address || 'San Juan'} • {order.customer?.phone || 'Sin teléfono'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isPaid 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                      }`}>
                        {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {isPaid ? 'COBRADO' : 'COBRO PENDIENTE (7 DÍAS)'}
                      </span>
                      <div className="text-xs text-slate-400 mt-1">
                        Cobro agendado: <strong className="text-slate-200">{order.due_date}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Ítems del Pedido */}
                  <div className="space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1">
                      <span>Detalle del Pedido</span>
                      <span className="text-[10px] text-amber-400 font-mono">
                        {order.status === 'DESPACHADO' ? '✅ Pesaje Real en Balanza' : '⏳ Preventa Estimada'}
                      </span>
                    </div>

                    {order.items?.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs text-slate-300 py-0.5">
                        <span className="font-medium text-slate-200">
                          {item.product?.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono">
                            {item.actual_qty_weight || item.requested_qty} {item.product?.unit || 'u'} x ${item.unit_price}
                          </span>
                          <span className="font-bold text-white font-mono">
                            ${item.subtotal.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">Total Boleta:</span>
                      <span className="text-lg font-extrabold text-amber-400">
                        ${(order.actual_total || order.estimated_total).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {/* Botonera Móvil de Acciones */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Cobrar x WhatsApp
                      </a>

                      <button
                        onClick={() => handleOpenWeightModal(order)}
                        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-400" />
                        Ajustar Balanza
                      </button>
                    </div>

                    {!isPaid && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleMarkPaid(order, 'EFECTIVO')}
                          className="bg-slate-700 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          💵 Cobrado Efectivo
                        </button>
                        <button
                          onClick={() => handleMarkPaid(order, 'TRANSFERENCIA')}
                          className="bg-slate-700 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          🏦 Transferencia
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nuevo Pedido */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/80">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Cargar Boleta de Pedido en Ruta
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Selección de Cliente */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Seleccionar Cliente *
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Elige un Cliente de la lista --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.address ? `(${c.address})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Productos */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Agregar Productos al Pedido
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {products.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      className="flex items-center justify-between p-2.5 bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl text-left transition-all active:scale-95"
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs font-bold text-slate-200 truncate">{p.name}</div>
                        <div className="text-[10px] text-amber-400 font-mono">${p.price} / {p.unit}</div>
                      </div>
                      <Plus className="w-4 h-4 text-amber-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Carrito de Productos Seleccionados */}
              {cartItems.length > 0 && (
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-bold text-slate-300 border-b border-slate-700 pb-1">
                    Productos en la Boleta
                  </div>
                  {cartItems.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
                      <span className="text-slate-200 font-medium truncate max-w-[150px]">
                        {item.product.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.product.id, -0.5)}
                          className="bg-slate-700 text-slate-300 w-6 h-6 rounded-md font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-amber-400 min-w-[40px] text-center">
                          {item.qty} {item.product.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.product.id, 0.5)}
                          className="bg-slate-700 text-slate-300 w-6 h-6 rounded-md font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 flex justify-between text-sm font-extrabold text-amber-400">
                    <span>Total Estimado:</span>
                    <span>
                      ${cartItems.reduce((s, i) => s + i.qty * i.product.price, 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              )}

              {/* Notas de la Entrega */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Notas de la Entrega</label>
                <input
                  type="text"
                  placeholder="Ej: Entregar temprano el miércoles..."
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || !selectedCustomerId || cartItems.length === 0}
                  className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-lg active:scale-95"
                >
                  {submitting ? 'Guardando Boleta...' : ' Confirmar Pedido (Cobro a 7 Días)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste de Balanza (Pesaje Real) */}
      {showWeightModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl w-full max-w-md p-4 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Ajuste de Pesaje Real en Balanza</h3>
              </div>
              <button onClick={() => setShowWeightModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWeightSubmit} className="space-y-3">
              <p className="text-xs text-slate-400">
                Cliente: <strong className="text-slate-200">{selectedOrder.customer?.name}</strong>
              </p>

              {weightItems.map((item, idx) => (
                <div key={item.id} className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                  <div className="text-xs font-bold text-white flex justify-between">
                    <span>{item.name}</span>
                    <span className="text-amber-400 font-mono">${item.price} / {item.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Pedido inicial: {item.requested} {item.unit}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">Peso Real:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.actual}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setWeightItems(weightItems.map((w, i) => i === idx ? { ...w, actual: val } : w));
                        }}
                        className="w-24 bg-slate-900 border border-slate-600 rounded-lg p-1.5 text-center text-amber-300 font-bold font-mono text-sm focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-between text-sm font-extrabold text-amber-400">
                <span>Nuevo Total Real:</span>
                <span>
                  ${weightItems.reduce((sum, w) => sum + w.actual * w.price, 0).toLocaleString('es-AR')}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all shadow-md active:scale-95"
              >
                {submitting ? 'Guardando...' : 'Guardar Pesaje Real'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
