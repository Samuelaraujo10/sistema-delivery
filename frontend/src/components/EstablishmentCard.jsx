import { Link } from 'react-router-dom';
import { Star, Clock, Bike, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getReadableColor } from '../utils/colorUtils';
import './EstablishmentCard.css';

const TYPE_EMOJIS = {
  acai: '🍇',
  pizza: '🍕',
  burger: '🍔',
  sushi: '🍱',
  mexican: '🌮',
  chinese: '🥡',
  bakery: '🥐',
  other: '🍽️',
  massas: '🍝',
  pasta: '🍝',
};

const TYPE_LABELS = {
  acai: 'Açaí',
  pizza: 'Pizzaria',
  burger: 'Hamburgueria',
  sushi: 'Sushi',
  padaria: 'Padaria/Doceria',
  other: 'Variados',
  massas: 'Massas',
};

export default function EstablishmentCard({ establishment }) {
  const { name, slug, type, description, primaryColor, secondaryColor, rating, deliveryTime, deliveryFee, minOrder, isOpen, logo } = establishment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/store/${slug}`} className="est-card">
      <div
        className="est-card-cover"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}22)`,
          borderBottom: `1px solid ${primaryColor}30`,
        }}
      >
        {logo ? (
          <div className="est-card-branded">
            <div className="est-card-blur" style={{ backgroundImage: `url(${logo})` }} />
            <img src={logo} alt={name} className="est-card-main-img" />
          </div>
        ) : (
          <>
            <div className="est-card-emoji">{TYPE_EMOJIS[type] || '🍽️'}</div>
            <div
              className="est-card-glow"
              style={{ background: `radial-gradient(circle, ${primaryColor}40 0%, transparent 70%)` }}
            />
          </>
        )}


        {!isOpen && (
          <div className="est-card-closed">Fechado</div>
        )}
      </div>



      <div className="est-card-body">
        <div className="est-card-header">
          <div>
            <h3 className="est-card-name">{name}</h3>
            <span 
              className="badge badge-primary" 
              style={{ 
                background: getReadableColor(primaryColor).bg, 
                color: getReadableColor(primaryColor).text 
              }}
            >
              {TYPE_LABELS[type]}
            </span>
          </div>
          <div className="est-card-rating">
            <Star size={14} fill="#FFB800" color="#FFB800" />
            <span>{rating || '4.5'}</span>
          </div>
        </div>

        <p className="est-card-desc">{description}</p>

        <div className="est-card-info">
          <span className="est-info-item">
            <Clock size={13} />
            {deliveryTime} min
          </span>
          <span className="est-info-item">
            <Bike size={13} />
            {parseFloat(deliveryFee) === 0 ? 'Grátis' : `R$ ${parseFloat(deliveryFee).toFixed(2)}`}
          </span>
          <span className="est-info-item">
            Min. R$ {parseFloat(minOrder).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="est-card-arrow">
        <ChevronRight size={16} />
      </div>
      </Link>
    </motion.div>
  );
}
