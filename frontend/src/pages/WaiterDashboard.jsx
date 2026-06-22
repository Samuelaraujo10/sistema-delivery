import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, Plus, Minus, Trash2, Send, ClipboardList, UtensilsCrossed, Zap, ShoppingBag } from 'lucide-react';
import { establishmentsAPI, ordersAPI, tabsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import ReceiptPrinter from '../components/ReceiptPrinter';
import socket from '../services/socket';
import { optimizeImage } from '../utils/imageOptimizer';
import './WaiterDashboard.css';

export default function WaiterDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [establishment, setEstablishment] = useState(null);
  const [categories, setCategories] = useState([]);
  const [quickAddProducts, setQuickAddProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Abas do Painel
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'open'
  const [openTabs, setOpenTabs] = useState([]);
  
  // Modal de fechamento/divisão de conta
  const [selectedTabToClose, setSelectedTabToClose] = useState(null);
  const [splitPeople, setSplitPeople] = useState(1);
  const [splitResult, setSplitResult] = useState(null);
  
  // Impressão
  const [printingOrder, setPrintingOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Um garçom deve estar atrelado a um estabelecimento
    if (!user.establishmentId) {
      toast.error('Você não está vinculado a nenhum estabelecimento.');
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        // Buscar dados do estabelecimento (para obter categorias e produtos)
        // Usamos a mesma rota, mas se o backend tiver getById, usariamos ela. 
        // Vamos buscar pelo slug, precisamos descobrir o slug ou adicionar uma rota de getById
        // Como user.establishmentId está disponível, podemos buscar /establishments/{id} 
        // mas API tem getBySlug. Vamos tentar adaptar ou buscar a lista.
        const res = await establishmentsAPI.list();
        const est = res.data.data.find(e => e.id === user.establishmentId);
        
        if (est) {
          // Busca detalhada pelo slug para trazer categorias e produtos
          const detRes = await establishmentsAPI.getBySlug(est.slug);
          setEstablishment(detRes.data.data);
          
          // Filtra produtos que são peças de builder para não poluir o salão
          const filteredCats = (detRes.data.data.categories || []).map(c => ({
            ...c,
            products: c.products?.filter(p => !p.builderRole || p.builderRole === 'none')
          })).filter(c => c.products?.length > 0);
          
          setCategories(filteredCats);

          // Pega todos os produtos que são QuickAdd
          const quick = [];
          filteredCats.forEach(c => {
            c.products?.forEach(p => {
              if (p.isQuickAdd) quick.push(p);
            });
          });
          setQuickAddProducts(quick);
        } else {
          toast.error('Estabelecimento não encontrado.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar cardápio.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, navigate]);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.productId === product.id);
      if (exists) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, product, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeItem = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateItemNotes = (productId, notes) => {
    setCart(prev => prev.map(item => item.productId === productId ? { ...item, notes } : item));
  };

  const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.product.price) * item.quantity), 0);

  const handleTableNumberBlur = (e) => {
    e.target.style.borderColor = 'var(--border)';
    const val = e.target.value;
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly) {
      setTableNumber(digitsOnly.padStart(2, '0'));
    }
  };

  const handleSubmitOrder = async () => {
    if (!tableNumber) {
      toast.error('Informe o número da mesa.');
      return;
    }
    if (cart.length === 0) {
      toast.error('O pedido está vazio.');
      return;
    }

    setIsSubmitting(true);
    try {
      const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes
      }));

      // Abrir ou resgatar Comanda para a Mesa
      const tabRes = await tabsAPI.open({
        establishmentId: establishment.id,
        tabNumber: tableNumber
      });
      const tabId = tabRes.data.data.id;

      const payload = {
        establishmentId: establishment.id,
        items,
        paymentMethod: 'cash', // Salão geralmente paga no caixa depois, então fica cash como default
        type: 'dine_in',
        tableNumber,
        tabId,
        notes
      };

      const { data } = await ordersAPI.create(payload);
      toast.success('Pedido enviado para a cozinha!');

      // Limpar formulário
      setCart([]);
      setTableNumber('');
      setNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao enviar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchOpenTabs = async () => {
    if (!establishment?.id) return;
    try {
      const res = await tabsAPI.listOpen(establishment.id);
      setOpenTabs(res.data.data);
    } catch (err) {
      toast.error('Erro ao buscar comandas abertas.');
    }
  };

  useEffect(() => {
    if (activeTab === 'open' && establishment) {
      fetchOpenTabs();
    }
  }, [activeTab, establishment]);

  useEffect(() => {
    if (establishment) {
      socket.connect();
      socket.emit('join_establishment', establishment.id);

      const handleUpdate = (updatedOrder) => {
        if (updatedOrder.establishmentId === establishment.id) {
          fetchOpenTabs();
        }
      };

      const handleStatusUpdate = (updatedOrder) => {
        if (updatedOrder.establishmentId === establishment.id) {
          fetchOpenTabs();
          if (updatedOrder.status === 'ready') {
            toast.success(`Um pedido está PRONTO na cozinha!`, {
              icon: '🔔',
              duration: 8000,
              style: {
                border: '2px solid #25D366',
                padding: '16px',
                background: 'var(--bg-card)',
                color: 'var(--text)',
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }
            });
            try {
              const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
              audio.play().catch(e => console.log('Audio blocked:', e));
            } catch (err) {}
          }
        }
      };

      socket.on('new_order', handleUpdate);
      socket.on('order_status_updated', handleStatusUpdate);

      return () => {
        socket.off('new_order', handleUpdate);
        socket.off('order_status_updated', handleStatusUpdate);
      };
    }
  }, [establishment]);

  const handleCloseTab = async () => {
    if (!selectedTabToClose) return;
    try {
      const payload = {
        splitWay: splitPeople > 1 ? 'people' : 'none',
        splitValue: splitPeople
      };
      const res = await tabsAPI.close(selectedTabToClose.id, payload);
      toast.success('Comanda fechada com sucesso!');

      // Imprimir o recibo (agrupando os itens de todos os pedidos da comanda)
      const mockOrderToPrint = {
        establishment,
        orderNumber: `Comanda ${selectedTabToClose.tabNumber}`,
        type: 'dine_in',
        tableNumber: selectedTabToClose.tabNumber,
        createdAt: new Date().toISOString(),
        items: (selectedTabToClose.orders || [])
          .filter(o => o.status !== 'cancelled')
          .flatMap(o => (o.items || []).map(item => ({
            quantity: item.quantity,
            product: item.product || { name: item.name },
            totalPrice: item.totalPrice || (parseFloat(item.price || 0) * parseInt(item.quantity || 1)),
            notes: item.notes
          }))),
        subtotal: selectedTabToClose.calculatedTotal,
        total: selectedTabToClose.calculatedTotal,
      };

      setPrintingOrder(mockOrderToPrint);
      setTimeout(() => {
        window.print();
      }, 500);

      if (res.data.splitResult) {
        setSplitResult(res.data.splitResult);
      } else {
        setSelectedTabToClose(null);
        fetchOpenTabs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao fechar comanda.');
    }
  };

  if (loading) {
    return <div className="waiter-loading">Carregando painel do garçom...</div>;
  }

  if (establishment?.plan !== 'pro') {
    return (
      <div className="waiter-dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '20px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border)', maxWidth: '500px' }}>
          <UtensilsCrossed size={48} color="var(--primary)" style={{ marginBottom: '20px' }} />
          <h2>Funcionalidade Exclusiva</h2>
          <p style={{ color: 'var(--text-muted)', margin: '15px 0' }}>
            O Painel do Garçom e a gestão de comandas estão disponíveis apenas no <strong>Plano Pro / Salão & PDV</strong>.
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>
            Faça o upgrade do seu estabelecimento para destravar essa ferramenta e agilizar o atendimento nas mesas!
          </p>
          <button className="btn btn-primary" onClick={() => navigate(`/store/${establishment.slug}`)}>
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="waiter-dashboard">
      <div className="waiter-header">
        <h1><UtensilsCrossed size={24} /> {establishment?.name} - Painel do Garçom</h1>
        <div className="waiter-user">
          Garçom: {user.name}
        </div>
      </div>

      <div className="waiter-tabs" style={{ display: 'flex', gap: '10px', padding: '0 20px', marginBottom: '20px' }}>
        <button 
          className={`btn ${activeTab === 'new' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('new')}
        >
          Nova Comanda
        </button>
        <button 
          className={`btn ${activeTab === 'open' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('open')}
        >
          Comandas Abertas
        </button>
      </div>

      <div className="waiter-content">
        {activeTab === 'new' && (
          <>
        <div className="waiter-menu">
          {quickAddProducts.length > 0 && (
            <div className="waiter-category quick-add-category">
              <h3 style={{ color: 'var(--primary)' }}><Zap size={18} /> Acesso Rápido</h3>
              <div className="waiter-products">
                {quickAddProducts.map(product => (
                  <div key={'qa-'+product.id} className="waiter-product-card qa-card" onClick={() => addToCart(product)} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', border: '1px solid rgba(108, 99, 255, 0.2)', background: 'rgba(108, 99, 255, 0.05)' }}>
                    {product.imageUrl ? (
                      <img src={optimizeImage(product.imageUrl, 100)} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(108, 99, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#6C63FF' }}>
                        {product.name.toLowerCase().includes('espetinho') ? '🍢' : '⚡'}
                      </div>
                    )}
                    <div className="wp-info" style={{ flex: 1 }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--text)' }}>{product.name}</strong>
                    </div>
                    <button className="wp-add-btn" style={{ background: 'var(--primary)', color: '#FFF', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {categories.map(cat => {
            const getCatIcon = () => {
              const name = cat.name.toLowerCase();
              if (name.includes('espetinho')) return '🍢';
              if (name.includes('bebida')) return '🥤';
              return cat.icon || '🏷️';
            };
            return (
            <div key={cat.id} className="waiter-category">
              <h3>{getCatIcon()} {cat.name}</h3>
              <div className="waiter-products">
                {cat.products?.map(product => {
                  const getProdIcon = () => {
                    const name = product.name.toLowerCase();
                    if (name.includes('espetinho')) return '🍢';
                    if (name.includes('coca') || name.includes('guaraná') || name.includes('guarana') || name.includes('lata') || name.includes('suco') || name.includes('água') || name.includes('agua') || name.includes('bebida')) return '🥤';
                    if (cat.name.toLowerCase().includes('bebida')) return '🥤';
                    return '🍽️';
                  };
                  return (
                  <div key={product.id} className="waiter-product-card" onClick={() => addToCart(product)} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '16px', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    {product.imageUrl ? (
                      <img src={optimizeImage(product.imageUrl, 100)} alt={product.name} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                        {getProdIcon()}
                      </div>
                    )}
                    <div className="wp-info" style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text)', marginBottom: '4px' }}>{product.name}</strong>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.95rem' }}>R$ {parseFloat(product.price).toFixed(2)}</span>
                    </div>
                    <button className="wp-add-btn" style={{ background: 'var(--primary)', color: '#FFF', border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>

        <div className="waiter-cart-panel" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '16px', margin: '0 0 20px 0' }}>
            <div style={{ background: 'rgba(108, 99, 255, 0.1)', padding: '8px', borderRadius: '12px', display: 'flex', color: '#6C63FF' }}>
              <ClipboardList size={24} />
            </div>
            Nova Comanda
          </h2>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Mesa / Comanda *</label>
            <input 
              type="text" 
              placeholder="Ex: Mesa 05" 
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              className="table-input"
              style={{ background: 'var(--bg-alt)', border: '2px solid var(--border)', borderRadius: '12px', padding: '14px', fontSize: '1.1rem', color: 'var(--text)', transition: 'border-color 0.2s', width: '100%' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={handleTableNumberBlur}
            />
          </div>

          <div className="cart-items" style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', margin: '0 -8px 20px 0', minHeight: '200px' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', opacity: 0.7 }}>
                <ShoppingBag size={48} style={{ marginBottom: '16px' }} />
                <p>Nenhum item adicionado.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="cart-item-row" style={{ background: 'var(--bg-alt)', borderRadius: '16px', padding: '16px', marginBottom: '12px', border: '1px solid var(--border)' }}>
                  <div className="cart-item-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="ci-name" style={{ fontWeight: 'bold', color: 'var(--text)', fontSize: '1.05rem' }}>{item.product.name}</span>
                    <span className="ci-price" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>R$ {(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="cart-item-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="qty-ctrl" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px' }}>
                      <button onClick={() => updateQuantity(item.productId, -1)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Minus size={14} /></button>
                      <span style={{ width: '28px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={14} /></button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Sem cebola, bem passado..." 
                      value={item.notes}
                      onChange={e => updateItemNotes(item.productId, e.target.value)}
                      className="ci-notes"
                      style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text)' }}
                    />
                    <button className="btn-remove" onClick={() => removeItem(item.productId)} style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#FF4444', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Remover">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer" style={{ borderTop: '2px dashed var(--border)', paddingTop: '20px', marginTop: 'auto' }}>
            <div className="cart-subtotal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '1.2rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Previsto:</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--text)' }}>R$ {subtotal.toFixed(2)}</strong>
            </div>
            
            <input 
              type="text" 
              placeholder="Observações gerais da mesa..." 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="general-notes"
              style={{ width: '100%', background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', marginBottom: '16px', color: 'var(--text)' }}
            />

            <button 
              className="btn btn-primary" 
              onClick={handleSubmitOrder}
              disabled={isSubmitting || cart.length === 0}
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', borderRadius: '16px', boxShadow: cart.length > 0 ? '0 8px 24px rgba(108, 99, 255, 0.3)' : 'none' }}
            >
              <Send size={20} /> {isSubmitting ? 'Enviando...' : 'Enviar para Cozinha'}
            </button>
          </div>
        </div>
        </>
      )}

        {activeTab === 'open' && (
          <div className="open-tabs-view" style={{ width: '100%', padding: '0 20px' }}>
            <h2>Comandas Abertas</h2>
            <div className="tabs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {openTabs.map(tab => {
                let tabTotal = 0;
                tab.orders?.forEach(o => {
                  if (o.status !== 'cancelled') tabTotal += parseFloat(o.total);
                });
                return (
                  <div key={tab.id} className="tab-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Mesa / Comanda #{tab.tabNumber}</h3>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(tab.openedAt).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '0 0 5px 0' }}><strong>Pedidos vinculados:</strong> {tab.orders?.length || 0}</p>
                      <p style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary)', fontWeight: 'bold' }}>Total Acumulado: R$ {tabTotal.toFixed(2)}</p>
                    </div>
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      onClick={() => {
                        setSelectedTabToClose({ ...tab, calculatedTotal: tabTotal });
                        setSplitPeople(1);
                        setSplitResult(null);
                      }}
                    >
                      Ver Detalhes / Fechar Conta
                    </button>
                  </div>
                );
              })}
              {openTabs.length === 0 && (
                <p style={{ color: 'var(--text-muted)' }}>Nenhuma comanda aberta no momento.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Fechamento de Comanda */}
      {selectedTabToClose && (
        <div className="modal-overlay" onClick={() => !splitResult && setSelectedTabToClose(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Fechar Comanda #{selectedTabToClose.tabNumber}</h2>
              {!splitResult && (
                <button className="close-btn" onClick={() => setSelectedTabToClose(null)}>×</button>
              )}
            </div>
            
            <div className="modal-body">
              {!splitResult ? (
                <>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>Resumo de Consumo</h3>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
                      {selectedTabToClose.orders?.map(order => (
                        <div key={order.id} style={{ marginBottom: '10px', fontSize: '0.9rem' }}>
                          <strong>Pedido #{order.orderNumber || order.id.slice(-4)}</strong> ({order.status}) - R$ {parseFloat(order.total).toFixed(2)}
                          <ul style={{ margin: '5px 0', paddingLeft: '20px', color: 'var(--text-muted)' }}>
                            {order.items?.map((item, idx) => (
                              <li key={idx}>{item.quantity}x {item.name || item.product?.name}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Total Devido:</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        R$ {selectedTabToClose.calculatedTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Dividir a conta para quantas pessoas?</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                      <button type="button" className="btn btn-outline" onClick={() => setSplitPeople(Math.max(1, splitPeople - 1))} style={{ padding: '10px' }}><Minus size={16}/></button>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>{splitPeople}</span>
                      <button type="button" className="btn btn-outline" onClick={() => setSplitPeople(splitPeople + 1)} style={{ padding: '10px' }}><Plus size={16}/></button>
                    </div>
                  </div>
                  
                  {splitPeople > 1 && (
                    <div style={{ padding: '15px', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderRadius: '8px', marginTop: '15px', textAlign: 'center' }}>
                      <strong>Cada pessoa pagará:</strong> R$ {(selectedTabToClose.calculatedTotal / splitPeople).toFixed(2)}
                    </div>
                  )}

                  <div className="modal-actions" style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setSelectedTabToClose(null)}>
                      Cancelar
                    </button>
                    <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleCloseTab}>
                      Confirmar Fechamento
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ background: '#25D366', color: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <ClipboardList size={30} />
                  </div>
                  <h3 style={{ marginBottom: '10px' }}>Comanda Fechada!</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>O consumo da mesa {selectedTabToClose.tabNumber} foi encerrado.</p>
                  
                  {splitResult.people > 1 && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                      <p style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>Valor por pessoa ({splitResult.people}x):</p>
                      <h2 style={{ margin: 0, color: 'var(--primary)' }}>R$ {splitResult.valuePerPerson.toFixed(2)}</h2>
                    </div>
                  )}

                  <button className="btn btn-primary" onClick={() => {
                    setSelectedTabToClose(null);
                    setSplitResult(null);
                    fetchOpenTabs();
                  }} style={{ width: '100%' }}>
                    Concluir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Componente de Impressão Oculto */}
      <ReceiptPrinter order={printingOrder} onPrintDone={() => setPrintingOrder(null)} />
    </div>
  );
}
