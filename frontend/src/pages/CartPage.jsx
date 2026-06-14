import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft, MapPin, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { ordersAPI } from '../services/api';
import { getEmojiByName, isImageEmoji } from '../utils/emojiMap';
import toast from 'react-hot-toast';
import './CartPage.css';

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

const PAYMENT_METHODS = [
  { key: 'pix', label: 'Pix', icon: Smartphone },
  { key: 'credit_card', label: 'Cartão de Crédito (na entrega)', icon: CreditCard },
  { key: 'debit_card', label: 'Cartão de Débito (na entrega)', icon: CreditCard },
  { key: 'cash', label: 'Dinheiro', icon: Banknote },
];

export default function CartPage() {
  const navigate = useNavigate();
  const { items, establishment, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const { user } = useAuthStore();
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [reference, setReference] = useState('');
  const [cep, setCep] = useState('');
  const [uf, setUf] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [changeFor, setChangeFor] = useState('');
  const [notes, setNotes] = useState('');
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
    if (user && user.role === 'admin') {
      toast.error('Administradores não podem realizar compras.');
      navigate(user.establishmentId ? `/store/${user.establishment?.slug || ''}` : '/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.address) {
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
        // Fallback for plain string formats
        setStreet(user.address);
      }
    }
  }, [user]);

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

    if (!street.trim()) {
      toast.error('Informe a rua do endereço de entrega');
      return;
    }
    if (!number.trim()) {
      toast.error('Informe o número do endereço de entrega');
      return;
    }
    if (!neighborhood.trim()) {
      toast.error('Informe o bairro do endereço de entrega');
      return;
    }
    if (!city.trim()) {
      toast.error('Informe a cidade do endereço de entrega');
      return;
    }
    if (!cep.trim() || cep.length < 9) {
      toast.error('Informe um CEP válido');
      return;
    }
    if (!uf.trim()) {
      toast.error('Informe o estado (UF) do endereço de entrega');
      return;
    }

    setLoading(true);
    try {
      // "Aplanar" itens customizados para o backend
      const flattenedItems = [];
      items.forEach(item => {
        if (item.isCustomPasta && item.pastaSelections) {
          const { massa, molho, proteina, toppings } = item.pastaSelections;
          const comboId = `pasta-${Date.now()}-${Math.random()}`;
          flattenedItems.push({ productId: massa.id, quantity: item.quantity, notes: `Massa do combo: ${item.name}`, comboId, comboType: 'pasta' });
          flattenedItems.push({ productId: molho.id, quantity: item.quantity, comboId, comboType: 'pasta' });
          flattenedItems.push({ productId: proteina.id, quantity: item.quantity, comboId, comboType: 'pasta' });
          toppings.forEach(t => { flattenedItems.push({ productId: t.id, quantity: item.quantity, comboId, comboType: 'pasta' }); });
        } else if (item.isCustomAcai && item.acaiSelections) {
          const { tamanho, creme, fruta, complemento, calda } = item.acaiSelections;
          const comboId = `acai-${Date.now()}-${Math.random()}`;
          flattenedItems.push({ productId: tamanho.id, quantity: item.quantity, notes: `Açaí customizado: ${item.name}`, comboId, comboType: 'acai' });
          [creme, fruta, complemento, calda].forEach(arr => {
            arr.forEach(i => { flattenedItems.push({ productId: i.id, quantity: item.quantity, comboId, comboType: 'acai' }); });
          });
        } else if (item.isCustomPizza && item.pizzaSelections) {
          const { tamanho, sabor, borda } = item.pizzaSelections;
          const comboId = `pizza-${Date.now()}-${Math.random()}`;
          flattenedItems.push({ productId: tamanho.id, quantity: item.quantity, notes: `Pizza customizada: ${item.name}`, comboId, comboType: 'pizza' });
          sabor.forEach(s => {
            flattenedItems.push({ productId: s.id, quantity: item.quantity, comboId, comboType: 'pizza' });
          });
          if (borda && borda.id) {
            flattenedItems.push({ productId: borda.id, quantity: item.quantity, comboId, comboType: 'pizza' });
          }
        } else {
          flattenedItems.push({ productId: item.id, quantity: item.quantity, notes: item.notes });
        }
      });

      const finalNotes = paymentMethod === 'cash' && changeFor 
        ? `${notes}\n[Troco para R$ ${changeFor}]`.trim() 
        : notes;
  
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

      const fullAddress = [
        `Rua: ${addressObj.street}`,
        `Nº: ${addressObj.number}`,
        `Bairro: ${addressObj.neighborhood}`,
        addressObj.complement ? `Compl: ${addressObj.complement}` : '',
        `Cidade: ${addressObj.city}`,
        `UF: ${addressObj.state}`,
        `CEP: ${addressObj.cep}`,
        addressObj.reference ? `Ref: ${addressObj.reference}` : ''
      ].filter(Boolean).join(', ');
  
      const orderData = {
        establishmentId: establishment.id,
        items: flattenedItems,
        paymentMethod,
        deliveryAddress: fullAddress,
        userAddress: JSON.stringify(addressObj),
        notes: finalNotes,
      };

      const { data } = await ordersAPI.create(orderData);
      
      if (user) {
        useAuthStore.getState().updateUser({
          ...user,
          address: JSON.stringify(addressObj)
        });
      }

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
              <div key={item.cartId} className="cart-item fade-in">
                <div className="cart-item-emoji">
                  {(() => {
                    const fallback = typeEmoji[establishment?.type] || '🍽️';
                    const emoji = getEmojiByName(item.name, fallback);
                    return isImageEmoji(emoji) ? (
                      <img src={emoji} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      emoji
                    );
                  })()}
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
                    <button className="qty-btn" onClick={() => updateQuantity(item.cartId, item.quantity - 1)}>
                      <Minus size={13} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.cartId, item.quantity + 1)}>
                      <Plus size={13} />
                    </button>
                  </div>
                  <span className="cart-item-total">
                    R$ {(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                  <button className="remove-btn" onClick={() => removeItem(item.cartId)}>
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
                <MapPin size={15} /> Endereço de entrega
              </label>
              <div className="address-grid">
                <div className="col-3">
                  <input
                    type="text"
                    className="input"
                    placeholder="CEP *"
                    value={cep}
                    onChange={handleCepChange}
                    required
                  />
                </div>
                <div className="col-1">
                  <input
                    type="text"
                    className="input"
                    placeholder="UF *"
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                    required
                  />
                </div>
                <div className="col-3">
                  <input
                    type="text"
                    className="input"
                    placeholder="Rua / Avenida *"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>
                <div className="col-1">
                  <input
                    type="text"
                    className="input"
                    placeholder="Nº *"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="col-2">
                  <input
                    type="text"
                    className="input"
                    placeholder="Bairro *"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    required
                  />
                </div>
                <div className="col-2">
                  <input
                    type="text"
                    className="input"
                    placeholder="Complemento"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                  />
                </div>
                <div className="col-2">
                  <input
                    type="text"
                    className="input"
                    placeholder="Cidade *"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="col-2">
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
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'cash' && (
                <div className="checkout-cash-change fade-in" style={{ marginTop: '12px' }}>
                  <label className="checkout-label">Troco para quanto? (Deixe em branco se não precisar)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Ex: 50"
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value)}
                  />
                </div>
              )}
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
