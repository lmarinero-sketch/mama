import React from 'react';
import { useApp } from '../../context/AppContext';
import { Utensils, Flame, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';

export const CategoryPills: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory } = useApp();

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'fiambres-cocidos':
        return '🍖';
      case 'curados-embutidos':
        return '🥓';
      case 'quesos-blandos':
        return '🧀';
      case 'quesos-estacionados':
        return '🧀';
      case 'combos-picadas':
        return '🧺';
      default:
        return '✨';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2 sticky top-[61px] z-30 glass-header border-b border-rose-100/40">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
        {/* 'Todos' Pill */}
        <button
          onClick={() => setSelectedCategory('todos')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 shadow-sm ${
            selectedCategory === 'todos'
              ? 'bg-deli-600 text-white shadow-rose-200'
              : 'bg-white text-slate-700 hover:bg-rose-50 border border-slate-200/80'
          }`}
        >
          <span>✨</span>
          <span>Todos los Fiambres</span>
        </button>

        {/* Categories List */}
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 shadow-sm ${
                isActive
                  ? 'bg-deli-600 text-white shadow-rose-200'
                  : 'bg-white text-slate-700 hover:bg-rose-50 border border-slate-200/80'
              }`}
            >
              <span>{getCategoryIcon(cat.slug)}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
