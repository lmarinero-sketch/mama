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
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 max-w-md mx-auto relative font-sans text-brand-dark">
      <div className="w-full bg-white rounded-3xl p-6 shadow-soft border border-brand-secondary/80">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark/60 hover:text-brand-brown mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo Público</span>
        </Link>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-brown text-white flex items-center justify-center mx-auto mb-3 shadow-soft">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-brand-dark tracking-tight">
            Panel de Control Preventa
          </h2>
          <p className="text-xs text-brand-dark/70 mt-1">
            Fiambrería y Delicatessen <span className="font-extrabold text-brand-brown">Mamá</span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Correo Electrónico</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-brand-bg border border-brand-secondary/80 rounded-xl text-xs text-brand-dark font-semibold focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown focus:outline-none"
                placeholder="admin@demo.com"
              />
              <Mail className="w-4 h-4 text-brand-dark/40 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">Contraseña</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-brand-bg border border-brand-secondary/80 rounded-xl text-xs text-brand-dark font-semibold focus:ring-2 focus:ring-brand-brown/20 focus:border-brand-brown focus:outline-none"
                placeholder="••••••••"
              />
              <Key className="w-4 h-4 text-brand-dark/40 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-brand-brown hover:bg-brand-brown/90 text-white font-extrabold text-xs rounded-2xl shadow-soft active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isLoading ? 'INGRESANDO...' : 'INICIAR SESIÓN (ADMIN)'}</span>
          </button>
        </form>

        {/* Demo Quick Button */}
        <div className="mt-6 pt-4 border-t border-brand-secondary/60 text-center">
          <p className="text-[11px] text-brand-dark/60 mb-2">¿Probando la versión demo?</p>
          <button
            onClick={handleDemoFill}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-softYellow text-brand-brown text-xs font-bold border border-brand-yellow hover:bg-brand-yellow/60 transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-brown" />
            <span>Cargar datos demo (admin@demo.com)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
