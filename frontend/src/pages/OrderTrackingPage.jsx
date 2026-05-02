import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Clock, ChefHat, Bike, Package, XCircle } from 'lucide-react';
import { ordersAPI } from '../services/api';
import './OrderTrackingPage.css';

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
    const interval = setInterval(fetchOrder, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
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
