import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Key, Save, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  // Personal info state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Address state
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [reference, setReference] = useState('');
  const [cep, setCep] = useState('');
  const [uf, setUf] = useState('');

  const [loading, setLoading] = useState(false);

  const fetchAddressByCep = async (cepValue) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          if (data.logradouro) setStreet(data.logradouro);
          if (data.bairro) setNeighborhood(data.bairro);
          if (data.localidade) setCity(data.localidade);
          if (data.uf) setUf(data.uf);
          toast.success('Endereço encontrado pelo CEP!');
        } else {
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        toast.error('Erro ao buscar o CEP');
      }
    }
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    let formattedCep = value;
    if (value.length > 5) {
      formattedCep = value.slice(0, 5) + '-' + value.slice(5);
    }
    setCep(formattedCep);
    
    if (value.length === 8) {
      fetchAddressByCep(value);
    }
  };

  useEffect(() => {
    if (!user) {
      toast.error('Faça login para acessar esta página');
      navigate('/login');
      return;
    }
    // Lojista (owner) should not access My Data; redirect to establishment settings
    if (user.establishmentId) {
      navigate('/admin');
      return;
    }

    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');

    if (user.address) {
      try {
        const addr = typeof user.address === 'string' ? JSON.parse(user.address) : user.address;
        if (addr) {
          setStreet(addr.street || '');
          setNumber(addr.number || '');
          setNeighborhood(addr.neighborhood || '');
          setComplement(addr.complement || '');
          setCity(addr.city || '');
          setReference(addr.reference || '');
          setCep(addr.cep || '');
          setUf(addr.uf || '');
        }
      } catch (e) {
        setStreet(user.address);
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('O nome completo é obrigatório');
      return;
    }
    if (!email.trim()) {
      toast.error('O e-mail é obrigatório');
      return;
    }
    if (!phone.trim()) {
      toast.error('O número de WhatsApp é obrigatório');
      return;
    }

    if (password) {
      if (password.length < 6) {
        toast.error('A nova senha deve conter pelo menos 6 caracteres');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('As senhas digitadas não coincidem');
        return;
      }
    }

    setLoading(true);
    try {
      const addressObj = {
        street: street.trim(),
        number: number.trim(),
        neighborhood: neighborhood.trim(),
        complement: complement.trim(),
        city: city.trim(),
        state: uf.trim(),
        cep: cep.trim(),
        reference: reference.trim()
      };

      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: JSON.stringify(addressObj)
      };

      if (password) {
        payload.password = password;
      }

      const { data } = await authAPI.updateProfile(payload);
      updateUser(data.data);
      
      toast.success('Cadastro atualizado com sucesso! 🎉');
      
      // Clear password fields
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      // toast is automatically displayed by interceptor on error, 
      // but we catch to stop loading state correctly
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page container profile-page fade-in">
      <div className="profile-header">
        <button onClick={() => navigate(-1)} className="back-link-btn">
          <ArrowLeft size={16} /> Voltar
        </button>
        <h1 className="profile-title">Meus Dados</h1>
        <p className="profile-subtitle">Gerencie suas informações pessoais, endereço e segurança da conta</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-grid-layout">
        {/* Left Column: Personal info & Security */}
        <div className="profile-col-left">
          {/* Card: Personal Details */}
          <div className="profile-card">
            <h2 className="card-section-title">
              <User size={18} /> Dados Pessoais
            </h2>
            <div className="card-section-body">
              <div className="form-group">
                <label className="form-label">Nome completo *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail *</label>
                <input
                  type="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp (Celular) *</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Card: Change Password */}
          <div className="profile-card">
            <h2 className="card-section-title">
              <Key size={18} /> Alterar Senha (Opcional)
            </h2>
            <div className="card-section-body">
              <div className="form-group">
                <label className="form-label">Nova senha</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Deixe em branco para manter a atual"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar nova senha</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Default Address */}
        <div className="profile-col-right">
          <div className="profile-card">
            <h2 className="card-section-title">
              <MapPin size={18} /> Endereço Padrão de Entrega
            </h2>
            <div className="card-section-body address-grid">
              <div className="col-3">
                <label className="form-label">CEP</label>
                <input
                  type="text"
                  className="input"
                  placeholder="00000-000"
                  value={cep}
                  onChange={handleCepChange}
                />
              </div>
              <div className="col-1">
                <label className="form-label">UF</label>
                <input
                  type="text"
                  className="input"
                  placeholder="UF"
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                />
              </div>
              <div className="col-3">
                <label className="form-label">Rua / Avenida</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nome da rua"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div className="col-1">
                <label className="form-label">Nº</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Número"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </div>
              <div className="col-2">
                <label className="form-label">Bairro</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Bairro"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </div>
              <div className="col-2">
                <label className="form-label">Complemento</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Apto, Bloco, etc."
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                />
              </div>
              <div className="col-2">
                <label className="form-label">Cidade</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="col-2">
                <label className="form-label">Ponto de referência</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ponto de referência"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg save-profile-btn"
            disabled={loading}
          >
            <Save size={18} />
            {loading ? 'Salvando dados...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
