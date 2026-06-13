import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { reviewsAPI } from '../services/api';
import './ReviewsList.css';
import Skeleton from './Skeleton';

export default function ReviewsList({ establishmentId }) {
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!establishmentId) return;
    
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const { data } = await reviewsAPI.getByEstablishment(establishmentId);
        setReviewsData(data.data);
      } catch (err) {
        console.error('Erro ao buscar avaliações', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [establishmentId]);

  if (loading) {
    return (
      <div className="reviews-section">
        <Skeleton height="150px" />
        <Skeleton height="100px" />
        <Skeleton height="100px" />
      </div>
    );
  }

  if (!reviewsData || reviewsData.totalReviews === 0) {
    return (
      <div className="reviews-empty">
        <p>Ainda não há avaliações para este estabelecimento.</p>
      </div>
    );
  }

  return (
    <div className="reviews-section fade-in">
      <div className="reviews-summary">
        <div className="average-rating">
          <Star size={32} fill="#FFB800" color="#FFB800" />
          <span className="avg-number">{reviewsData.averageRating}</span>
        </div>
        <p className="total-reviews">{reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? 'avaliação' : 'avaliações'}</p>
      </div>

      <div className="reviews-list">
        {reviewsData.reviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <span className="reviewer-name">{review.user?.name || 'Cliente'}</span>
              <span className="review-date">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="review-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={14} 
                  fill={star <= review.rating ? "#FFB800" : "transparent"} 
                  color={star <= review.rating ? "#FFB800" : "var(--border)"} 
                />
              ))}
            </div>
            {review.comment && (
              <p className="review-comment">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
