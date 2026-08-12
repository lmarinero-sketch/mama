import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Lock, Mail, Key, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAdmin, isAuthenticated } = useApp();
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/admin');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const ok = await loginAdmin(email, password);
    setIsLoading(false);

    if (ok) {
      navigate('/admin');
    } else {
      setErrorMsg('Credenciales inválidas. Usa admin@demo.com / password123');
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@demo.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4 max-w-md mx-auto relative">
      <div className="w-full bg-white rounded-3xl p-6 shadow-mobile-card border border-rose-100/80">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-deli-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo Público</span>
        </Link>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-deli-600 to-rose-400 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-rose-200">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">
            Panel de Control CMS
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Fiambrería y Delicatessen <span className="font-bold text-deli-600">Mamá</span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-deli-700 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                placeholder="admin@demo.com"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-cream-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-deli-500/40 focus:outline-none"
                placeholder="••••••••"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-deli-600 to-rose-500 hover:from-deli-700 hover:to-rose-600 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-rose-200 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'INGRESANDO...' : 'INICIAR SESIÓN (ADMIN)'}</span>
          </button>
        </form>

        {/* Demo Quick Button */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 mb-2">¿Probando la versión demo?</p>
          <button
            onClick={handleDemoFill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Cargar datos demo (admin@demo.com)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
