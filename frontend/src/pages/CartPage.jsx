import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft, MapPin, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ordersAPI } from '../services/api';
import toast from 'react-hot-toast';
import './CartPage.css';

const PAYMENT_METHODS = [
  { key: 'pix', label: 'Pix', icon: Smartphone },
  { key: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard },
  { key: 'debit_card', label: 'Cartão de Débito', icon: CreditCard },
  { key: 'cash', label: 'Dinheiro', icon: Banknote },
];

export default function CartPage() {
  const navigate = useNavigate();
  const { items, establishment, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { user } = useAuthStore();
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { subtotal, deliveryFee, total } = getTotal();

  if (items.length === 0) {
    return (
      <div className="page container">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Carrinho vazio</h2>
          <p>Adicione itens de algum estabelecimento</p>
          <Link to="/" className="btn btn-primary btn-lg">
            <ShoppingBag size={18} />
            Explorar restaurantes
          </Link>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Faça login para finalizar o pedido');
      navigate('/login');
      return;
    }

    if (!address.trim()) {
      toast.error('Informe o endereço de entrega');
      return;
    }

    setLoading(true);
    try {
      // "Aplanar" itens customizados para o backend
      const flattenedItems = [];
      items.forEach(item => {
        if (item.isCustomPasta && item.pastaSelections) {
          const { massa, molho, proteina, toppings } = item.pastaSelections;
          flattenedItems.push({ productId: massa.id, quantity: item.quantity, notes: `Massa do combo: ${item.name}` });
          flattenedItems.push({ productId: molho.id, quantity: item.quantity });
          flattenedItems.push({ productId: proteina.id, quantity: item.quantity });
          toppings.forEach(t => { flattenedItems.push({ productId: t.id, quantity: item.quantity }); });
        } else if (item.isCustomAcai && item.acaiSelections) {
          const { tamanho, creme, fruta, complemento, calda } = item.acaiSelections;
          flattenedItems.push({ productId: tamanho.id, quantity: item.quantity, notes: `Açaí customizado: ${item.name}` });
          [creme, fruta, complemento, calda].forEach(arr => {
            arr.forEach(i => { flattenedItems.push({ productId: i.id, quantity: item.quantity }); });
          });
        } else if (item.isCustomPizza && item.pizzaSelections) {
          const { tamanho, sabor, borda } = item.pizzaSelections;
          flattenedItems.push({ productId: tamanho.id, quantity: item.quantity, notes: `Pizza customizada: ${item.name}` });
          flattenedItems.push({ productId: sabor.id, quantity: item.quantity });
          flattenedItems.push({ productId: borda.id, quantity: item.quantity });
        } else {
          flattenedItems.push({ productId: item.id, quantity: item.quantity, notes: item.notes });
        }
      });

      const orderData = {
        establishmentId: establishment.id,
        items: flattenedItems,
        paymentMethod,
        deliveryAddress: address,
        notes,
      };

      const { data } = await ordersAPI.create(orderData);
      clearCart();
      toast.success('Pedido realizado com sucesso! 🎉');
      navigate(`/order/${data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="container cart-layout">
        {/* Left: Items */}
        <div className="cart-items-col">
          <div className="cart-header">
            <Link to={`/store/${establishment?.slug}`} className="back-link">
              <ArrowLeft size={16} /> Continuar comprando
            </Link>
            <h1 className="cart-title">
              <ShoppingBag size={24} />
              Seu Carrinho
            </h1>
            {establishment && (
              <p className="cart-from">de <strong>{establishment.name}</strong></p>
            )}
          </div>

          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item fade-in">
                <div className="cart-item-emoji">
                  {establishment?.type === 'acai' ? '🍇' :
                   establishment?.type === 'pizza' ? '🍕' :
                   establishment?.type === 'burger' ? '🍔' : '🍽️'}
                </div>
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  {item.isCustomPasta && item.pastaSelections && (
                    <div className="cart-item-details">
                      <div className="detail-tag"><span className="emoji">🍝</span> {item.pastaSelections.massa.name}</div>
                      <div className="detail-tag"><span className="emoji">🍅</span> {item.pastaSelections.molho.name}</div>
                      <div className="detail-tag"><span className="emoji">🍗</span> {item.pastaSelections.proteina.name}</div>
                      {item.pastaSelections.toppings.map(t => (
                        <div key={t.id} className="detail-tag secondary"><span className="emoji">🧀</span> {t.name}</div>
                      ))}
                    </div>
                  )}
                  {item.isCustomAcai && item.acaiSelections && (
                    <div className="cart-item-details">
                      <div className="detail-tag"><span className="emoji">🥤</span> {item.acaiSelections.tamanho.name}</div>
                      {[...item.acaiSelections.creme, ...item.acaiSelections.fruta, ...item.acaiSelections.complemento, ...item.acaiSelections.calda].map(i => (
                        <div key={i.id} className="detail-tag secondary"><span className="emoji">🍇</span> {i.name}</div>
                      ))}
                    </div>
                  )}
                  {item.isCustomPizza && item.pizzaSelections && (
                    <div className="cart-item-details">
                      <div className="detail-tag"><span className="emoji">📏</span> {item.pizzaSelections.tamanho.name}</div>
                      <div className="detail-tag"><span className="emoji">🍕</span> {item.pizzaSelections.sabor.name}</div>
                      <div className="detail-tag secondary"><span className="emoji">🥯</span> {item.pizzaSelections.borda.name}</div>
                    </div>
                  )}
                  <span className="cart-item-price">R$ {parseFloat(item.price).toFixed(2)}</span>
                </div>
                <div className="cart-item-controls">
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                      <Minus size={13} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="cart-item-total">
                    R$ {(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                  <button className="remove-btn" onClick={() => removeItem(item.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Checkout */}
        <div className="checkout-col">
          <div className="checkout-card">
            <h2 className="checkout-title">Finalizar pedido</h2>

            {/* Delivery Address */}
            <div className="checkout-section">
              <label className="checkout-label">
                <MapPin size={15} /> Endereço de entrega *
              </label>
              <textarea
                className="input checkout-textarea"
                placeholder="Rua, número, bairro, complemento..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
              />
            </div>

            {/* Payment */}
            <div className="checkout-section">
              <label className="checkout-label">
                <CreditCard size={15} /> Forma de pagamento
              </label>
              <div className="payment-methods">
                {PAYMENT_METHODS.map(pm => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.key}
                      className={`payment-btn ${paymentMethod === pm.key ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(pm.key)}
                    >
                      <Icon size={16} />
                      {pm.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="checkout-section">
              <label className="checkout-label">Observações</label>
              <input
                className="input"
                placeholder="Sem cebola, ponto da carne..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Summary */}
            <div className="checkout-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Entrega</span>
                <span>{deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg checkout-btn"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Processando...' : `Confirmar pedido • R$ ${total.toFixed(2)}`}
            </button>

            {!user && (
              <p className="checkout-login-hint">
                <Link to="/login">Faça login</Link> para salvar seu histórico de pedidos
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
