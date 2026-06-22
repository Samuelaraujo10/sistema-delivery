import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Clock, ChefHat, Bike, Package, XCircle, MessageCircle, Smartphone } from 'lucide-react';
import { ordersAPI } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import socket from '../services/socket';
import './OrderTrackingPage.css';
import { generatePixPayload } from '../utils/pix';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pedido recebido', icon: Package, color: '#6C63FF' },
  { key: 'confirmed', label: 'Confirmado', icon: CheckCircle, color: '#00C853' },
  { key: 'preparing', label: 'Preparando', icon: ChefHat, color: '#FF8C00' },
  { key: 'delivering', label: 'Saiu para entrega', icon: Bike, color: '#00D9A6' },
  { key: 'delivered', label: 'Entregue!', icon: CheckCircle, color: '#00C853' },
];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const pixPayload = order && order.paymentMethod === 'pix' && order.establishment?.pixKey
    ? generatePixPayload({
        key: order.establishment.pixKey,
        merchantName: order.establishment.name || 'Loja',
        merchantCity: order.establishment.address || 'São Paulo',
        amount: order.total,
        txid: `PEDIDO${order.orderNumber || order.id.slice(-4)}`
      })
    : '';

  const handleCopyPix = () => {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload);
      toast.success('Código Pix Copia e Cola copiado!');
    } else {
      toast.error('Chave Pix não configurada pelo estabelecimento.');
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await ordersAPI.get(id);
        setOrder(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    // Conectando via Socket.io
    socket.connect();

    const handleStatusUpdated = (updatedOrder) => {
      if (updatedOrder.id === id) {
        setOrder(updatedOrder);

        const statusMap = {
          confirmed: 'Confirmado e aceito! 🍳',
          preparing: 'Em preparo na cozinha! 👨‍🍳',
          delivering: 'Saiu para entrega! 🛵',
          delivered: 'Entregue! Bom apetite! 🎉',
          cancelled: 'Pedido cancelado ou recusado. ❌'
        };
        toast(statusMap[updatedOrder.status] || `Status atualizado: ${updatedOrder.status}`, {
          icon: '🔔',
          duration: 4000
        });
      }
    };

    socket.on('order_status_updated_global', handleStatusUpdated);

    // Mantemos um polling de segurança com intervalo maior
    const interval = setInterval(fetchOrder, 20000);

    return () => {
      socket.off('order_status_updated_global', handleStatusUpdated);
      clearInterval(interval);
    };
  }, [id]);



  if (loading) {
    return (
      <div className="page container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 200 }} />
          <div className="skeleton" style={{ height: 100 }} />
          <div className="skeleton" style={{ height: 100 }} />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page container">
        <div className="empty-state">
          <div className="empty-icon">😔</div>
          <h3>Pedido não encontrado</h3>
          <Link to="/" className="btn btn-primary">Voltar ao início</Link>
        </div>
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  const getWhatsAppLink = () => {
    const contactPhone = order?.establishment?.whatsapp || order?.establishment?.phone;
    if (!contactPhone) return '#';
    const phone = contactPhone.replace(/\D/g, ''); // Keep only numbers
    // Adiciona código do país se não tiver (assumindo 55 para BR)
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const message = encodeURIComponent(`Olá! Sou o cliente do pedido #${order.orderNumber}. Gostaria de falar sobre o meu pedido.`);
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  const formatPhone = (raw) => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };


  return (
    <div className="page">
      <div className="container tracking-layout">
        {/* Status Card */}
        <div className="tracking-main">
          <div className="tracking-header">
            <div className="tracking-number">
              <span>Pedido</span>
              <strong>{order.orderNumber}</strong>
            </div>
            <Link to={`/store/${order.establishment?.slug}`} className="tracking-store">
              {order.establishment?.name}
            </Link>
          </div>

          {isCancelled ? (
            <div className="tracking-cancelled">
              <XCircle size={48} color="var(--danger)" />
              <h2>Pedido Cancelado</h2>
              <p>Seu pedido foi cancelado.</p>
              <Link to="/" className="btn btn-primary">Fazer novo pedido</Link>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="tracking-progress">
                {STATUS_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isDone = index <= currentStatusIndex;
                  const isActive = index === currentStatusIndex;

                  return (
                    <div key={step.key} className={`progress-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                      <div
                        className="step-icon"
                        style={isDone ? { background: step.color, boxShadow: `0 0 20px ${step.color}50` } : {}}
                      >
                        <Icon size={18} color={isDone ? 'white' : 'var(--text-subtle)'} />
                        {isActive && <div className="step-pulse" style={{ background: step.color }} />}
                      </div>
                      <span className="step-label" style={isActive ? { color: step.color } : {}}>
                        {step.label}
                      </span>
                      {index < STATUS_STEPS.length - 1 && (
                        <div className={`step-line ${index < currentStatusIndex ? 'done' : ''}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="tracking-eta">
                <Clock size={16} />
                <span>
                  {order.status === 'delivered'
                    ? 'Pedido entregue! Bom apetite 🎉'
                    : `Estimativa: ${order.establishment?.deliveryTime || 40} minutos`}
                </span>
              </div>

              <div style={{ marginTop: '16px' }}>
                <a 
                  href={getWhatsAppLink()} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn" 
                  style={{ width: '100%', justifyContent: 'center', background: '#25D366', color: 'white', display: 'flex', gap: '8px', border: 'none' }}
                >
                  <MessageCircle size={18} />
                  Fale com o Restaurante no WhatsApp
                </a>
              </div>

              {order.paymentMethod === 'pix' && (
                <div className="pix-box fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  <div className="pix-box-header">
                    <Smartphone size={20} className="pix-icon" />
                    <h3>Pagamento via Pix</h3>
                  </div>
                  <div className="pix-box-body">
                    <p>
                      Para que seu pedido seja preparado, realize o pagamento no valor de: 
                      <strong className="pix-value"> R$ {parseFloat(order.total).toFixed(2)}</strong>.
                    </p>
                    
                                        {pixPayload ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0', gap: '12px' }}>
                        <QRCodeSVG
                          value={pixPayload}
                          size={180}
                          level="M"
                          includeMargin={true}
                          style={{ border: '12px solid white', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="btn btn-ghost"
                          style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--accent)', color: 'var(--accent)', marginTop: '8px' }}
                        >
                          Copiar Código Copia e Cola
                        </button>
                      </div>
                    ) : (
                      <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '10px 0' }}>
                        ⚠️ Chave Pix não cadastrada por este estabelecimento.
                      </p>
                    )}
                  </div>
                </div>
              )}


            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-summary-card">
          <h3>Resumo do Pedido</h3>

          <div className="order-items-list">
            {order.items?.map(item => (
              <div key={item.id} className="order-item-row">
                <span className="order-item-qty">{item.quantity}x</span>
                <span className="order-item-name">{item.product?.name}</span>
                <span className="order-item-price">R$ {parseFloat(item.totalPrice).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>R$ {parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Entrega</span>
              <span>{parseFloat(order.deliveryFee) === 0 ? 'Grátis' : `R$ ${parseFloat(order.deliveryFee).toFixed(2)}`}</span>
            </div>
            <div className="total-row total-final">
              <span>Total</span>
              <span>R$ {parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>

          {order.deliveryAddress && (
            <div className="order-address">
              <strong>Endereço de entrega:</strong>
              <p>{order.deliveryAddress}</p>
            </div>
          )}

          <Link to="/" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            Fazer novo pedido
          </Link>
        </div>
      </div>
    </div>
  );
}
