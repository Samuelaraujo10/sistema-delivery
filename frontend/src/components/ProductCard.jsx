import { Plus, Minus, Clock, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import ProductDetailModal from './ProductDetailModal';
import toast from 'react-hot-toast';
import { getEmojiByName, isImageEmoji } from '../utils/emojiMap';
import { optimizeImage } from '../utils/imageOptimizer';
import { useAuthStore } from '../store/authStore';
import './ProductCard.css';

const typeEmoji = {
  acai: 'AC',
  pizza: 'PZ',
  burger: 'BG',
};

export default function ProductCard({ product, establishment, isAdminMode, onEdit, onDelete, onToggleAvailability }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { items, addItem, updateQuantity } = useCartStore();
  const { cartEstablishment } = useCartStore(s => ({ cartEstablishment: s.establishment }));
  const { user } = useAuthStore();
  const isUserAdmin = user?.role === 'admin';

  const cartItem = items.find(i => i.id === product.id && !i.selectedModifiers);

  const handleAdd = (e) => {
    e.stopPropagation();

    if (product.modifierGroups && product.modifierGroups.length > 0) {
      setModalOpen(true);
      return;
    }

    if (cartEstablishment && cartEstablishment.id !== establishment.id) {
      toast((t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <strong>Limpar carrinho?</strong>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Voce ja tem itens de outro estabelecimento.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { addItem(product, establishment); toast.dismiss(t.id); }}
              style={{ padding: '6px 14px', borderRadius: 8, background: '#FF6B35', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}
            >
              Limpar e adicionar
            </button>
            <button onClick={() => toast.dismiss(t.id)} style={{ padding: '6px 14px', borderRadius: 8, background: '#333', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13 }}>
              Cancelar
            </button>
          </div>
        </div>
      ), { duration: 8000 });
      return;
    }

    addItem(product, establishment);
    toast.success(`${product.name} adicionado!`, { duration: 1500 });
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`product-card ${!product.available ? 'is-unavailable' : ''} ${product.modifierGroups?.length > 0 && !isAdminMode && !isUserAdmin ? 'is-clickable' : ''}`}
        style={{
          '--theme-primary': establishment.primaryColor,
          '--theme-secondary': establishment.secondaryColor || establishment.primaryColor,
        }}
        onClick={() => (product.modifierGroups?.length > 0 && !isAdminMode && !isUserAdmin) ? setModalOpen(true) : null}
      >
        {isAdminMode && (
          <div className="product-admin-overlay">
            <button className="admin-action-btn edit" onClick={(e) => { e.stopPropagation(); onEdit(product); }} title="Editar">
              <Edit3 size={16} />
            </button>
            <button className="admin-action-btn toggle" onClick={(e) => { e.stopPropagation(); onToggleAvailability(product); }} title={product.available ? 'Marcar como Esgotado' : 'Marcar como Disponivel'}>
              {product.available ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button className="admin-action-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(product.id); }} title="Excluir Permanentemente">
              <Trash2 size={16} />
            </button>
          </div>
        )}

        <div className="product-card-image">
          {product.image ? (
            <img src={optimizeImage(product.image, 400)} alt={product.name} loading="lazy" />
          ) : isImageEmoji(getEmojiByName(product.name, typeEmoji[establishment.type])) ? (
            <div className="product-emoji product-emoji-sticker">
              <img 
                src={getEmojiByName(product.name, typeEmoji[establishment.type])} 
                className="product-emoji-sticker-img" 
                alt={product.name} 
                loading="lazy"
              />
            </div>
          ) : (
            <div className="product-emoji">{getEmojiByName(product.name, typeEmoji[establishment.type])}</div>
          )}

          {discount && <span className="product-discount">-{discount}%</span>}
          {product.featured && <span className="product-featured">Destaque</span>}
          {!product.available && <span className="product-unavailable-badge">Esgotado</span>}
        </div>

        <div className="product-card-body">
          <div>
            <h4 className="product-name">{product.name}</h4>
            <p className="product-desc">{product.description}</p>
            <div className="product-meta">
              <span className="product-time"><Clock size={12} /> {product.preparationTime || 15} min</span>
            </div>
          </div>

          <div className="product-footer">
            <div className="product-pricing">
              {product.originalPrice && (
                <span className="product-original">R$ {parseFloat(product.originalPrice).toFixed(2)}</span>
              )}
              <span className="product-price">R$ {parseFloat(product.price).toFixed(2)}</span>
            </div>

            {!isUserAdmin && (
              cartItem ? (
                <div className="product-qty-ctrl">
                  <button
                    className="qty-btn"
                    onClick={(e) => { e.stopPropagation(); updateQuantity(cartItem.cartId, cartItem.quantity - 1); }}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-value">{cartItem.quantity}</span>
                  <button className="qty-btn" onClick={handleAdd}>
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <button className="btn btn-primary" onClick={handleAdd}>
                  <Plus size={16} />
                </button>
              )
            )}
          </div>
        </div>
      </motion.div>

      {modalOpen && (
        <ProductDetailModal
          product={product}
          establishment={establishment}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
