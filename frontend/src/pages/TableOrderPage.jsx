import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ShoppingBag, ChevronLeft, Plus, Minus, Send, Phone } from 'lucide-react';
import { establishmentsAPI, ordersAPI, tabsAPI } from '../services/api';
import './StorePage.css'; // Podemos reaproveitar os estilos da Store

export default function TableOrderPage() {
  const { slug, tableNumber } = useParams();
  const navigate = useNavigate();
  
  const [establishment, setEstablishment] = useState(null);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const { data } = await establishmentsAPI.getBySlug(slug);
        setEstablishment(data.data);
        
        // Load categories, but ignore builders since we just want quick orders
        const filteredCats = (data.data.categories || []).map(c => ({
          ...c,
          products: c.products?.filter(p => !p.builderRole || p.builderRole === 'none')
        })).filter(c => c.products?.length > 0);
        
        setCategories(filteredCats);

        // Fetch or create a Tab for this table
        try {
          const tabRes = await tabsAPI.open({
            establishmentId: data.data.id,
            tabNumber: tableNumber
          });
          setTab(tabRes.data.data);
        } catch (err) {
          console.error("Failed to open tab:", err);
        }

      } catch (err) {
        toast.error('Loja não encontrada');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [slug, tableNumber, navigate]);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.product.id === product.id);
      if (exists) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
    toast.success(`${product.name} adicionado!`);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeItem = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes
      }));

      const payload = {
        establishmentId: establishment.id,
        items,
        paymentMethod: 'cash',
        type: 'dine_in',
        tableNumber,
        tabId: tab?.id || null, // Vínculo com a comanda da mesa
        notes: 'Pedido feito via Autoatendimento (QR Code)'
      };

      await ordersAPI.create(payload);
      toast.success('Pedido enviado para a cozinha/bar!');
      setCart([]);
    } catch (err) {
      toast.error('Erro ao enviar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Carregando cardápio...</div>;
  if (!establishment) return null;

  return (
    <div className="store-page" style={{ paddingBottom: cart.length > 0 ? '100px' : '0' }}>
      <header className="store-header">
        <div className="store-banner" style={{ backgroundImage: `url(${establishment.banner || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80'})` }}>
          <div className="store-banner-overlay"></div>
          <div className="store-info">
            <img src={establishment.logo || 'https://via.placeholder.com/150'} alt="Logo" className="store-logo" />
            <div>
              <h1>{establishment.name}</h1>
              <p>Mesa {tableNumber} • Autoatendimento</p>
            </div>
          </div>
        </div>
      </header>

      <main className="store-menu">
        <div className="menu-container">
          <div className="call-waiter-banner">
            <span>Precisa de ajuda?</span>
            <button className="btn-call-waiter" onClick={() => toast.success('Garçom chamado!')}><Phone size={16} /> Chamar Garçom</button>
          </div>

          {categories.map(category => (
            <section key={category.id} id={`category-${category.id}`} className="menu-category">
              <h2>{category.icon} {category.name}</h2>
              <div className="products-grid">
                {category.products?.map(product => (
                  <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <div className="product-price">
                        R$ {parseFloat(product.price).toFixed(2)}
                      </div>
                    </div>
                    {product.image && (
                      <div className="product-image">
                        <img src={product.image} alt={product.name} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Cart Drawer na parte inferior da tela (Mobile friendly) */}
      {cart.length > 0 && (
        <div className="mobile-cart-drawer">
          <div className="mcd-header">
            <h4><ShoppingBag size={18} /> Seu Pedido</h4>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="mcd-items">
            {cart.map(item => (
              <div key={item.product.id} className="mcd-item">
                <div className="mcd-item-name">{item.quantity}x {item.product.name}</div>
                <div className="mcd-controls">
                  <button onClick={() => updateQuantity(item.product.id, -1)}><Minus size={14} /></button>
                  <button onClick={() => updateQuantity(item.product.id, 1)}><Plus size={14} /></button>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-mcd-send" onClick={handleSendOrder} disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar Pedido Agora'} <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
