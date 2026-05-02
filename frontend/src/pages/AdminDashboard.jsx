import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Eye, EyeOff, Package, Settings, X, ClipboardList } from 'lucide-react';
import { productsAPI, categoriesAPI, establishmentsAPI, ordersAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState(user?.establishmentId ? 'pratos' : 'lojas'); // 'lojas', 'pratos' or 'ingredientes'
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEstModalOpen, setIsEstModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingEstablishment, setEditingEstablishment] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    categoryId: '',
    establishmentId: '',
    builderRole: 'none',
    modifierGroups: [],
    available: true,
    featured: false
  });
  const [imageFile, setImageFile] = useState(null);

  const [estFormData, setEstFormData] = useState({
    name: '',
    type: 'other',
    description: '',
    primaryColor: '#6C63FF',
    secondaryColor: '#FF6584',
    deliveryFee: 0,
    minOrder: 0,
    deliveryTime: 40,
    address: '',
    phone: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Acesso restrito para administradores');
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, establishmentsRes, ordersRes] = await Promise.all([
        productsAPI.list({ adminView: true }),
        categoriesAPI.list(),
        establishmentsAPI.list(),
        ordersAPI.list()
      ]);
      
      setProducts(productsRes.data.data);
      setCategories(categoriesRes.data.data);
      setEstablishments(establishmentsRes.data.data);
      setOrders(ordersRes.data.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setImageFile(null);
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        originalPrice: product.originalPrice || '',
        image: product.image || '',
        categoryId: product.categoryId,
        establishmentId: product.establishmentId,
        builderRole: product.builderRole || 'none',
        modifierGroups: product.modifierGroups || [],
        available: product.available,
        featured: product.featured || false
      });
    } else {
      setImageFile(null);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        image: '',
        categoryId: categories[0]?.id || '',
        establishmentId: user.establishmentId || establishments[0]?.id || '',
        builderRole: activeTab === 'pratos' ? 'none' : 'topping',
        modifierGroups: [],
        available: true,
        featured: false
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenEstModal = (est = null) => {
    if (est) {
      setEditingEstablishment(est);
      setEstFormData({
        name: est.name,
        type: est.type,
        description: est.description || '',
        primaryColor: est.primaryColor,
        secondaryColor: est.secondaryColor,
        deliveryFee: est.deliveryFee,
        minOrder: est.minOrder,
        deliveryTime: est.deliveryTime,
        address: est.address || '',
        phone: est.phone || ''
      });
    } else {
      setEditingEstablishment(null);
      setEstFormData({
        name: '',
        type: 'other',
        description: '',
        primaryColor: '#6C63FF',
        secondaryColor: '#FF6584',
        deliveryFee: 0,
        minOrder: 0,
        deliveryTime: 40,
        address: '',
        phone: ''
      });
    }
    setIsEstModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, key === 'modifierGroups' ? JSON.stringify(value || []) : value);
      });
      if (imageFile) payload.append('imageFile', imageFile);

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, payload);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await productsAPI.create(payload);
        toast.success('Produto criado com sucesso!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar produto');
    }
  };

  const handleEstSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEstablishment) {
        await establishmentsAPI.update(editingEstablishment.id, estFormData);
        toast.success('Loja atualizada!');
      } else {
        await establishmentsAPI.create(estFormData);
        toast.success('Loja criada com sucesso!');
      }
      setIsEstModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar loja');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto permanentemente?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Produto excluído!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const handleDeleteEst = async (id) => {
    if (!window.confirm('Deseja desativar esta loja permanentemente?')) return;
    try {
      await establishmentsAPI.delete(id);
      toast.success('Loja desativada!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir loja');
    }
  };

  const toggleAvailability = async (product) => {
    try {
      await productsAPI.update(product.id, { available: !product.available });
      toast.success(product.available ? 'Produto indisponível' : 'Produto disponível');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleOrderStatus = async (order, status) => {
    try {
      await ordersAPI.updateStatus(order.id, status);
      toast.success('Status do pedido atualizado');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar pedido');
    }
  };

  const filteredProducts = products.filter(p => {
    if (activeTab === 'pratos') return p.builderRole === 'none';
    if (activeTab === 'ingredientes') return p.builderRole !== 'none';
    return false;
  });

  if (loading && products.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <h1>Painel Administrativo</h1>
          <p className="text-muted">
            {user.establishmentId ? 'Gerencie seu restaurante' : 'Gestão Global do Sistema'}
          </p>
        </div>
        <div className="admin-actions">
          {activeTab === 'lojas' ? (
            <button className="btn-add" onClick={() => handleOpenEstModal()}>
              <Plus size={18} /> Nova Loja
            </button>
          ) : ['pratos', 'ingredientes'].includes(activeTab) ? (
            <button className="btn-add" onClick={() => handleOpenModal()}>
              <Plus size={18} /> Novo Item
            </button>
          ) : null}
        </div>
      </header>

      <div className="admin-tabs">
        {!user.establishmentId && (
          <button 
            className={`tab-btn ${activeTab === 'lojas' ? 'active' : ''}`}
            onClick={() => setActiveTab('lojas')}
          >
            <Settings size={16} /> Gerenciar Lojas
          </button>
        )}
        {user.establishmentId && (
          <button 
            className={`tab-btn ${activeTab === 'meu-restaurante' ? 'active' : ''}`}
            onClick={() => setActiveTab('meu-restaurante')}
          >
            <Settings size={16} /> Meu Restaurante
          </button>
        )}
        <button 
          className={`tab-btn ${activeTab === 'pratos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pratos')}
        >
          <Package size={16} /> Pratos Principais
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ingredientes' ? 'active' : ''}`}
          onClick={() => setActiveTab('ingredientes')}
        >
          <Plus size={16} /> Ingredientes & Toppings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pedidos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pedidos')}
        >
          <ClipboardList size={16} /> Pedidos
        </button>
      </div>

      <div className="products-grid">
        {activeTab === 'pedidos' && (
          <div className="admin-orders-list">
            {orders.length === 0 ? (
              <div className="empty-state">Nenhum pedido encontrado.</div>
            ) : orders.map(order => (
              <div key={order.id} className="admin-order-card">
                <div className="admin-order-main">
                  <div>
                    <h3>{order.orderNumber || order.id.slice(0, 8)}</h3>
                    <p>{order.establishment?.name} • {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                    <small>{order.deliveryAddress}</small>
                  </div>
                  <div className="admin-order-total">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                  </div>
                </div>
                <div className="admin-order-items">
                  {order.items?.map(item => (
                    <span key={item.id}>{item.quantity}x {item.product?.name}</span>
                  ))}
                </div>
                <div className="admin-order-actions">
                  {['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'].map(status => (
                    <button
                      key={status}
                      className={`order-status-btn ${order.status === status ? 'active' : ''}`}
                      onClick={() => handleOrderStatus(order, status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'meu-restaurante' && user.establishmentId && (
          <div className="admin-establishment-config">
            <div className="config-header">
              <h2>Configurações do Restaurante</h2>
              <p>Gerencie as informações públicas e regras da sua loja</p>
            </div>
            
            {establishments.filter(e => e.id === user.establishmentId).map(est => (
              <form key={est.id} onSubmit={(e) => {
                e.preventDefault();
                handleEstSubmit(e);
              }} className="admin-form-flat">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nome da Loja</label>
                    <input type="text" defaultValue={est.name} onChange={e => setEstFormData({...estFormData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Tipo de Cozinha</label>
                    <select defaultValue={est.type} onChange={e => setEstFormData({...estFormData, type: e.target.value})}>
                      <option value="acai">Açaí</option>
                      <option value="pizza">Pizza</option>
                      <option value="burger">Hambúrguer</option>
                      <option value="pasta">Massa</option>
                      <option value="other">Outros</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição curta</label>
                  <textarea defaultValue={est.description} rows="2" onChange={e => setEstFormData({...estFormData, description: e.target.value})} />
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label>Taxa de Entrega (R$)</label>
                    <input type="number" step="0.01" defaultValue={est.deliveryFee} onChange={e => setEstFormData({...estFormData, deliveryFee: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Pedido Mínimo (R$)</label>
                    <input type="number" step="0.01" defaultValue={est.minOrder} onChange={e => setEstFormData({...estFormData, minOrder: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Tempo Estimado (min)</label>
                    <input type="number" defaultValue={est.deliveryTime} onChange={e => setEstFormData({...estFormData, deliveryTime: e.target.value})} />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Cor Principal</label>
                    <div className="color-input-wrapper">
                      <input type="color" defaultValue={est.primaryColor} onChange={e => setEstFormData({...estFormData, primaryColor: e.target.value})} />
                      <span>{est.primaryColor}</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Cor Secundária</label>
                    <div className="color-input-wrapper">
                      <input type="color" defaultValue={est.secondaryColor} onChange={e => setEstFormData({...estFormData, secondaryColor: e.target.value})} />
                      <span>{est.secondaryColor}</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Endereço Completo</label>
                  <input type="text" defaultValue={est.address} onChange={e => setEstFormData({...estFormData, address: e.target.value})} />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit">Atualizar Dados do Restaurante</button>
                </div>
              </form>
            ))}
          </div>
        )}

        {activeTab === 'pedidos' ? null : activeTab === 'lojas' ? (
          establishments.map(est => (
            <div key={est.id} className={`admin-product-card ${!est.active ? 'unavailable' : ''}`}>
              <div className="admin-product-img" style={{ background: est.primaryColor, display: 'flex', alignItems: 'center', justifyItems: 'center', height: '120px', fontSize: '3rem' }}>
                <span style={{ margin: 'auto' }}>
                  {est.type === 'acai' ? '🍇' : est.type === 'pizza' ? '🍕' : '🍔'}
                </span>
              </div>
              <div className="admin-product-content">
                <div className="admin-product-info">
                  <h3>{est.name}</h3>
                  <p>{est.description}</p>
                  <small style={{ color: '#94A3B8' }}>{est.address}</small>
                </div>
                <div className="admin-product-actions">
                  <button className="action-btn btn-edit" onClick={() => handleOpenEstModal(est)} title="Editar Loja">
                    <Edit2 size={16} />
                  </button>
                  <button className="action-btn btn-delete" onClick={() => handleDeleteEst(est.id)} title="Desativar">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <div key={product.id} className={`admin-product-card ${!product.available ? 'unavailable' : ''}`}>
              <img src={product.image || 'https://via.placeholder.com/300x160?text=Sem+Imagem'} alt={product.name} className="admin-product-img" />
              <div className="admin-product-content">
                <div className="admin-product-info">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <div className="admin-product-meta">
                  <span className="admin-product-price">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                  </span>
                  <span className={`admin-product-status ${product.available ? 'status-available' : 'status-unavailable'}`}>
                    {product.available ? 'Disponível' : 'Esgotado'}
                  </span>
                </div>
                <div className="admin-product-actions">
                  <button className="action-btn btn-edit" onClick={() => handleOpenModal(product)} title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="action-btn btn-toggle" 
                    onClick={() => toggleAvailability(product)}
                    title={product.available ? "Marcar como indisponível" : "Marcar como disponível"}
                  >
                    {product.available ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button className="action-btn btn-delete" onClick={() => handleDelete(product.id)} title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>Nenhum item encontrado nesta categoria.</p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar Item' : 'Novo Item'}</h2>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Nome do Item</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select 
                    value={formData.categoryId} 
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Imagem do item</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setImageFile(e.target.files?.[0] || null)}
                />
                {formData.image && !imageFile && (
                  <small style={{ color: '#94A3B8' }}>Imagem atual: {formData.image}</small>
                )}
              </div>

              {!user.establishmentId && (
                <div className="form-group">
                  <label>Estabelecimento</label>
                  <select 
                    value={formData.establishmentId} 
                    onChange={e => setFormData({...formData, establishmentId: e.target.value})}
                    required
                  >
                    <option value="">Selecione...</option>
                    {establishments.map(est => (
                      <option key={est.id} value={est.id}>{est.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-submit">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Establishment Modal */}
      {isEstModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingEstablishment ? 'Editar Loja' : 'Nova Loja'}</h2>
              <button className="close-modal" onClick={() => setIsEstModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleEstSubmit} className="admin-form">
              <div className="form-group">
                <label>Nome da Loja</label>
                <input 
                  type="text" 
                  value={estFormData.name} 
                  onChange={e => setEstFormData({...estFormData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo</label>
                  <select value={estFormData.type} onChange={e => setEstFormData({...estFormData, type: e.target.value})}>
                    <option value="acai">Açaí</option>
                    <option value="pizza">Pizza</option>
                    <option value="burger">Hambúrguer</option>
                    <option value="pasta">Massa</option>
                    <option value="other">Outros</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cor Principal</label>
                  <input type="color" value={estFormData.primaryColor} onChange={e => setEstFormData({...estFormData, primaryColor: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea value={estFormData.description} onChange={e => setEstFormData({...estFormData, description: e.target.value})} rows="2" />
              </div>
              <div className="form-group">
                <label>Endereço</label>
                <input type="text" value={estFormData.address} onChange={e => setEstFormData({...estFormData, address: e.target.value})} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEstModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-submit">Salvar Loja</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
