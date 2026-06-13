import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { reviewsAPI } from '../services/api';
import './ReviewFormModal.css';

export default function ReviewFormModal({ isOpen, onClose, order, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se order.product_id existir, avaliamos o produto. Se não, avaliamos a loja.
  // Vamos assumir que avaliaremos a loja inteira a partir do pedido.
  
  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Por favor, selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewsAPI.create({
        order_id: order.id,
        establishment_id: order.establishment_id || order.establishment?.id,
        rating,
        comment
      });
      toast.success('Avaliação enviada com sucesso!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao enviar avaliação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content review-modal">
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        
        <h2>Avaliar Pedido #{order.orderNumber || order.id.slice(-4)}</h2>
        <p className="review-subtitle">Como foi sua experiência com o estabelecimento?</p>
        
        <form onSubmit={handleSubmit} className="review-form">
          <div className="stars-container">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                type="button"
                key={star}
                className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star size={36} fill={star <= (hoverRating || rating) ? "#FFB800" : "transparent"} color={star <= (hoverRating || rating) ? "#FFB800" : "var(--border)"} />
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>Comentário (opcional)</label>
            <textarea
              placeholder="O que você achou do pedido?"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="review-textarea"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
