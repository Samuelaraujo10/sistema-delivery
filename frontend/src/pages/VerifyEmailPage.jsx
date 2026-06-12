import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import './AuthPage.css';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Verificando seu e-mail...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link de verificação inválido ou ausente.');
      return;
    }

    const verify = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'E-mail verificado com sucesso!');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Token de ativação inválido ou já utilizado.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <div className="auth-card scale-in" style={{ textAlign: 'center', padding: '40px 20px' }}>
        {status === 'loading' && (
          <>
            <Loader2 size={64} className="spin" style={{ color: '#ff4757', margin: '0 auto 20px' }} />
            <h2 className="auth-title">Aguarde...</h2>
            <p className="auth-subtitle">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={64} style={{ color: '#2ed573', margin: '0 auto 20px' }} />
            <h2 className="auth-title">Tudo certo!</h2>
            <p className="auth-subtitle">{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '20px' }}>
              Ir para o Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={64} style={{ color: '#ff4757', margin: '0 auto 20px' }} />
            <h2 className="auth-title">Ops!</h2>
            <p className="auth-subtitle">{message}</p>
            <Link to="/login" className="btn btn-outline" style={{ display: 'inline-block', marginTop: '20px' }}>
              Voltar para o Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
