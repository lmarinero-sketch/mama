import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Edit3, Package, Users, LogOut, Eye } from 'lucide-react';
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
    { label: 'Editor Wix', path: '/admin/editor', icon: Edit3 },
    { label: 'Productos', path: '/admin/productos', icon: Package },
    { label: 'Clientes GPS', path: '/admin/clientes', icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-rose-100 shadow-mobile-nav">
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
                  ? 'bg-deli-50 text-deli-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-deli-600' : ''}`} />
              <span className="text-[9px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Ver Sitio Público */}
        <Link
          to="/"
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-emerald-700 hover:bg-emerald-50 active:scale-95 font-medium"
          title="Ver página pública"
        >
          <Eye className="w-4 h-4" />
          <span className="text-[9px] tracking-tight">Ver Sitio</span>
        </Link>

        {/* Salir */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-rose-500 hover:bg-rose-50 active:scale-95 font-medium"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[9px] tracking-tight">Salir</span>
        </button>
      </div>
    </div>
  );
};
