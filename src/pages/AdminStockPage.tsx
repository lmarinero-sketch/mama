import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, AlertTriangle, TrendingUp, DollarSign, Search, 
  RefreshCw, CheckCircle2, Truck, Calendar, X 
} from 'lucide-react';
import { Product, SupplierPurchase } from '../types';
import { fetchInventoryProducts, updateProductStock, fetchSupplierPurchases, recordSupplierPurchase } from '../lib/inventory';

export const AdminStockPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<SupplierPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'STOCK' | 'COMPRAS'>('STOCK');

  // Modal Ingreso de Mercadería (Chileno)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [supplierName, setSupplierName] = useState('Chileno');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<Array<{ product_id: string; quantity: number; unit_cost: number }>>([]);
  const [submitting, setSubmitting] = useState(false);

  // Edición directa de stock
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editingStockVal, setEditingStockVal] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [prods, purs] = await Promise.all([
      fetchInventoryProducts(),
      fetchSupplierPurchases()
    ]);
    setProducts(prods);
    setPurchases(purs);
    setLoading(false);
  }

  async function handleSaveSingleStock(productId: string) {
    const success = await updateProductStock(productId, editingStockVal);
    if (success) {
      setEditingStockId(null);
      loadData();
    }
  }

  function handleAddPurchaseItem() {
    if (products.length > 0) {
      setPurchaseItems([
        ...purchaseItems,
        { product_id: products[0].id, quantity: 10, unit_cost: products[0].price * 0.7 }
      ]);
    }
  }

  function handleUpdatePurchaseItem(index: number, field: string, val: any) {
    setPurchaseItems(purchaseItems.map((item, i) => i === index ? { ...item, [field]: val } : item));
  }

  async function handleCreatePurchaseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (purchaseItems.length === 0) return;

    setSubmitting(true);
    const success = await recordSupplierPurchase(
      supplierName,
      invoiceNumber,
      purchaseDate,
      purchaseItems,
      notes
    );
    setSubmitting(false);

    if (success) {
      setShowPurchaseModal(false);
      setSupplierName('Chileno');
      setInvoiceNumber('');
      setPurchaseItems([]);
      setNotes('');
      loadData();
    }
  }

  const lowStockProducts = products.filter(p => (p.stock_quantity || 0) <= (p.min_stock_alert || 5));
  const totalComprasAcumuladas = purchases.reduce((sum, p) => sum + p.total_amount, 0);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-24">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2.5 rounded-xl border border-blue-500/30">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Inventario y Compras (Chileno)</h1>
              <p className="text-xs text-slate-400">Control de stock e historial de inversión con proveedores</p>
            </div>
          </div>

          <button
            onClick={() => {
              handleAddPurchaseItem();
              setShowPurchaseModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-sm transition-all shadow-md active:scale-95"
          >
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Cargar Compra / Factura</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Banner de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Alertas de Bajo Stock</div>
              <div className="text-2xl font-extrabold text-white">
                {lowStockProducts.length} <span className="text-xs font-normal text-slate-400">productos</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Compras Acumuladas (Proveedores)</div>
              <div className="text-xl font-extrabold text-emerald-400">
                ${totalComprasAcumuladas.toLocaleString('es-AR')}
              </div>
            </div>
          </div>
        </div>

        {/* Pestanas */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'STOCK' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📦 Control de Stock ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('COMPRAS')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'COMPRAS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚚 Historial de Compras ({purchases.length})
          </button>
        </div>

        {/* Pestaña Stock */}
        {activeTab === 'STOCK' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar producto por nombre o categoría..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                Cargando inventario...
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map(prod => {
                  const isLow = (prod.stock_quantity || 0) <= (prod.min_stock_alert || 5);
                  const isEditing = editingStockId === prod.id;

                  return (
                    <div 
                      key={prod.id}
                      className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-3 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-12 h-12 rounded-lg object-cover bg-slate-900" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">
                            🧀
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white text-sm">{prod.name}</div>
                          <div className="text-xs text-slate-400">
                            Precio: <strong className="text-amber-400 font-mono">${prod.price} / {prod.unit}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isLow && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Bajo Stock
                          </span>
                        )}

                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={editingStockVal}
                              onChange={e => setEditingStockVal(parseFloat(e.target.value) || 0)}
                              className="w-20 bg-slate-900 border border-blue-500 text-white font-mono font-bold text-sm p-1.5 rounded-lg text-center focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveSingleStock(prod.id)}
                              className="bg-blue-600 text-white text-xs font-bold p-2 rounded-lg"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingStockId(prod.id);
                              setEditingStockVal(prod.stock_quantity || 0);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-mono font-bold text-sm border transition-all ${
                              isLow
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                                : 'bg-slate-900 border-slate-700 text-blue-400 hover:border-blue-500'
                            }`}
                          >
                            {prod.stock_quantity || 0} {prod.unit}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pestaña Compras */}
        {activeTab === 'COMPRAS' && (
          <div className="space-y-3">
            {purchases.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-8 text-center space-y-3">
                <Truck className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-slate-300">No hay facturas cargadas</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Registra las facturas recibidas de proveedores como "El Chileno" para sumar inventario automáticamente.
                </p>
              </div>
            ) : (
              purchases.map(pur => (
                <div key={pur.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <div>
                      <span className="font-bold text-white text-base">🚚 Proveedor: {pur.supplier_name}</span>
                      <p className="text-xs text-slate-400">
                        Factura N°: {pur.invoice_number || 'S/N'} • Fecha: {pur.purchase_date}
                      </p>
                    </div>
                    <div className="text-right font-extrabold text-emerald-400 text-lg font-mono">
                      ${pur.total_amount.toLocaleString('es-AR')}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="font-bold text-slate-400 mb-1">Ítems comprados:</div>
                    {pur.items?.map(item => (
                      <div key={item.id} className="flex justify-between py-0.5">
                        <span>{item.product?.name}</span>
                        <span className="font-mono text-slate-400">
                          {item.quantity} u x ${item.unit_cost} = <strong className="text-white">${item.subtotal}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Cargar Compra / Factura */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/80">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-400" />
                Registrar Factura / Ingreso de Mercadería
              </h2>
              <button onClick={() => setShowPurchaseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchaseSubmit} className="p-4 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Proveedor *</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">N° Factura</label>
                  <input
                    type="text"
                    placeholder="Ej: F-00045"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Ítems */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Productos Ingresados
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItem}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Ítem
                  </button>
                </div>

                {purchaseItems.map((item, index) => (
                  <div key={index} className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2">
                    <select
                      value={item.product_id}
                      onChange={e => handleUpdatePurchaseItem(index, 'product_id', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400">Cantidad Ingresada</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantity}
                          onChange={e => handleUpdatePurchaseItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400">Costo Unitario ($)</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.unit_cost}
                          onChange={e => handleUpdatePurchaseItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || purchaseItems.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-lg active:scale-95"
                >
                  {submitting ? 'Guardando...' : 'Confirmar Ingreso y Aumentar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
