import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { Clock, Calendar, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './OrdersPage.css';

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'pending':
      return { label: 'Pendente', class: 'status-pending' };
    case 'confirmed':
      return { label: 'Confirmado', class: 'status-confirmed' };
    case 'preparing':
      return { label: 'Preparando', class: 'status-preparing' };
    case 'delivering':
      return { label: 'Em entrega', class: 'status-delivering' };
    case 'delivered':
      return { label: 'Entregue', class: 'status-delivered' };
    case 'cancelled':
      return { label: 'Cancelado', class: 'status-cancelled' };
    default:
      return { label: status, class: '' };
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await ordersAPI.list();
        setOrders(data.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar seus pedidos');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="page container">
        <div className="orders-loading">
          <div className="pb-loading-spinner">📦</div>
          <p>Buscando seus pedidos...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="page container">
        <div className="empty-orders-state scale-in">
          <div className="empty-orders-icon">🛍️</div>
          <h2>Você ainda não fez nenhum pedido</h2>
          <p>Que tal explorar as lojas parceiras e fazer a sua primeira compra?</p>
          <Link to="/" className="btn btn-primary btn-lg">
            <ShoppingBag size={18} />
            Explorar cardápios
          </Link>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'delivering'].includes(o.status));
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

  return (
    <div className="page">
      <div className="container orders-container">
        <h1 className="orders-page-title">Meus Pedidos</h1>

        {activeOrders.length > 0 && (
          <section className="orders-section">
            <h2 className="orders-section-title">
              <Clock size={20} className="icon-pulse" /> Pedidos em Andamento
            </h2>
            <div className="orders-list">
              {activeOrders.map(order => {
                const badge = getStatusBadge(order.status);
                const itemsText = order.items?.map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ') || 'Nenhum item';

                return (
                  <div key={order.id} className="order-card active-order-card fade-in">
                    <div className="order-card-header">
                      <div>
                        <h3>{order.establishment?.name}</h3>
                        <span className="order-number-tag">Pedido {order.orderNumber}</span>
                      </div>
                      <span className={`status-badge ${badge.class}`}>{badge.label}</span>
                    </div>

                    <div className="order-card-body">
                      <p className="order-items-preview" title={itemsText}>{itemsText}</p>
                      <div className="order-meta-info">
                        <span><Calendar size={14} /> {formatDate(order.createdAt)}</span>
                        <strong className="order-total-price">R$ {parseFloat(order.total).toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="order-card-actions">
                      <Link to={`/order/${order.id}`} className="btn btn-primary btn-sm tracking-action-btn">
                        Acompanhar pedido <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {pastOrders.length > 0 && (
          <section className="orders-section" style={{ marginTop: activeOrders.length > 0 ? '40px' : '0' }}>
            <h2 className="orders-section-title">Histórico de Pedidos</h2>
            <div className="orders-list">
              {pastOrders.map(order => {
                const badge = getStatusBadge(order.status);
                const itemsText = order.items?.map(i => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ') || 'Nenhum item';

                return (
                  <div key={order.id} className="order-card past-order-card fade-in">
                    <div className="order-card-header">
                      <div>
                        <h3>{order.establishment?.name}</h3>
                        <span className="order-number-tag">Pedido {order.orderNumber}</span>
                      </div>
                      <span className={`status-badge ${badge.class}`}>{badge.label}</span>
                    </div>

                    <div className="order-card-body">
                      <p className="order-items-preview" title={itemsText}>{itemsText}</p>
                      <div className="order-meta-info">
                        <span><Calendar size={14} /> {formatDate(order.createdAt)}</span>
                        <strong className="order-total-price">R$ {parseFloat(order.total).toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="order-card-actions">
                      <Link to={`/order/${order.id}`} className="btn btn-ghost btn-sm">
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
