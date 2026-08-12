import React from 'react';
import { ShoppingBag, Lock, Search, Store, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';

interface HeaderMobileProps {
  onOpenCart: () => void;
  showSearch: boolean;
  setShowSearch: (val: boolean) => void;
}

export const HeaderMobile: React.FC<HeaderMobileProps> = ({
  onOpenCart,
  showSearch,
  setShowSearch,
}) => {
  const { cart, isAuthenticated, searchQuery, setSearchQuery } = useApp();
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 glass-header border-b border-rose-100/60 transition-all duration-200">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-deli-600 to-rose-400 flex items-center justify-center shadow-md shadow-rose-200 text-white font-extrabold text-lg tracking-wider">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-slate-900 text-base tracking-tight leading-none font-sans">
                  Fiambres <span className="text-deli-600">Mamá</span>
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Abierto
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Fiambrería & Delicatessen</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Search Toggle Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2.5 rounded-xl transition-all ${
                showSearch
                  ? 'bg-deli-100 text-deli-700'
                  : 'bg-white/80 text-slate-600 hover:bg-rose-50 border border-slate-200/60'
              }`}
              aria-label="Buscar productos"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart Tray Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-gradient-to-r from-deli-600 to-rose-500 text-white shadow-md shadow-rose-200 active:scale-95 transition-all flex items-center justify-center"
              aria-label="Ver pedido"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Admin Access Lock */}
            <Link
              to={isAuthenticated ? "/admin" : "/login"}
              className="p-2.5 rounded-xl bg-cream-100 text-slate-600 hover:text-deli-600 border border-amber-200/60 active:scale-95 transition-all"
              title="Acceso Administración"
            >
              <Lock className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {showSearch && (
          <div className="mt-3 pt-2 border-t border-rose-100 animate-fadeIn">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar jamón, queso, combos, salame..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl text-sm border border-rose-200 focus:outline-none focus:ring-2 focus:ring-deli-500/40 text-slate-800 placeholder-slate-400 shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full px-2 py-0.5"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
