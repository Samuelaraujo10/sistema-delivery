import React, { forwardRef, useEffect } from 'react';
import './ReceiptPrinter.css';

const ReceiptPrinter = forwardRef(({ order, onPrintDone }, ref) => {
  useEffect(() => {
    // Escuta quando a impressão termina ou é cancelada para limpar o estado
    const afterPrint = () => {
      if (onPrintDone) onPrintDone();
    };

    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, [onPrintDone]);

  if (!order) return null;

  return (
    <div className="receipt-printer-container" ref={ref}>
      <div className="receipt-content">
        <div className="receipt-header">
          {order.establishment?.logoUrl && (
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <img 
                src={order.establishment.logoUrl} 
                alt="Logo" 
                style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'grayscale(100%)' }} 
              />
            </div>
          )}
          <h2>{order.establishment?.name || 'Sistema Delivery'}</h2>
          <p>CNPJ: {order.establishment?.cnpj || '00.000.000/0000-00'}</p>
          <p>{order.establishment?.address || ''}</p>
          <hr />
          <h3>Pedido {order.orderNumber}</h3>
          {order.type === 'dine_in' ? (
            <h3>MESA: {order.tableNumber}</h3>
          ) : (
            <h3>{order.type === 'takeaway' ? 'RETIRADA' : 'DELIVERY'}</h3>
          )}
          <p>{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
        </div>

        <hr />

        <div className="receipt-customer">
          {order.user?.name && <p><strong>Cliente:</strong> {order.user.name}</p>}
          {order.user?.phone && <p><strong>Tel:</strong> {order.user.phone}</p>}
          {order.type === 'delivery' && order.deliveryAddress && (
            <p><strong>Endereço:</strong> {order.deliveryAddress}</p>
          )}
        </div>

        <hr />

        <div className="receipt-items">
          <table className="receipt-table">
            <thead>
              <tr>
                <th align="left">Qtd</th>
                <th align="left">Item</th>
                <th align="right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <React.Fragment key={idx}>
                  <tr>
                    <td>{item.quantity}x</td>
                    <td>{item.product?.name}</td>
                    <td align="right">R$ {parseFloat(item.totalPrice).toFixed(2)}</td>
                  </tr>
                  {item.notes && (
                    <tr>
                      <td></td>
                      <td colSpan="2" className="item-notes">Obs: {item.notes}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <hr />

        <div className="receipt-totals">
          <div className="tot-row">
            <span>Subtotal:</span>
            <span>R$ {parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          {parseFloat(order.deliveryFee) > 0 && (
            <div className="tot-row">
              <span>Taxa Entrega:</span>
              <span>R$ {parseFloat(order.deliveryFee).toFixed(2)}</span>
            </div>
          )}
          <div className="tot-row grand-total">
            <span>TOTAL:</span>
            <span>R$ {parseFloat(order.total).toFixed(2)}</span>
          </div>
          <div className="tot-row">
            <span>Pagamento:</span>
            <span>{order.paymentMethod?.toUpperCase()}</span>
          </div>
        </div>

        <hr />

        <div className="receipt-footer">
          <p>Obrigado pela preferência!</p>
          <p>Volte sempre!</p>
        </div>
      </div>
    </div>
  );
});

export default ReceiptPrinter;
