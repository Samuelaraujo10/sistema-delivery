import { useState, useEffect, useMemo } from 'react';
// Default menu categories offered to the store owner
const DEFAULT_MENU_CATEGORIES = ['Pratos Principais', 'Entradas', 'Sobremesas', 'Bebidas', 'Outros'];
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Star, Clock, Bike, MapPin, Phone, ChevronDown, Settings, Plus, Edit3, Trash2, Eye, EyeOff, ClipboardList, Layout, Palette, Image, MessageCircle, ChefHat, Package } from 'lucide-react';
import { establishmentsAPI, productsAPI, categoriesAPI, ordersAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import Skeleton from '../components/Skeleton';
import ProductSkeleton from '../components/ProductSkeleton';
import { useAuthStore } from '../store/authStore';
import './StorePage.css';

const TYPE_EMOJIS = { acai: '🍇', pizza: '🍕', burger: '🍔', sushi: '🍱', pasta: '🍝', massa: '🍝', other: '🍽️' };

import ProductFormModal from '../components/ProductFormModal';
import { getEmojiByName, isImageEmoji } from '../utils/emojiMap';
import AcaiBuilder from './AcaiBuilder';
import PizzaBuilder from './PizzaBuilder';
import PastaBuilder from './PastaBuilder';
import { getReadableColor } from '../utils/colorUtils';
import MenuManagement from './MenuManagement';
import ReviewsList from '../components/ReviewsList';

export default function StorePage() {
  const { slug } = useParams();
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState('store'); // 'store', 'menu', 'orders', 'settings'
  const [storeTab, setStoreTab] = useState('menu'); // 'menu' | 'reviews'
  const [activeBuilder, setActiveBuilder] = useState(null); // 'acai' | 'pizza' | 'massa' | null
  const [orders, setOrders] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  
  // Establishment Config Form State
  const [estFormData, setEstFormData] = useState({
    name: '',
    description: '',
    deliveryFee: '',
    minOrder: '',
    deliveryTime: '',
    address: '',
    phone: '',
    whatsapp: '',
    pixKey: '',
    primaryColor: '#FF6B35',
    secondaryColor: '#FFB800',
    isOpen: true,
    type: 'outros',
    hasBuilder: true
  });
  
  // Admin Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Auth check
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isOwner = user?.role === 'admin' && (user.establishmentId === establishment?.id || !user.establishmentId);

  useEffect(() => {
    if (user?.role === 'admin' && user?.establishmentId && establishment && establishment.id !== user.establishmentId) {
      toast.error('Você só tem permissão para visualizar o seu próprio restaurante.');
      navigate(`/store/${user.establishment?.slug || ''}`);
    }
  }, [user, establishment, navigate]);

  const [menuSubTab, setMenuSubTab] = useState('dishes'); // 'dishes' | 'ingredients'

  // Categories exclusive to the builder flow (Monte o seu)
  const BUILDER_ONLY_CATEGORIES = ['Massas', 'Molhos', 'Proteínas', 'Toppings'];

  // Show all categories for admin, but filter out builder products for customers
  const displayCategories = useMemo(() => {
    if (!establishment) return [];

    if (isOwner) {
      // Owner/Admin view: filtrar categorias conforme aba de pratos/ingredientes
      if (adminTab === 'menu') {
        return (establishment.categories || [])
          .map(c => {
            const filteredProducts = c.products?.filter(p => {
              if (menuSubTab === 'dishes') {
                return !p.builderRole || p.builderRole === 'none';
              } else {
                return p.builderRole && p.builderRole !== 'none';
              }
            }) || [];
            return { ...c, products: filteredProducts };
          })
          // Filtrar categorias de acordo com a aba selecionada
          .filter(c => {
            if (menuSubTab === 'dishes') {
              // Exibir apenas categorias principais, excluir as exclusivas do builder
              return !BUILDER_ONLY_CATEGORIES.includes(c.name);
            } else {
              // Exibir apenas categorias do builder
              return BUILDER_ONLY_CATEGORIES.includes(c.name);
            }
          })
          .filter(c => {
            const origCat = (establishment.categories || []).find(orig => orig.id === c.id);
            const totalProductsInDb = origCat?.products?.length || 0;
            if (totalProductsInDb === 0) return true;
            return c.products.length > 0;
          });
      }
      return establishment.categories || [];
    }

    // Customer view: filter out builder products and hide builder-only categories
    const filtered = (establishment.categories || [])
      .map(c => ({
        ...c,
        products: c.products?.filter(p => (!p.builderRole || p.builderRole === 'none') && p.available !== false)
      }))
      .filter(c => c.products?.length > 0)
      .filter(c => !BUILDER_ONLY_CATEGORIES.includes(c.name));
    return filtered;
  }, [establishment, isOwner, adminTab, menuSubTab]);

  const activecat = useMemo(() => {
    return displayCategories.find(c => c.id === activeCategory);
  }, [displayCategories, activeCategory]);

  const builderType = useMemo(() => {
    if (!establishment) return null;
    if (establishment.hasBuilder === false) return null;
    const estType = establishment.type;
    if (estType === 'acai' || establishment.categories?.some(c => c.products?.some(p => p.builderRole === 'creme'))) return 'acai';
    if (estType === 'pizza' || establishment.categories?.some(c => c.products?.some(p => p.builderRole === 'sabor'))) return 'pizza';
    if (estType === 'pasta' || establishment.categories?.some(c => c.products?.some(p => p.builderRole === 'massa'))) return 'pasta';
    return null;
  }, [establishment]);

  const fetchStoreData = async (refresh = false) => {
    if (!refresh) setLoading(true);
    try {
      const { data } = await establishmentsAPI.getBySlug(slug, user?.role === 'admin' ? { adminView: true } : {});
      setEstablishment(data.data);
      
      // Initialize config form
      setEstFormData({
        name: data.data.name,
        description: data.data.description || '',
        deliveryFee: data.data.deliveryFee,
        minOrder: data.data.minOrder,
        deliveryTime: data.data.deliveryTime,
        address: data.data.address || '',
        phone: data.data.phone || '',
        whatsapp: data.data.whatsapp || '',
        pixKey: data.data.pixKey || '',
        primaryColor: data.data.primaryColor || '#6C63FF',
        secondaryColor: data.data.secondaryColor || '#FFB800',
        isOpen: data.data.isOpen,
        type: data.data.type,
        hasBuilder: data.data.hasBuilder !== false
      });

    } catch (err) {
      console.error(err);
    } finally {
      if (!refresh) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [slug]);

  useEffect(() => {
    if (establishment) {
      if (displayCategories.length > 0) {
        const isValid = displayCategories.some(c => c.id === activeCategory);
        if (!isValid) {
          setActiveCategory(displayCategories[0].id);
        }
      } else {
        setActiveCategory(null);
      }
    }
  }, [establishment, displayCategories]);

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

  // Create a new category; if a name is supplied it will be used directly, otherwise a prompt is shown.
  const handleAddCategory = async (providedName) => {
    let name = providedName;
    if (!name) {
      name = window.prompt('Nome da nova categoria (ex: Lanches, Bebidas):');
    }
    if (!name || name.trim() === '') return;
    try {
      await categoriesAPI.create({
        name: name.trim(),
        icon: '🏷️',
        establishmentId: establishment.id,
      });
      toast.success('Categoria criada com sucesso!');
      fetchStoreData(true);
    } catch (err) {
      toast.error('Erro ao criar categoria');
      console.error(err);
    }
  };

  const handleEditCategory = async (cat) => {
    const newName = window.prompt('Novo nome da categoria:', cat.name);
    if (!newName || newName.trim() === '' || newName === cat.name) return;
    try {
      await categoriesAPI.update(cat.id, { name: newName.trim() });
      toast.success('Categoria atualizada!');
      fetchStoreData(true);
    } catch (err) {
      toast.error('Erro ao atualizar categoria');
    }
  };

  // Excluir categoria
  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Excluir a categoria "${cat.name}"? Essa ação removerá todos os produtos associados.`)) return;
    try {
      await categoriesAPI.delete(cat.id);
      toast.success('Categoria excluída!');
      // Se a categoria deletada estava ativa, limpar seleção
      if (activeCategory === cat.id) setActiveCategory(null);
      fetchStoreData(true);
    } catch (err) {
      toast.error('Erro ao excluir categoria');
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

  const fetchOrders = async () => {
    try {
      const { data } = await establishmentsAPI.getOrders(establishment.id);
      
      const newPendingCount = data.data.filter(o => o.status === 'pending').length;
      const oldPendingCount = orders.filter(o => o.status === 'pending').length;
      if (newPendingCount > oldPendingCount && oldPendingCount !== 0) {
        toast('Novo pedido recebido!', { icon: '🔔', duration: 5000 });
      }

      setOrders(data.data);
    } catch (err) {
      console.error('Erro ao buscar pedidos');
    }
  };

  useEffect(() => {
    if (adminTab === 'orders' && establishment) {
      fetchOrders();

      const auth = JSON.parse(sessionStorage.getItem('delivery-auth') || '{}');
      const token = auth?.state?.token;
      const eventSource = new EventSource(`/api/orders/events?token=${token}`);

      eventSource.onmessage = (event) => {
        try {
          const updatedOrder = JSON.parse(event.data);
          
          if (updatedOrder.establishmentId === establishment.id) {
            fetchOrders();
            if (updatedOrder.status === 'pending') {
              toast('Novo pedido recebido!', { icon: '🔔', duration: 5000 });
            }
          }
        } catch (err) {
          console.error('Falha ao processar evento SSE no PDV:', err);
        }
      };

      eventSource.onerror = (err) => {
        eventSource.close();
      };

      // Intervalo de segurança maior como fallback
      const interval = setInterval(fetchOrders, 60000);

      return () => {
        eventSource.close();
        clearInterval(interval);
      };
    }
  }, [adminTab, establishment]);

  const handleEstSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = new FormData();
      Object.entries(estFormData).forEach(([key, value]) => payload.append(key, value));
      if (imageFile) payload.append('logoFile', imageFile);

      await establishmentsAPI.update(establishment.id, payload);
      toast.success('Configurações atualizadas!');
      fetchStoreData(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      const statusMap = {
        confirmed: 'confirmado e aceito',
        preparing: 'iniciado preparo',
        delivering: 'enviado para entrega',
        delivered: 'entregue e finalizado',
        cancelled: 'cancelado / recusado'
      };
      toast.success(`Pedido ${statusMap[status] || status}!`);
      fetchOrders();
    } catch (err) {
      toast.error('Erro ao atualizar pedido');
    }
  };

  const handleRequestPixReceipt = (order) => {
    const clientPhoneRaw = order.user?.phone || '';
    if (!clientPhoneRaw) {
      toast.error('Cliente não possui telefone cadastrado.');
      return;
    }
    const digits = clientPhoneRaw.replace(/\D/g, '');
    const formattedPhone = digits.startsWith('55') ? digits : `55${digits}`;
    
    const clientName = order.user?.name || 'Cliente';
    const pixKey = establishment?.pixKey || 'não cadastrada';
    
    const message = encodeURIComponent(
      `Olá, ${clientName}! Somos do estabelecimento *${establishment?.name}*. \n\n` +
      `Recebemos o seu pedido *#${order.orderNumber}* no valor de *R$ ${parseFloat(order.total).toFixed(2)}*. \n` +
      `Como a forma de pagamento escolhida foi Pix, por favor nos envie o comprovante por aqui para iniciarmos o preparo.\n\n` +
      `🔑 *Nossa chave Pix:* ${pixKey}`
    );
    
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
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

  const { id, name, type, description, rating, deliveryTime, deliveryFee, minOrder, address, phone, whatsapp, isOpen, categories, primaryColor, secondaryColor } = establishment;
  
  // displayCategories and activecat are now memoized and defined at the top

  return (
    <div className={`store-page ${adminTab !== 'store' ? 'admin-layout-active' : ''}`}>

      {/* Admin Control Bar */}
      {isOwner && (
        <div className="admin-control-bar">
          <div className="container admin-bar-content">
            <div className="admin-nav">
              <button 
                className={`admin-nav-btn ${adminTab === 'store' ? 'active' : ''}`}
                onClick={() => setAdminTab('store')}
              >
                <Eye size={18} /> Ver Loja
              </button>
              <button 
                className={`admin-nav-btn ${adminTab === 'menu' ? 'active' : ''}`}
                onClick={() => setAdminTab('menu')}
              >
                <Layout size={18} /> Cardápio
              </button>
              <button 
                className={`admin-nav-btn ${adminTab === 'orders' ? 'active' : ''}`}
                onClick={() => setAdminTab('orders')}
              >
                <ClipboardList size={18} /> Pedidos
              </button>
              <button 
                className={`admin-nav-btn ${adminTab === 'settings' ? 'active' : ''}`}
                onClick={() => setAdminTab('settings')}
              >
                <Palette size={18} /> Ajustes
              </button>
            </div>

          </div>
        </div>
      )}


      {adminTab === 'store' ? (
        <>
          {/* Cover */}
          <div
            className="store-cover"
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}30 0%, ${secondaryColor}20 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            <div className="store-cover-glow" style={{ background: `radial-gradient(circle at 60% 50%, ${primaryColor}30, transparent 60%)` }} />
            
            {establishment.logo ? (
              <div className="store-cover-branded">
                <div 
                  className="store-cover-blur" 
                  style={{ backgroundImage: `url(${establishment.logo})` }} 
                />
                <img src={establishment.logo} alt={name} className="store-cover-main-img" />
              </div>
            ) : (
              <div className="store-emoji">{TYPE_EMOJIS[type] || '🍽️'}</div>
            )}


            {user?.role !== 'admin' && (
              <Link to="/" className="back-btn">
                <ArrowLeft size={18} /> Voltar
              </Link>
            )}
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

                {(whatsapp || phone) && (
                  <a 
                    href={`https://wa.me/${(whatsapp || phone).replace(/\D/g, '').startsWith('55') ? (whatsapp || phone).replace(/\D/g, '') : '55' + (whatsapp || phone).replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Estava olhando o cardápio e tenho uma dúvida.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-whatsapp"
                    style={{ marginTop: '12px', display: 'inline-flex', alignSelf: 'flex-start' }}
                  >
                    <MessageCircle size={16} style={{ marginRight: '6px' }} />
                    Dúvidas? Chame no WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Builder Promo */}
            {builderType && user?.role !== 'admin' && (
              <div className="builder-promo">
                <div className="builder-promo-content">
                  <div className="builder-promo-text">
                    <h3>
                       <Star size={16} fill="#FFB800" color="#FFB800" className="emoji-highlight-star" />
                      {builderType === 'pasta' ? 'Monte sua Massa' : builderType === 'acai' ? 'Monte seu Açaí' : 'Monte sua Pizza'}
                    </h3>
                    <p>Personalize do seu jeito com seus ingredientes favoritos!</p>
                  </div>
                  <button onClick={() => setActiveBuilder(builderType)} className="btn btn-primary">Começar agora</button>
                </div>
              </div>
            )}

            {/* Main Tabs (Menu vs Reviews) */}
            <div className="store-main-tabs" style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <button 
                className={`store-main-tab ${storeTab === 'menu' ? 'active' : ''}`}
                onClick={() => setStoreTab('menu')}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: storeTab === 'menu' ? '800' : '600', color: storeTab === 'menu' ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: storeTab === 'menu' ? `3px solid ${primaryColor}` : '3px solid transparent', paddingBottom: '8px' }}
              >
                Cardápio
              </button>
              <button 
                className={`store-main-tab ${storeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setStoreTab('reviews')}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: storeTab === 'reviews' ? '800' : '600', color: storeTab === 'reviews' ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', borderBottom: storeTab === 'reviews' ? `3px solid ${primaryColor}` : '3px solid transparent', paddingBottom: '8px' }}
              >
                Avaliações
              </button>
            </div>

            {storeTab === 'reviews' && (
              <ReviewsList establishmentId={establishment.id} />
            )}

            {storeTab === 'menu' && (
              <>
                {/* Category tabs */}
                {displayCategories.length > 0 && (
              <>
                {/* Menu sub-tab toggle */}
                <div className="menu-subtab" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    className={menuSubTab === 'dishes' ? 'active' : ''}
                    onClick={() => setMenuSubTab('dishes')}
                    style={menuSubTab === 'dishes' ? { background: getReadableColor(primaryColor).bg, color: getReadableColor(primaryColor).text, borderColor: getReadableColor(primaryColor).border } : {}}
                  >
                    Pratos Principais
                  </button>
                  <button
                    className={menuSubTab === 'ingredients' ? 'active' : ''}
                    onClick={() => setMenuSubTab('ingredients')}
                    style={menuSubTab === 'ingredients' ? { background: getReadableColor(primaryColor).bg, color: getReadableColor(primaryColor).text, borderColor: getReadableColor(primaryColor).border } : {}}
                  >
                    Monte o Seu
                  </button>
                </div>
                <div className="cat-tabs-wrapper">
                  <div className="cat-tabs">
                    {displayCategories.map(cat => (
                      <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
                          style={activeCategory === cat.id ? { 
                            borderColor: getReadableColor(primaryColor).border, 
                            color: getReadableColor(primaryColor).text, 
                            background: getReadableColor(primaryColor).bg 
                          } : {}}
                          onClick={() => setActiveCategory(cat.id)}
                        >
                          {cat.icon} {cat.name}
                          <span className="cat-count">{cat.products?.length || 0}</span>
                        </button>
                        {isOwner && (
                          <button
                            className="cat-delete-btn"
                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                            title="Excluir categoria"
                            style={{ background: 'transparent', border: 'none', color: 'red', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

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
            </>
            )}
          </div>
        </>
      ) : (
        /* Exclusive Management View */
        <div className="container admin-management-view">
          {adminTab === 'menu' && (
            <MenuManagement 
              establishment={establishment}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              handleEditCategory={handleEditCategory}
              handleDeleteCategory={handleDeleteCategory}
              handleAddCategory={handleAddCategory}
              activecat={activecat}
              isImageEmoji={isImageEmoji}
              getEmojiByName={getEmojiByName}
              type={type}
              handleToggleAvailability={handleToggleAvailability}
              handleEditProduct={handleEditProduct}
              handleDeleteProduct={handleDeleteProduct}
              setEditingProduct={setEditingProduct}
              setIsFormOpen={setIsFormOpen}
              menuSubTab={menuSubTab}
              setMenuSubTab={setMenuSubTab}
            />
          )}

          {adminTab === 'orders' && (
            <div className="admin-orders-view">
              <div className="admin-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>Painel de Pedidos (PDV)</h2>
                  <p>Acompanhamento simplificado para a operação em tempo real</p>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={fetchOrders}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Clock size={16} /> Atualizar
                </button>
              </div>

              <div className="pdv-layout">
                {/* Novos / Pendentes */}
                <div className="pdv-column">
                  <h3><Package size={18} color="#6C63FF" /> Novos Pedidos</h3>
                  {orders.filter(o => o.status === 'pending').map(order => (
                    <div key={order.id} className="pdv-order-card pdv-alert-new">
                      <div className="pdv-order-header">
                        <span className="pdv-order-id">#{order.orderNumber || order.id.slice(-4)}</span>
                        <span className="pdv-order-time">{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="pdv-order-meta">
                        <p><strong>Cliente:</strong> {order.user?.name || 'Visitante'}</p>
                        <p><strong>Pagamento:</strong> {order.paymentMethod === 'cash' ? 'Dinheiro' : order.paymentMethod === 'pix' ? 'Pix' : 'Cartão'}</p>
                        <p><strong>Total:</strong> R$ {parseFloat(order.total).toFixed(2)}</p>
                      </div>

                      <div className="pdv-order-items">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="pdv-order-item-row">
                            <span className="pdv-order-item-qty">{item.quantity}x</span>
                            <span>{item.name || item.product?.name}</span>
                          </div>
                        ))}
                      </div>
                      
                      {order.notes && (
                        <div style={{ background: '#FFEB3B20', color: '#FFEB3B', padding: '8px', borderRadius: '4px', marginBottom: '12px', fontSize: '0.85rem' }}>
                          <strong>Obs:</strong> {order.notes}
                        </div>
                      )}

                      <div className="pdv-order-actions">
                        <button className="pdv-btn pdv-btn-primary" onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                          Aceitar
                        </button>
                        <button className="pdv-btn" style={{ background: '#EF4444', color: 'white' }} onClick={() => {
                          if (window.confirm('Deseja realmente recusar este pedido?')) {
                            updateOrderStatus(order.id, 'cancelled');
                          }
                        }}>
                          Recusar
                        </button>
                        {order.paymentMethod === 'pix' && (
                          <button className="pdv-btn" style={{ background: '#25D366', color: 'white' }} onClick={() => handleRequestPixReceipt(order)} title="Cobrar Pix via WhatsApp">
                            <MessageCircle size={18} />
                          </button>
                        )}
                        <button className="pdv-print-btn" onClick={() => window.print()} title="Imprimir Comanda">
                          <ClipboardList size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {orders.filter(o => o.status === 'pending').length === 0 && (
                    <p style={{ color: '#94A3B8', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>Nenhum pedido novo</p>
                  )}
                </div>

                {/* Em Preparo */}
                <div className="pdv-column">
                  <h3><ChefHat size={18} color="#FF8C00" /> Preparando</h3>
                  {orders.filter(o => o.status === 'confirmed' || o.status === 'preparing').map(order => (
                    <div key={order.id} className="pdv-order-card" style={{ borderLeftColor: '#FF8C00' }}>
                      <div className="pdv-order-header">
                        <span className="pdv-order-id">#{order.orderNumber || order.id.slice(-4)}</span>
                        <span className="pdv-order-time">{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="pdv-order-meta">
                        <p><strong>Cliente:</strong> {order.user?.name || 'Visitante'}</p>
                        <p><strong>Endereço:</strong> {order.deliveryAddress}</p>
                      </div>
                      
                      <div className="pdv-order-items" style={{opacity: 0.7}}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="pdv-order-item-row">
                            <span className="pdv-order-item-qty">{item.quantity}x</span>
                            <span>{item.name || item.product?.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pdv-order-actions">
                        {order.status === 'confirmed' ? (
                          <button className="pdv-btn pdv-btn-warning" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                            Iniciar Preparo
                          </button>
                        ) : (
                          <button className="pdv-btn pdv-btn-primary" style={{ background: '#00D9A6' }} onClick={() => updateOrderStatus(order.id, 'delivering')}>
                            Saiu p/ Entrega
                          </button>
                        )}
                        {order.paymentMethod === 'pix' && (
                          <button className="pdv-print-btn" style={{ color: '#25D366', borderColor: '#25D366' }} onClick={() => handleRequestPixReceipt(order)} title="Cobrar Pix via WhatsApp">
                            <MessageCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {orders.filter(o => o.status === 'confirmed' || o.status === 'preparing').length === 0 && (
                    <p style={{ color: '#94A3B8', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>Nenhum pedido na cozinha</p>
                  )}
                </div>

                {/* Saiu para Entrega */}
                <div className="pdv-column">
                  <h3><Bike size={18} color="#00D9A6" /> Em Entrega</h3>
                  {orders.filter(o => o.status === 'delivering').map(order => (
                    <div key={order.id} className="pdv-order-card" style={{ borderLeftColor: '#00D9A6' }}>
                      <div className="pdv-order-header">
                        <span className="pdv-order-id">#{order.orderNumber || order.id.slice(-4)}</span>
                        <span className="pdv-order-time">{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="pdv-order-meta">
                        <p><strong>Endereço:</strong> {order.deliveryAddress}</p>
                        <p><strong>Pagamento:</strong> {order.paymentMethod === 'cash' ? 'Dinheiro' : order.paymentMethod === 'pix' ? 'Pix' : 'Cartão'}</p>
                        <p><strong>Cobrar:</strong> R$ {parseFloat(order.total).toFixed(2)}</p>
                      </div>

                      <div className="pdv-order-actions">
                        <button className="pdv-btn pdv-btn-success" onClick={() => updateOrderStatus(order.id, 'delivered')}>
                          Finalizar (Entregue)
                        </button>
                      </div>
                    </div>
                  ))}
                  {orders.filter(o => o.status === 'delivering').length === 0 && (
                    <p style={{ color: '#94A3B8', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>Nenhuma entrega em rota</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {adminTab === 'settings' && (
            <div className="admin-settings-view">
              <div className="admin-view-header">
                <h2>Configurações da Loja</h2>
                <p>Personalize as informações e o visual do seu estabelecimento</p>
              </div>

              <div className="admin-establishment-config">
                <form onSubmit={handleEstSubmit} className="admin-form-flat">
                  <div className="form-section-title">Dados Gerais</div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nome da Loja</label>
                      <input 
                        type="text" 
                        value={estFormData.name} 
                        onChange={e => setEstFormData({...estFormData, name: e.target.value})}
                        required
                        placeholder="Ex: Pizzaria Bella Italia"
                      />
                    </div>
                    <div className="form-group">
                      <label>Tipo de Cozinha</label>
                      <select 
                        value={estFormData.type} 
                        onChange={e => setEstFormData({...estFormData, type: e.target.value})}
                      >
                        <option value="burger">🍔 Hambúrguer</option>
                        <option value="pizza">🍕 Pizza</option>
                        <option value="acai">🍇 Açaí</option>
                        <option value="pasta">🍝 Massas</option>
                        <option value="sushi">🍱 Sushi</option>
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
                      onChange={e => setEstFormData({...estFormData, description: e.target.value})}
                      rows="2"
                      placeholder="Escreva uma breve descrição sobre a culinária da loja..."
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Endereço Completo</label>
                      <input 
                        type="text" 
                        value={estFormData.address} 
                        onChange={e => setEstFormData({...estFormData, address: e.target.value})} 
                        placeholder="Ex: Av. Paulista, 1000 - São Paulo"
                      />
                    </div>
                    <div className="form-group">
                      <label>Telefone Comercial</label>
                      <input 
                        type="text" 
                        value={estFormData.phone} 
                        onChange={e => setEstFormData({...estFormData, phone: e.target.value})} 
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
                        onChange={e => setEstFormData({...estFormData, deliveryFee: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Pedido Mínimo (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={estFormData.minOrder} 
                        onChange={e => setEstFormData({...estFormData, minOrder: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Tempo Estimado (min)</label>
                      <input 
                        type="number" 
                        value={estFormData.deliveryTime} 
                        onChange={e => setEstFormData({...estFormData, deliveryTime: parseInt(e.target.value) || 40})}
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>WhatsApp do Estabelecimento (com DDD)</label>
                      <input 
                        type="text" 
                        value={estFormData.whatsapp} 
                        onChange={e => setEstFormData({...estFormData, whatsapp: e.target.value})}
                        placeholder="Ex: 5511999999999"
                      />
                    </div>
                    <div className="form-group">
                      <label>Chave Pix para Recebimento</label>
                      <input 
                        type="text" 
                        value={estFormData.pixKey} 
                        onChange={e => setEstFormData({...estFormData, pixKey: e.target.value})}
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
                          id="logoFileInput"
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => setImageFile(e.target.files[0])}
                        />
                        <label htmlFor="logoFileInput" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <Image size={16} />
                          Escolher arquivo
                        </label>
                        <span className="logo-file-name">
                          {imageFile ? imageFile.name : (establishment.logo ? 'Logo já cadastrado' : 'Nenhum arquivo selecionado')}
                        </span>
                      </div>
                      {imageFile && (
                        <img src={URL.createObjectURL(imageFile)} alt="Preview" className="logo-preview" style={{ marginTop: '12px', width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--border)' }} />
                      )}
                    </div>

                    <div className="form-group" style={{ justifyContent: 'center' }}>
                      <label className="toggle-switch-label">
                        <input 
                          type="checkbox" 
                          checked={estFormData.hasBuilder} 
                          onChange={e => setEstFormData({...estFormData, hasBuilder: e.target.checked})}
                        />
                        <span className="toggle-slider" />
                        <span>Habilitar Montador de Pratos (Açaí, Pizza, Massa)</span>
                      </label>
                      <small style={{ display: 'block', color: 'var(--text-muted)', marginTop: '4px', marginLeft: '56px' }}>
                        Se desativado, o banner "Monte seu..." não será exibido para os clientes.
                      </small>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Cor Primária da Marca</label>
                      <div className="color-input-wrapper">
                        <input 
                          type="color" 
                          value={estFormData.primaryColor} 
                          onChange={e => setEstFormData({...estFormData, primaryColor: e.target.value})}
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
                          onChange={e => setEstFormData({...estFormData, secondaryColor: e.target.value})}
                        />
                        <span>{estFormData.secondaryColor}</span>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-sm btn-save btn-submit" style={{ marginTop: '20px' }} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}


      {isFormOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          establishmentId={id}
          defaultBuilderRole={menuSubTab === 'ingredients' ? 'topping' : 'none'}
          onClose={() => setIsFormOpen(false)}
          onSave={() => fetchStoreData(true)}
        />
      )}

      {activeBuilder && (
        <div className="embedded-builder-overlay">
          <div className="embedded-builder-container">
            {activeBuilder === 'acai' && (
              <AcaiBuilder 
                isEmbedded={true} 
                onClose={() => setActiveBuilder(null)} 
                embeddedEstablishment={establishment} 
              />
            )}
            {activeBuilder === 'pizza' && (
              <PizzaBuilder 
                isEmbedded={true} 
                onClose={() => setActiveBuilder(null)} 
                embeddedEstablishment={establishment} 
              />
            )}
            {activeBuilder === 'pasta' && (
              <PastaBuilder 
                isEmbedded={true} 
                onClose={() => setActiveBuilder(null)} 
                embeddedEstablishment={establishment} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
