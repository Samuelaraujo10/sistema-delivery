import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Bike, MapPin, Phone, ChevronDown, Settings, Plus, Edit3, Eye, EyeOff } from 'lucide-react';
import { establishmentsAPI, productsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import Skeleton from '../components/Skeleton';
import ProductSkeleton from '../components/ProductSkeleton';
import './StorePage.css';

const TYPE_EMOJIS = { acai: '🍇', pizza: '🍕', burger: '🍔', sushi: '🍱', pasta: '🍝', other: '🍽️' };

import ProductFormModal from '../components/ProductFormModal';
import { toast } from 'react-hot-toast';

export default function StorePage() {
  const { slug } = useParams();
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminView, setAdminView] = useState('store'); // 'store' or 'management'
  
  // Admin Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Auth check
  const userStr = localStorage.getItem('delivery_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchStoreData = async (refresh = false) => {
    if (!refresh) setLoading(true);
    try {
      const { data } = await establishmentsAPI.getBySlug(slug, { adminView: true });
      setEstablishment(data.data);
      if (data.data?.categories?.length > 0 && !activeCategory) {
        setActiveCategory(data.data.categories[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!refresh) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [slug]);

  const isOwner = user?.role === 'admin' && (user.establishmentId === establishment?.id || !user.establishmentId);

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Excluir este produto permanentemente?')) return;
    try {
      await productsAPI.delete(id);
      toast.success('Produto excluído');
      fetchStoreData(true);
    } catch (err) {
      toast.error('Erro ao excluir');
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await productsAPI.update(product.id, { available: !product.available });
      toast.success(product.available ? 'Indisponível' : 'Disponível');
      fetchStoreData(true);
    } catch (err) {
      toast.error('Erro ao atualizar');
    }
  };

  if (loading) {
    return (
      <div className="store-loading">
        <Skeleton height="280px" borderRadius="0" />
        <div className="container" style={{ paddingTop: 30, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height="48px" width="40%" />
          <Skeleton height="24px" width="60%" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 40 }}>
            {[1,2,3,4,5,6].map(i => <ProductSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="store-not-found">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Estabelecimento não encontrado</h3>
          <Link to="/" className="btn btn-primary">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const { id, name, type, description, rating, deliveryTime, deliveryFee, minOrder, address, phone, isOpen, categories, primaryColor, secondaryColor } = establishment;
  
  // Show all categories for admin, but filter for customers
  const displayCategories = isOwner 
    ? categories 
    : categories?.filter(c => c.products?.length > 0) || [];
    
  const activecat = displayCategories.find(c => c.id === activeCategory);

  return (
    <div className={`store-page ${adminView === 'management' ? 'admin-layout-active' : ''}`}>
      {/* Admin Control Bar */}
      {isOwner && (
        <div className="admin-control-bar">
          <div className="container admin-bar-content">
            <div className="admin-nav">
              <button 
                className={`admin-nav-btn ${adminView === 'store' ? 'active' : ''}`}
                onClick={() => setAdminView('store')}
              >
                <Eye size={18} /> Ver Loja
              </button>
              <button 
                className={`admin-nav-btn ${adminView === 'management' ? 'active' : ''}`}
                onClick={() => setAdminView('management')}
              >
                <Settings size={18} /> Painel de Gestão
              </button>
            </div>
            <div className="admin-actions-group">
              <button 
                className="admin-quick-add"
                onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
              >
                <Plus size={16} /> Novo Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {adminView === 'store' ? (
        <>
          {/* Cover */}
          <div
            className="store-cover"
            style={{ background: `linear-gradient(135deg, ${primaryColor}30 0%, ${secondaryColor}20 100%)` }}
          >
            <div className="store-cover-glow" style={{ background: `radial-gradient(circle at 60% 50%, ${primaryColor}30, transparent 60%)` }} />
            <div className="store-emoji">{TYPE_EMOJIS[type] || '🍽️'}</div>
            <Link to="/" className="back-btn">
              <ArrowLeft size={18} /> Voltar
            </Link>
          </div>

          {/* Info */}
          <div className="container">
            <div className="store-header">
              <div className="store-info">
                <div className="store-title-row">
                  <h1 className="store-name">{name}</h1>
                  <span className={`store-status ${isOpen ? 'open' : 'closed'}`}>
                    {isOpen ? '● Aberto' : '● Fechado'}
                  </span>
                </div>
                <p className="store-desc">{description}</p>

                <div className="store-meta">
                  <span className="meta-item">
                    <Star size={15} fill="#FFB800" color="#FFB800" />
                    {rating || '4.5'}
                  </span>
                  <span className="meta-divider">·</span>
                  <span className="meta-item">
                    <Clock size={14} />
                    {deliveryTime} min
                  </span>
                  <span className="meta-divider">·</span>
                  <span className="meta-item">
                    <Bike size={14} />
                    {parseFloat(deliveryFee) === 0 ? 'Entrega grátis' : `R$ ${parseFloat(deliveryFee).toFixed(2)}`}
                  </span>
                  <span className="meta-divider">·</span>
                  <span className="meta-item">
                    Min. R$ {parseFloat(minOrder).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Builder Promo */}
            {(type === 'pasta' || type === 'acai' || type === 'pizza') && (
              <div className="builder-promo">
                <div className="builder-promo-content">
                  <div className="builder-promo-text">
                    <h3>
                      <span className="emoji-highlight">
                        {type === 'pasta' ? '🍝' : type === 'acai' ? '🍇' : '🍕'}
                      </span> 
                      {type === 'pasta' ? 'Monte sua Massa' : type === 'acai' ? 'Monte seu Açaí' : 'Monte sua Pizza'}
                    </h3>
                    <p>Personalize do seu jeito com seus ingredientes favoritos!</p>
                  </div>
                  <Link to={`/builder/${type}/${slug}`} className="btn btn-primary">Começar agora</Link>
                </div>
              </div>
            )}

            {/* Category tabs */}
            <div className="cat-tabs-wrapper">
              <div className="cat-tabs">
                {displayCategories.map(cat => (
                  <button
                    key={cat.id}
                    className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
                    style={activeCategory === cat.id ? { borderColor: primaryColor, color: primaryColor, background: `${primaryColor}15` } : {}}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.icon} {cat.name}
                    <span className="cat-count">{cat.products?.length || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Products */}
            {activecat && (
              <div className="products-section fade-in" key={activecat.id}>
                <div className="products-grid">
                  {activecat.products?.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      establishment={establishment}
                      isAdminMode={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Exclusive Management View */
        <div className="container admin-management-view">
          <div className="admin-view-header">
            <h2>Gerenciamento de Cardápio</h2>
            <p>Gerencie categorias, pratos e disponibilidades da loja <strong>{name}</strong></p>
          </div>

          <div className="admin-management-content">
            <aside className="admin-sidebar">
              <div className="sidebar-group">
                <label>Categorias</label>
                <div className="sidebar-items">
                  {categories.map(cat => (
                    <button 
                      key={cat.id} 
                      className={`sidebar-item ${activeCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                  <button className="sidebar-item add-cat-btn">
                    <Plus size={14} /> Nova Categoria
                  </button>
                </div>
              </div>
            </aside>

            <main className="admin-main-list">
              <div className="admin-list-header">
                <h3>{activecat?.name || 'Selecione uma categoria'}</h3>
                <span className="admin-item-count">{activecat?.products?.length || 0} produtos</span>
              </div>

              <div className="admin-products-list">
                {activecat?.products?.map(product => (
                  <div key={product.id} className={`admin-list-item ${!product.available ? 'out-of-stock' : ''}`}>
                    <div className="item-main-info">
                      <div className="item-img-placeholder">
                        {type === 'acai' ? '🍇' : type === 'pizza' ? '🍕' : '🍔'}
                      </div>
                      <div className="item-text">
                        <h4>{product.name}</h4>
                        <p>{product.description}</p>
                        <span className="item-price">R$ {parseFloat(product.price).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="item-actions">
                      <button 
                        className={`item-status-btn ${product.available ? 'available' : 'unavailable'}`}
                        onClick={() => handleToggleAvailability(product)}
                      >
                        {product.available ? <Eye size={16} /> : <EyeOff size={16} />}
                        {product.available ? 'Disponível' : 'Em Falta'}
                      </button>
                      <button className="item-edit-btn" onClick={() => handleEditProduct(product)}>
                        <Edit3 size={16} /> Editar
                      </button>
                      <button className="item-delete-btn" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                <button className="admin-list-add-btn" onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}>
                  <Plus size={20} /> Adicionar Prato nesta Categoria
                </button>
              </div>
            </main>
          </div>
        </div>
      )}

      {isFormOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          establishmentId={id}
          onClose={() => setIsFormOpen(false)}
          onSave={() => fetchStoreData(true)}
        />
      )}
    </div>
  );
}
