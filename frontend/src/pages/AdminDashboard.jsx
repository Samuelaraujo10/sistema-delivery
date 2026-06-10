import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Settings, 
  X, 
  Search, 
  Star, 
  Clock, 
  DollarSign, 
  Store, 
  Sparkles, 
  Phone, 
  MapPin, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { establishmentsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [establishments, setEstablishments] = useState([]);
  
  // Barra de Pesquisa, Categoria e Ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Paginação
  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const [isEstModalOpen, setIsEstModalOpen] = useState(false);
  const [estLogoFile, setEstLogoFile] = useState(null);
  const [editingEstablishment, setEditingEstablishment] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [estFormData, setEstFormData] = useState({
    name: '',
    type: 'other',
    description: '',
    logo: '',
    deliveryFee: 0,
    minOrder: 0,
    deliveryTime: 40,
    address: '',
    phone: '',
    email: '',
    password: '',
    primaryColor: '#6C63FF',
    secondaryColor: '#FF6584',
    whatsapp: '',
    pixKey: '',
    hasBuilder: true,
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Acesso restrito para administradores');
      navigate('/');
      return;
    }
    if (user.establishmentId) {
      toast.error('Você não tem permissão de Administrador Geral');
      navigate(`/store/${user.establishment?.slug || ''}`);
      return;
    }
    fetchEstablishments();
  }, [user, navigate]);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      const res = await establishmentsAPI.list();
      setEstablishments(res.data.data);
    } catch (error) {
      toast.error('Erro ao carregar estabelecimentos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEstModal = (est = null) => {
    setEstLogoFile(null);
    if (est) {
      setEditingEstablishment(est);
      setEstFormData({
        name: est.name || '',
        type: est.type || 'other',
        description: est.description || '',
        logo: est.logo || '',
        deliveryFee: est.deliveryFee || 0,
        minOrder: est.minOrder || 0,
        deliveryTime: est.deliveryTime || 40,
        address: est.address || '',
        phone: est.phone || '',
        email: '',
        password: '',
        primaryColor: est.primaryColor || '#6C63FF',
        secondaryColor: est.secondaryColor || '#FF6584',
        whatsapp: est.whatsapp || '',
        pixKey: est.pixKey || '',
        hasBuilder: est.hasBuilder ?? true,
      });
    } else {
      setEditingEstablishment(null);
      setEstFormData({
        name: '',
        type: 'other',
        description: '',
        logo: '',
        deliveryFee: 0,
        minOrder: 0,
        deliveryTime: 40,
        address: '',
        phone: '',
        email: '',
        password: '',
        primaryColor: '#6C63FF',
        secondaryColor: '#FF6584',
        whatsapp: '',
        pixKey: '',
        hasBuilder: true,
      });
    }
    setIsEstModalOpen(true);
  };

  const handleEstSubmit = async (e) => {
    e.preventDefault();
    if (!editingEstablishment && (!estFormData.email || !estFormData.password)) {
      toast.error('Email e senha de login são obrigatórios para novas lojas');
      return;
    }
    setIsSaving(true);
    try {
      const payload = new FormData();
      Object.entries(estFormData).forEach(([k, v]) => {
        if (editingEstablishment && (k === 'email' || k === 'password') && !v) {
          return;
        }
        payload.append(k, v);
      });
      if (estLogoFile) payload.append('logoFile', estLogoFile);
      
      if (editingEstablishment) {
        await establishmentsAPI.update(editingEstablishment.id, payload);
        toast.success('Loja atualizada com sucesso!');
      } else {
        await establishmentsAPI.create(payload);
        toast.success('Loja criada com sucesso!');
      }
      setIsEstModalOpen(false);
      fetchEstablishments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar loja');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEst = async (id) => {
    if (!window.confirm('Deseja desativar esta loja permanentemente?')) return;
    try {
      await establishmentsAPI.delete(id);
      toast.success('Loja desativada');
      fetchEstablishments();
    } catch (error) {
      toast.error('Erro ao excluir loja');
    }
  };

  // Cálculo de Métricas (Stats Panel)
  const totalStores = establishments.length;
  const openStores = establishments.filter(est => est.isOpen).length;
  const activeBuilders = establishments.filter(est => est.hasBuilder).length;
  const averageRating = establishments.length 
    ? (establishments.reduce((acc, est) => acc + parseFloat(est.rating || 4.5), 0) / establishments.length).toFixed(1)
    : '0.0';

  // Filtros de Categoria (E-mojis)
  const filterTypes = [
    { value: 'all', label: 'Todos', emoji: '🔍' },
    { value: 'burger', label: 'Hambúrgueres', emoji: '🍔' },
    { value: 'pizza', label: 'Pizzas', emoji: '🍕' },
    { value: 'acai', label: 'Açaí', emoji: '🍇' },
    { value: 'sushi', label: 'Sushi', emoji: '🍱' },
    { value: 'pasta', label: 'Massas', emoji: '🍝' },
    { value: 'mexican', label: 'Mexicano', emoji: '🌮' },
    { value: 'chinese', label: 'Chinês', emoji: '🥡' },
    { value: 'bakery', label: 'Padaria', emoji: '🍞' },
    { value: 'other', label: 'Outros', emoji: '🍽️' },
  ];

  // Mapeamentos de Emojis/Nomes das categorias
  const typeEmoji = {
    acai: '🍇',
    pizza: '🍕',
    burger: '🍔',
    sushi: '🍱',
    pasta: '🍝',
    mexican: '🌮',
    chinese: '🥡',
    bakery: '🍞',
    other: '🍽️'
  };

  const typeName = {
    acai: 'Açaí',
    pizza: 'Pizza',
    burger: 'Hambúrguer',
    sushi: 'Sushi',
    pasta: 'Massas',
    mexican: 'Mexicano',
    chinese: 'Chinês',
    bakery: 'Padaria',
    other: 'Outros'
  };

  // Filtragem e Ordenação
  const filteredEstablishments = establishments
    .filter(est => {
      const matchesSearch = est.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (est.description && est.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (est.address && est.address.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = selectedType === 'all' || est.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'rating') {
        return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
      } else if (sortBy === 'fee') {
        return parseFloat(a.deliveryFee || 0) - parseFloat(b.deliveryFee || 0);
      } else if (sortBy === 'time') {
        return (a.deliveryTime || 0) - (b.deliveryTime || 0);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredEstablishments.length / itemsPerPage);

  // Garante que a página atual seja válida caso o filtro reduza os resultados
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredEstablishments.length, totalPages, currentPage]);

  const paginatedEstablishments = filteredEstablishments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loader" />
          <p>Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard fade-in">
      <header className="admin-header">
        <div className="header-info">
          <div className="badge badge-primary">
            <ShieldCheck size={14} /> Painel Geral
          </div>
          <h1>Gestão de Estabelecimentos</h1>
          <p className="text-muted">Controle e parametrização das lojas da plataforma</p>
        </div>
        <div className="admin-actions">
          <button className="btn btn-primary" onClick={() => handleOpenEstModal()}>
            <Plus size={18} /> Nova Loja
          </button>
        </div>
      </header>

      {/* Grid de Estatísticas / Métricas */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon-wrapper">
            <Store size={22} className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total de Lojas</span>
            <h2 className="stat-value">{totalStores}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper open">
            <Clock size={22} className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Abertas Agora</span>
            <h2 className="stat-value">{openStores}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper builder">
            <Sparkles size={22} className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Montadores Ativos</span>
            <h2 className="stat-value">{activeBuilders}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon-wrapper rating">
            <Star size={22} className="stat-icon" />
          </div>
          <div className="stat-content">
            <span className="stat-label">Média de Avaliações</span>
            <h2 className="stat-value">{averageRating} ⭐</h2>
          </div>
        </div>
      </section>

      {/* Seção de Busca, Filtros e Ordenação */}
      <section className="admin-controls-bar">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Pesquise por nome, descrição ou endereço..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="sort-box">
          <span className="sort-label">Ordenar por:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Nome (A-Z)</option>
            <option value="rating">Melhor Avaliado</option>
            <option value="fee">Menor Taxa de Entrega</option>
            <option value="time">Menor Tempo de Entrega</option>
          </select>
        </div>
      </section>

      {/* Pílulas de filtro por tipo de Culinária */}
      <div className="filter-pills-wrapper">
        <div className="admin-filter-pills">
          {filterTypes.map(type => (
            <button
              key={type.value}
              className={`filter-pill ${selectedType === type.value ? 'active' : ''}`}
              onClick={() => setSelectedType(type.value)}
            >
              <span className="filter-emoji">{type.emoji}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Estabelecimentos */}
      <div className="establishments-grid">
        {paginatedEstablishments.map(est => {
          const primaryColor = est.primaryColor || '#6C63FF';
          const secondaryColor = est.secondaryColor || '#FF6584';

          return (
            <div key={est.id} className="admin-est-card fade-in">
              {/* Cover Banner with Brand Colors */}
              <div 
                className="admin-est-cover"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}dd 0%, ${secondaryColor}cc 100%)`
                }}
              >
                <div className="admin-est-cover-overlay" />
                {/* Status Badge */}
                <span className={`admin-est-status-badge ${est.isOpen ? 'open' : 'closed'}`}>
                  <span className="status-dot" />
                  {est.isOpen ? 'Aberto' : 'Fechado'}
                </span>
                
                {/* Builder Tag */}
                {est.hasBuilder && (
                  <span className="admin-est-builder-badge" title="Possui montador de pratos ativo">
                    <Sparkles size={11} /> Montador Ativo
                  </span>
                )}
              </div>

              <div className="admin-est-card-body">
                {/* Logo and Type */}
                <div className="admin-est-logo-row">
                  <div className="admin-est-logo-badge" style={{ borderColor: primaryColor }}>
                    {est.logo ? (
                      <img src={est.logo} alt={est.name} className="admin-est-logo-img" />
                    ) : (
                      <span className="admin-est-logo-placeholder">{typeEmoji[est.type] || '🍽️'}</span>
                    )}
                  </div>
                  <span className="admin-est-type-tag">
                    {typeEmoji[est.type] || '🍽️'} {typeName[est.type] || 'Outros'}
                  </span>
                </div>

                {/* Info */}
                <h3 className="admin-est-name">{est.name}</h3>
                <p className="admin-est-desc" title={est.description}>
                  {est.description || 'Sem descrição cadastrada.'}
                </p>

                {est.address && (
                  <div className="admin-est-address" title={est.address}>
                    <MapPin size={12} />
                    <span>{est.address}</span>
                  </div>
                )}

                {/* Meta Row */}
                <div className="admin-est-meta-row">
                  <span className="admin-est-meta-item">
                    <Star size={12} className="star-icon" />
                    <span>{parseFloat(est.rating || 4.5).toFixed(1)}</span>
                  </span>
                  <span className="admin-est-meta-item">
                    <Clock size={12} />
                    <span>{est.deliveryTime || 40} min</span>
                  </span>
                  <span className="admin-est-meta-item">
                    <DollarSign size={12} />
                    <span>{parseFloat(est.deliveryFee) === 0 ? 'Grátis' : `R$ ${parseFloat(est.deliveryFee).toFixed(2)}`}</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="admin-est-actions">
                  <button 
                    className="admin-est-btn admin-est-btn-edit" 
                    onClick={() => handleOpenEstModal(est)} 
                    title="Editar Informações"
                  >
                    <Edit2 size={14} />
                    <span>Editar</span>
                  </button>
                  <button 
                    className="admin-est-btn admin-est-btn-visit" 
                    onClick={() => navigate(`/store/${est.slug}`)} 
                    title="Gerenciar Cardápio & Pedidos"
                  >
                    <ExternalLink size={14} />
                    <span>Painel</span>
                  </button>
                  <button 
                    className="admin-est-btn admin-est-btn-delete" 
                    onClick={() => handleDeleteEst(est.id)} 
                    title="Excluir Estabelecimento"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredEstablishments.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-icon">🍽️</div>
            <h3>Nenhum estabelecimento encontrado</h3>
            <p>Tente alterar os termos da pesquisa ou o filtro de categoria.</p>
          </div>
        )}
      </div>
      
      {/* Paginação */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
            Anterior
          </button>
          <span className="page-indicator">{currentPage} de {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
            Próxima
          </button>
        </div>
      )}

      {/* Establishment Modal */}
      {isEstModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{editingEstablishment ? 'Editar Loja' : 'Cadastrar Nova Loja'}</h2>
              <button className="close-modal" onClick={() => setIsEstModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleEstSubmit} className="admin-form">
              <div className="form-section-title">Dados Gerais</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome da Loja</label>
                  <input 
                    type="text" 
                    value={estFormData.name} 
                    onChange={e => setEstFormData({ ...estFormData, name: e.target.value })} 
                    required 
                    placeholder="Ex: Pizzaria Bella Italia"
                  />
                </div>
                <div className="form-group">
                  <label>Categoria Principal</label>
                  <select 
                    value={estFormData.type} 
                    onChange={e => setEstFormData({ ...estFormData, type: e.target.value })}
                  >
                    <option value="burger">🍔 Hambúrguer</option>
                    <option value="pizza">🍕 Pizza</option>
                    <option value="acai">🍇 Açaí</option>
                    <option value="sushi">🍱 Sushi</option>
                    <option value="pasta">🍝 Massas</option>
                    <option value="mexican">🌮 Mexicano</option>
                    <option value="chinese">🥡 Chinês</option>
                    <option value="bakery">🍞 Padaria</option>
                    <option value="other">🍽️ Outros</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea 
                  value={estFormData.description} 
                  onChange={e => setEstFormData({ ...estFormData, description: e.target.value })} 
                  rows={2} 
                  placeholder="Escreva uma breve descrição sobre a culinária da loja..."
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Endereço Completo</label>
                  <input 
                    type="text" 
                    value={estFormData.address} 
                    onChange={e => setEstFormData({ ...estFormData, address: e.target.value })} 
                    placeholder="Ex: Av. Paulista, 1000 - São Paulo"
                  />
                </div>
                <div className="form-group">
                  <label>Telefone Comercial</label>
                  <input 
                    type="text" 
                    value={estFormData.phone} 
                    onChange={e => setEstFormData({ ...estFormData, phone: e.target.value })} 
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
              </div>

              <div className="form-section-title">Logística & Finanças</div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Taxa de Entrega (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={estFormData.deliveryFee} 
                    onChange={e => setEstFormData({ ...estFormData, deliveryFee: parseFloat(e.target.value) || 0 })} 
                  />
                </div>
                <div className="form-group">
                  <label>Pedido Mínimo (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={estFormData.minOrder} 
                    onChange={e => setEstFormData({ ...estFormData, minOrder: parseFloat(e.target.value) || 0 })} 
                  />
                </div>
                <div className="form-group">
                  <label>Tempo Estimado (min)</label>
                  <input 
                    type="number" 
                    value={estFormData.deliveryTime} 
                    onChange={e => setEstFormData({ ...estFormData, deliveryTime: parseInt(e.target.value) || 40 })} 
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>WhatsApp para Notificações</label>
                  <input 
                    type="text" 
                    value={estFormData.whatsapp} 
                    onChange={e => setEstFormData({ ...estFormData, whatsapp: e.target.value })} 
                    placeholder="Ex: 5511999999999"
                  />
                </div>
                <div className="form-group">
                  <label>Chave Pix para Recebimento</label>
                  <input 
                    type="text" 
                    value={estFormData.pixKey} 
                    onChange={e => setEstFormData({ ...estFormData, pixKey: e.target.value })} 
                    placeholder="CNPJ, E-mail, Celular ou Chave Aleatória"
                  />
                </div>
              </div>

              <div className="form-section-title">Design & Identidade Visual</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Logo do Estabelecimento</label>
                  <div className="logo-upload-wrapper">
                    <input 
                      type="file" 
                      id="modal-logo-file"
                      accept="image/*" 
                      onChange={e => setEstLogoFile(e.target.files?.[0] || null)} 
                      className="input-file"
                    />
                    <label htmlFor="modal-logo-file" className="btn btn-ghost btn-sm">
                      Escolher arquivo
                    </label>
                    <span className="logo-file-name">
                      {estLogoFile ? estLogoFile.name : (estFormData.logo ? 'Logo já cadastrado' : 'Nenhum arquivo selecionado')}
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ justifyContent: 'center' }}>
                  <label className="toggle-switch-label">
                    <input 
                      type="checkbox" 
                      checked={estFormData.hasBuilder} 
                      onChange={e => setEstFormData({ ...estFormData, hasBuilder: e.target.checked })} 
                    />
                    <span className="toggle-slider" />
                    <span>Habilitar Montador de Pratos</span>
                  </label>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Cor Primária da Marca</label>
                  <div className="color-input-wrapper">
                    <input 
                      type="color" 
                      value={estFormData.primaryColor} 
                      onChange={e => setEstFormData({ ...estFormData, primaryColor: e.target.value })} 
                    />
                    <span>{estFormData.primaryColor}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Cor Secundária da Marca</label>
                  <div className="color-input-wrapper">
                    <input 
                      type="color" 
                      value={estFormData.secondaryColor} 
                      onChange={e => setEstFormData({ ...estFormData, secondaryColor: e.target.value })} 
                    />
                    <span>{estFormData.secondaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="form-section-title">Credenciais de Acesso</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>E-mail de Login {editingEstablishment && '(Não editável)'}</label>
                  <input 
                    type="email" 
                    value={estFormData.email} 
                    onChange={e => setEstFormData({ ...estFormData, email: e.target.value })} 
                    required={!editingEstablishment} 
                    disabled={!!editingEstablishment}
                    placeholder="admin@sualoja.com"
                  />
                </div>
                <div className="form-group">
                  <label>Senha {editingEstablishment && '(Preencha apenas para alterar)'}</label>
                  <input 
                    type="password" 
                    value={estFormData.password} 
                    onChange={e => setEstFormData({ ...estFormData, password: e.target.value })} 
                    required={!editingEstablishment} 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsEstModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-save" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Loja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

