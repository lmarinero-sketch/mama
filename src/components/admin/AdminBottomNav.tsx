import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingBag, Trophy, LogOut, Eye, BookOpen } from 'lucide-react';
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
    { label: 'Ruta Hoy', path: '/admin', icon: LayoutDashboard },
    { label: 'Pedidos', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Clientes', path: '/admin/clientes', icon: Users },
    { label: 'Fiambres', path: '/admin/productos', icon: Package },
    { label: 'Rankings', path: '/admin/rankings', icon: Trophy },
    { label: 'Manual', path: '/admin/manual', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-secondary/80 shadow-lg">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-95 ${
                isActive
                  ? 'bg-brand-softYellow text-brand-brown font-black border border-brand-yellow/80 scale-105 shadow-xs'
                  : 'text-brand-dark/70 hover:text-brand-dark font-semibold'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-brown' : 'text-brand-dark/70'}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Ver Catálogo Público */}
        <Link
          to="/"
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-brand-green hover:bg-brand-cream active:scale-95 font-semibold"
          title="Ver catálogo público"
        >
          <Eye className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 tracking-tight">Catálogo</span>
        </Link>

        {/* Salir */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-rose-600 hover:bg-rose-50 active:scale-95 font-semibold"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[10px] mt-0.5 tracking-tight">Salir</span>
        </button>
      </div>
    </nav>
  );
};
