import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Edit3, Package, Users, ShoppingBag, Truck, LogOut, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutAdmin } = useApp();

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión de administración?')) {
      await logoutAdmin();
      navigate('/login');
    }
  };

  const navItems = [
    { label: 'Resumen', path: '/admin', icon: LayoutDashboard },
    { label: 'Pedidos 7D', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Stock', path: '/admin/stock', icon: Truck },
    { label: 'Clientes', path: '/admin/clientes', icon: Users },
    { label: 'Editor', path: '/admin/editor', icon: Edit3 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl">
      <div className="max-w-md mx-auto px-1 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-400 font-extrabold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : ''}`} />
              <span className="text-[9px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Ver Sitio Público */}
        <Link
          to="/"
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-emerald-400 hover:bg-emerald-500/10 active:scale-95 font-medium"
          title="Ver tienda pública"
        >
          <Eye className="w-4 h-4" />
          <span className="text-[9px] tracking-tight">Ver Sitio</span>
        </Link>

        {/* Salir */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-rose-400 hover:bg-rose-500/10 active:scale-95 font-medium"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[9px] tracking-tight">Salir</span>
        </button>
      </div>
    </div>
  );
};
