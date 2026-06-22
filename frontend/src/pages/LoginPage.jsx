import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import logoImg from '../assets/logo_cgdelivery.png';
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
      const loggedUser = data.data.user;
      login(loggedUser, data.data.token);
      toast.success(`Bem-vindo, ${loggedUser.name}! 👋`);
      
      if (loggedUser.role === 'admin') {
        if (loggedUser.establishmentId) {
          navigate(`/store/${loggedUser.establishment?.slug || ''}`);
        } else {
          navigate('/admin');
        }
      } else if (loggedUser.role === 'waiter') {
        navigate('/waiter');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    try {
      const { data } = await authAPI.googleLogin(credentialResponse.credential);
      const loggedUser = data.data.user;
      login(loggedUser, data.data.token);
      toast.success(`Bem-vindo, ${loggedUser.name}! 👋`);
      
      if (loggedUser.role === 'admin') {
        if (loggedUser.establishmentId) {
          navigate(`/store/${loggedUser.establishment?.slug || ''}`);
        } else {
          navigate('/admin');
        }
      } else if (loggedUser.role === 'waiter') {
        navigate('/waiter');
      } else {
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao entrar com Google');
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
            <img src={logoImg} className="auth-logo-img" alt="CG Delivery logo" />
          </div>
          <span>CGDelivery</span>
        </div>

        <h1 className="auth-title">Entrar na conta</h1>
        <p className="auth-subtitle">Acesse para acompanhar seus pedidos</p>

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
            {loading ? 'Entrando...' : 'Entrar na conta'}
          </button>
        </form>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>OU</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
          </div>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => {
              toast.error('Ocorreu um erro ao conectar com o Google.');
            }}
            useOneTap
            theme="filled_black"
            shape="rectangular"
          />
        </div>

        <p className="auth-switch">
          Não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
