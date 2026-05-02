import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import './AuthPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.data.user, data.data.token);
      toast.success(`Bem-vindo, ${data.data.user.name}! 👋`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-card scale-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Zap size={22} fill="currentColor" />
          </div>
          <span>DeliveryApp</span>
        </div>

        <h1 className="auth-title">Entrar na conta</h1>
        <p className="auth-subtitle">Acesse para acompanhar seus pedidos</p>

        <div className="auth-demo-hint">
          <strong>Demo:</strong> admin@delivery.com / 123456
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="input"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div className="input-with-icon">
              <input
                type={showPass ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth-switch">
          Não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
