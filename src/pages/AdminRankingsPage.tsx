import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { 
  Trophy, 
  Users, 
  Package, 
  DollarSign, 
  Scale, 
  TrendingUp, 
  ArrowUpRight, 
  MessageCircle, 
  RefreshCw,
  Award,
  AlertCircle
} from 'lucide-react';
import { generateWhatsAppCobroUrl } from '../lib/orders';

interface CustomerRankItem {
  id: string;
  name: string;
  phone?: string;
  visit_day?: string;
  totalSpent: number;
  debtAmount: number;
  orderCount: number;
  avgTicket: number;
}

interface ProductRankItem {
  id: string;
  name: string;
  unit: string;
  image_url?: string;
  price: number;
  cost_price: number;
  totalQtySold: number;
  totalRevenue: number;
  estimatedProfit: number;
  timesOrdered: number;
}

export const AdminRankingsPage: React.FC = () => {
  const { customers, products } = useApp();
  const [activeTab, setActiveTab] = useState<'CLIENTES' | 'PRODUCTOS'>('CLIENTES');
  const [clientRankFilter, setClientRankFilter] = useState<'VENTAS' | 'DEUDA' | 'PEDIDOS'>('VENTAS');
  const [productRankFilter, setProductRankFilter] = useState<'CANTIDAD' | 'FACTURACION' | 'RENTABILIDAD'>('CANTIDAD');
  const [loading, setLoading] = useState(true);

  const [customerRankings, setCustomerRankings] = useState<CustomerRankItem[]>([]);
  const [productRankings, setProductRankings] = useState<ProductRankItem[]>([]);

  useEffect(() => {
    loadRankingsData();
  }, [customers, products]);

  async function loadRankingsData() {
    setLoading(true);

    try {
      // 1. Obtener todos los pedidos y sus ítems de Supabase
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id,
          customer_id,
          actual_total,
          estimated_total,
          status,
          items:order_items(
            product_id,
            product_name,
            requested_qty,
            actual_qty_weight,
            unit_price,
            unit_cost,
            unit,
            subtotal
          )
        `);

      const orders = ordersData || [];

      // 2. Procesar Ranking de Clientes
      const clientMap: Record<string, CustomerRankItem> = {};
      customers.forEach(c => {
        clientMap[c.id] = {
          id: c.id,
          name: c.name,
          phone: c.phone,
          visit_day: c.visit_day || c.preferred_day || 'Lunes',
          totalSpent: 0,
          debtAmount: Number(c.debt_amount || 0),
          orderCount: 0,
          avgTicket: 0
        };
      });

      orders.forEach(o => {
        const cId = o.customer_id;
        const total = Number(o.actual_total || o.estimated_total || 0);
        if (clientMap[cId]) {
          clientMap[cId].totalSpent += total;
          clientMap[cId].orderCount += 1;
        }
      });

      // Calcular tickets promedio
      Object.values(clientMap).forEach(c => {
        c.avgTicket = c.orderCount > 0 ? +(c.totalSpent / c.orderCount).toFixed(2) : 0;
      });

      setCustomerRankings(Object.values(clientMap));

      // 3. Procesar Ranking de Productos
      const productMap: Record<string, ProductRankItem> = {};
      products.forEach(p => {
        productMap[p.id] = {
          id: p.id,
          name: p.name,
          unit: p.unit || 'kg',
          image_url: p.image_url,
          price: Number(p.price || 0),
          cost_price: Number(p.cost_price || 0),
          totalQtySold: 0,
          totalRevenue: 0,
          estimatedProfit: 0,
          timesOrdered: 0
        };
      });

      orders.forEach(o => {
        (o.items || []).forEach((item: any) => {
          const pId = item.product_id;
          const qty = Number(item.actual_qty_weight || item.requested_qty || 0);
          const revenue = Number(item.subtotal || 0);
          const cost = Number(item.unit_cost || 0) * qty;

          if (productMap[pId]) {
            productMap[pId].totalQtySold += qty;
            productMap[pId].totalRevenue += revenue;
            productMap[pId].estimatedProfit += (revenue - cost);
            productMap[pId].timesOrdered += 1;
          } else if (item.product_name) {
            productMap[item.product_name] = {
              id: item.product_name,
              name: item.product_name,
              unit: item.unit || 'kg',
              price: item.unit_price || 0,
              cost_price: item.unit_cost || 0,
              totalQtySold: qty,
              totalRevenue: revenue,
              estimatedProfit: revenue - cost,
              timesOrdered: 1
            };
          }
        });
      });

      setProductRankings(Object.values(productMap));
    } catch (e) {
      console.error('Error calculando rankings:', e);
    } finally {
      setLoading(false);
    }
  }

  // Ordenar clientes según filtro
  const sortedCustomers = [...customerRankings].sort((a, b) => {
    if (clientRankFilter === 'VENTAS') return b.totalSpent - a.totalSpent;
    if (clientRankFilter === 'DEUDA') return b.debtAmount - a.debtAmount;
    if (clientRankFilter === 'PEDIDOS') return b.orderCount - a.orderCount;
    return 0;
  });

  // Ordenar productos según filtro
  const sortedProducts = [...productRankings].sort((a, b) => {
    if (productRankFilter === 'CANTIDAD') return b.totalQtySold - a.totalQtySold;
    if (productRankFilter === 'FACTURACION') return b.totalRevenue - a.totalRevenue;
    if (productRankFilter === 'RENTABILIDAD') return b.estimatedProfit - a.estimatedProfit;
    return 0;
  });

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark pb-28 max-w-lg mx-auto relative border-x border-brand-secondary/40">
      {/* Sticky Mobile Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-brand-secondary/80 p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-brown text-white flex items-center justify-center font-bold shadow-soft">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-brand-dark leading-tight">
                Rankings & Estadísticas
              </h2>
              <p className="text-[11px] text-brand-dark/70">
                Top clientes más compradores y fiambres más vendidos
              </p>
            </div>
          </div>

          <button
            onClick={loadRankingsData}
            className="p-2 rounded-xl bg-brand-cream hover:bg-brand-secondary/50 text-brand-brown active:scale-95 transition-all border border-brand-secondary"
            title="Actualizar métricas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Selector Clientes vs Productos */}
        <div className="flex bg-brand-cream p-1 rounded-xl border border-brand-secondary/80">
          <button
            onClick={() => setActiveTab('CLIENTES')}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'CLIENTES' ? 'bg-brand-brown text-white shadow-soft' : 'text-brand-dark/70 hover:text-brand-dark'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ranking Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab('PRODUCTOS')}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'PRODUCTOS' ? 'bg-brand-brown text-white shadow-soft' : 'text-brand-dark/70 hover:text-brand-dark'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Ranking Fiambres</span>
          </button>
        </div>

        {/* Subfiltros */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {activeTab === 'CLIENTES' ? (
            <>
              <button
                onClick={() => setClientRankFilter('VENTAS')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  clientRankFilter === 'VENTAS' ? 'bg-brand-softYellow text-brand-brown border border-brand-yellow font-black shadow-xs' : 'bg-white text-brand-dark/70 border border-brand-secondary/80'
                }`}
              >
                💰 Más Compradores ($)
              </button>
              <button
                onClick={() => setClientRankFilter('DEUDA')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  clientRankFilter === 'DEUDA' ? 'bg-rose-50 text-rose-800 border border-rose-200 font-black' : 'bg-white text-brand-dark/70 border border-brand-secondary/80'
                }`}
              >
                ⚠️ Mayor Deuda ($)
              </button>
              <button
                onClick={() => setClientRankFilter('PEDIDOS')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  clientRankFilter === 'PEDIDOS' ? 'bg-blue-50 text-blue-800 border border-blue-200 font-black' : 'bg-white text-brand-dark/70 border border-brand-secondary/80'
                }`}
              >
                📦 Más Pedidos
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setProductRankFilter('CANTIDAD')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  productRankFilter === 'CANTIDAD' ? 'bg-brand-softYellow text-brand-brown border border-brand-yellow font-black shadow-xs' : 'bg-white text-brand-dark/70 border border-brand-secondary/80'
                }`}
              >
                ⚖️ Más Vendidos (Kilos)
              </button>
              <button
                onClick={() => setProductRankFilter('FACTURACION')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  productRankFilter === 'FACTURACION' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-black' : 'bg-white text-brand-dark/70 border border-brand-secondary/80'
                }`}
              >
                💵 Mayor Facturación ($)
              </button>
              <button
                onClick={() => setProductRankFilter('RENTABILIDAD')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  productRankFilter === 'RENTABILIDAD' ? 'bg-purple-50 text-purple-800 border border-purple-200 font-black' : 'bg-white text-brand-dark/70 border border-brand-secondary/80'
                }`}
              >
                📈 Más Rentables (Margen)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lista de Ranking */}
      <div className="p-3.5 space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-brand-dark/60 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-brown" />
            Calculando estadísticas y posiciones...
          </div>
        ) : activeTab === 'CLIENTES' ? (
          /* LISTADO RANKING CLIENTES */
          sortedCustomers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-brand-secondary/70 shadow-soft text-xs text-brand-dark/60">
              No hay datos de clientes aún.
            </div>
          ) : (
            sortedCustomers.map((cust, idx) => {
              return (
                <div
                  key={cust.id}
                  className={`bg-white border rounded-2xl p-3.5 space-y-2.5 shadow-soft transition-all ${
                    idx === 0 
                      ? 'border-brand-brown bg-gradient-to-r from-brand-softYellow/40 to-white' 
                      : idx === 1
                      ? 'border-brand-secondary bg-white'
                      : idx === 2
                      ? 'border-brand-secondary/80 bg-white'
                      : 'border-brand-secondary/60 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-xl shrink-0 font-bold">
                        {getMedal(idx)}
                      </span>
                      <div className="truncate">
                        <h3 className="text-sm font-extrabold text-brand-dark truncate">
                          {cust.name}
                        </h3>
                        <div className="text-[10px] text-brand-dark/60 flex items-center gap-2">
                          <span>Día: <strong className="text-brand-brown">{cust.visit_day}</strong></span>
                          <span>• {cust.orderCount} pedidos</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black font-mono text-brand-brown">
                        {clientRankFilter === 'DEUDA' 
                          ? formatCurrency(cust.debtAmount) 
                          : formatCurrency(cust.totalSpent)}
                      </div>
                      <div className="text-[9px] text-brand-dark/60 uppercase font-semibold">
                        {clientRankFilter === 'DEUDA' ? 'Deuda Actual' : 'Total Comprado'}
                      </div>
                    </div>
                  </div>

                  {/* Detalle secundario */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-brand-secondary/40 text-[11px] text-brand-dark/70">
                    <div>
                      Ticket Promedio: <strong className="text-brand-dark">{formatCurrency(cust.avgTicket)}</strong>
                    </div>

                    {cust.debtAmount > 0 && clientRankFilter !== 'DEUDA' && (
                      <span className="text-rose-700 font-bold">
                        Debe: {formatCurrency(cust.debtAmount)}
                      </span>
                    )}

                    {cust.phone && (
                      <button
                        onClick={() => {
                          const url = generateWhatsAppCobroUrl(cust.name, cust.phone, cust.debtAmount || cust.totalSpent);
                          window.open(url, '_blank');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 active:scale-95"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-700" />
                        <span>WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* LISTADO RANKING PRODUCTOS */
          sortedProducts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-brand-secondary/70 shadow-soft text-xs text-brand-dark/60">
              No hay ventas de productos registradas.
            </div>
          ) : (
            sortedProducts.map((prod, idx) => {
              return (
                <div
                  key={prod.id}
                  className={`bg-white border rounded-2xl p-3.5 space-y-2.5 shadow-soft transition-all ${
                    idx === 0 
                      ? 'border-brand-brown bg-gradient-to-r from-brand-softYellow/40 to-white' 
                      : 'border-brand-secondary/60 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-xl shrink-0 font-bold">
                        {getMedal(idx)}
                      </span>
                      {prod.image_url && (
                        <img 
                          src={prod.image_url} 
                          alt={prod.name} 
                          className="w-10 h-10 rounded-xl object-cover bg-brand-cream shrink-0 border border-brand-secondary/60" 
                        />
                      )}
                      <div className="truncate">
                        <h3 className="text-xs font-extrabold text-brand-dark truncate">
                          {prod.name}
                        </h3>
                        <div className="text-[10px] text-brand-dark/60">
                          {formatCurrency(prod.price)} / {prod.unit}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black font-mono text-brand-brown">
                        {productRankFilter === 'CANTIDAD' 
                          ? `${prod.totalQtySold.toFixed(2)} ${prod.unit}`
                          : productRankFilter === 'RENTABILIDAD'
                          ? formatCurrency(prod.estimatedProfit)
                          : formatCurrency(prod.totalRevenue)
                        }
                      </div>
                      <div className="text-[9px] text-brand-dark/60 uppercase font-semibold">
                        {productRankFilter === 'CANTIDAD' 
                          ? 'Volumen Vendido'
                          : productRankFilter === 'RENTABILIDAD'
                          ? 'Ganancia Neta Est.'
                          : 'Facturado Total'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Resumen Métricas Producto */}
                  <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-brand-secondary/40 text-center text-[10px]">
                    <div className="bg-brand-bg p-1.5 rounded-lg border border-brand-secondary/60">
                      <div className="text-brand-dark/60">Vendido:</div>
                      <div className="font-bold text-brand-dark">{prod.totalQtySold.toFixed(2)} {prod.unit}</div>
                    </div>
                    <div className="bg-brand-bg p-1.5 rounded-lg border border-brand-secondary/60">
                      <div className="text-brand-dark/60">Facturación:</div>
                      <div className="font-bold text-brand-brown font-mono">{formatCurrency(prod.totalRevenue)}</div>
                    </div>
                    <div className="bg-brand-bg p-1.5 rounded-lg border border-brand-secondary/60">
                      <div className="text-brand-dark/60">Ganancia:</div>
                      <div className="font-bold text-emerald-800 font-mono">{formatCurrency(prod.estimatedProfit)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>

      <AdminBottomNav />
    </div>
  );
};
