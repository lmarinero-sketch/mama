import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { PublicCatalogPage } from './pages/PublicCatalogPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminVisualEditorPage } from './pages/AdminVisualEditorPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { AdminCustomersPage } from './pages/AdminCustomersPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminStockPage } from './pages/AdminStockPage';
import { AdminRankingsPage } from './pages/AdminRankingsPage';
import { AdminManualPage } from './pages/AdminManualPage';
import { LucasChat } from './components/admin/LucasChat';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const { isAuthenticated } = useApp();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <Routes>
        {/* Public Client Mobile Catalog */}
        <Route path="/" element={<PublicCatalogPage />} />

        {/* Admin Mobile Auth */}
        <Route path="/login" element={<AdminLoginPage />} />

        {/* Admin Private Area (Protected) */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboardPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedAdminRoute>
              <AdminOrdersPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/stock"
          element={
            <ProtectedAdminRoute>
              <AdminStockPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/editor"
          element={
            <ProtectedAdminRoute>
              <AdminVisualEditorPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/productos"
          element={
            <ProtectedAdminRoute>
              <AdminProductsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/clientes"
          element={
            <ProtectedAdminRoute>
              <AdminCustomersPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/rankings"
          element={
            <ProtectedAdminRoute>
              <AdminRankingsPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/manual"
          element={
            <ProtectedAdminRoute>
              <AdminManualPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/admin/ayuda" element={<Navigate to="/admin/manual" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Copiloto Inteligente Lucas disponible en todo el panel de administración */}
      {isAdminRoute && isAuthenticated && <LucasChat />}
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
}
