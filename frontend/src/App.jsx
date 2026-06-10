import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import StorePage from './pages/StorePage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import PastaBuilder from './pages/PastaBuilder';
import AcaiBuilder from './pages/AcaiBuilder';
import PizzaBuilder from './pages/PizzaBuilder';
import AdminDashboard from './pages/AdminDashboard';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/store/:slug" element={<StorePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/order/:id" element={<OrderTrackingPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/builder/pasta/:slug" element={<PastaBuilder />} />
        <Route path="/builder/acai/:slug" element={<AcaiBuilder />} />
        <Route path="/builder/pizza/:slug" element={<PizzaBuilder />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
