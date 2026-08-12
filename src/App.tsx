import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { PublicCatalogPage } from './pages/PublicCatalogPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminVisualEditorPage } from './pages/AdminVisualEditorPage';
import { AdminProductsPage } from './pages/AdminProductsPage';
import { AdminCustomersPage } from './pages/AdminCustomersPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminStockPage } from './pages/AdminStockPage';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
