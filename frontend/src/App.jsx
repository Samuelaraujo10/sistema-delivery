import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';

import Home from './pages/Home';

// Lazy loading pages
const StorePage = React.lazy(() => import('./pages/StorePage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const OrderTrackingPage = React.lazy(() => import('./pages/OrderTrackingPage'));
const PastaBuilder = React.lazy(() => import('./pages/PastaBuilder'));
const AcaiBuilder = React.lazy(() => import('./pages/AcaiBuilder'));
const PizzaBuilder = React.lazy(() => import('./pages/PizzaBuilder'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
import { useAuthStore } from './store/authStore';
import { authAPI } from './services/api';

export default function App() {
  const { token, updateUser } = useAuthStore();

  useEffect(() => {
    const syncUser = async () => {
      if (token) {
        try {
          const { data } = await authAPI.me();
          updateUser(data.data);
        } catch (err) {
          console.error('Erro ao sincronizar dados do usuário:', err);
        }
      }
    };
    syncUser();
  }, [token, updateUser]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A24',
            color: '#F0F0F5',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '0.875rem',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#00C853', secondary: '#1A1A24' },
          },
          error: {
            iconTheme: { primary: '#FF4444', secondary: '#1A1A24' },
          },
        }}
      />
      <Navbar />
      <Suspense fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text)' }}>
          Carregando...
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/store/:slug" element={<StorePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/order/:id" element={<OrderTrackingPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/builder/pasta/:slug" element={<PastaBuilder />} />
          <Route path="/builder/acai/:slug" element={<AcaiBuilder />} />
          <Route path="/builder/pizza/:slug" element={<PizzaBuilder />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
      <BottomNav />
    </BrowserRouter>
  );
}
