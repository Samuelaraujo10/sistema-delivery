import React, { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import ProductModifierGroup from './ProductModifierGroup';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import { getEmojiByName, isImageEmoji } from '../utils/emojiMap';
import './ProductDetailModal.css';

const ProductDetailModal = ({ product, establishment, onClose }) => {
  const { addItem } = useCartStore();
  const [selections, setSelections] = useState({});
  const [quantity, setQuantity] = useState(1);

  const handleToggleOption = (group, option) => {
    const groupName = group.name;
    const currentSelections = selections[groupName] || [];
    const isSelected = currentSelections.some(s => s.name === option.name);

    let newSelections;
    if (isSelected) {
      newSelections = currentSelections.filter(s => s.name !== option.name);
    } else {
      if (group.max === 1) {
        newSelections = [option];
      } else if (group.max === 0 || currentSelections.length < group.max) {
        newSelections = [...currentSelections, option];
      } else {
        return; // At max
      }
    }

    setSelections({
      ...selections,
      [groupName]: newSelections
    });
  };

  const calculateTotal = () => {
    let extra = 0;
    Object.values(selections).forEach(groupSelections => {
      groupSelections.forEach(opt => {
        extra += parseFloat(opt.price || 0);
      });
    });
    return (parseFloat(product.price) + extra) * quantity;
  };

  const handleAddToCart = () => {
    // Validate required groups
    for (const group of product.modifierGroups) {
      const groupSelections = selections[group.name] || [];
      if (group.min > 0 && groupSelections.length < group.min) {
        toast.error(`Por favor, escolha ao menos ${group.min} opção para "${group.name}"`);
        return;
      }
    }

    const itemToAdd = {
      ...product,
      selectedModifiers: selections,
      totalPrice: calculateTotal() / quantity // Price per unit with modifiers
    };

    addItem(itemToAdd, establishment, quantity);
    toast.success('Adicionado ao carrinho!');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content product-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-header-image">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : isImageEmoji(getEmojiByName(product.name, '')) ? (
            <div className="modal-image-emoji-container">
              <img 
                src={getEmojiByName(product.name, '')} 
                alt={product.name} 
                className="modal-image-emoji-img" 
              />
            </div>
          ) : (
            <img src={'https://via.placeholder.com/600x300?text=' + product.name} alt={product.name} />
          )}
        </div>

        <div className="modal-body">
          <div className="product-main-info">
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <span className="base-price">A partir de R$ {parseFloat(product.price).toFixed(2)}</span>
          </div>

          <div className="modifiers-section">
            {product.modifierGroups.map((group, idx) => (
              <ProductModifierGroup
                key={idx}
                group={group}
                selections={selections[group.name] || []}
                onToggle={handleToggleOption}
              />
            ))}
          </div>

          <div className="quantity-selector">
            <span>Quantidade</span>
            <div className="qty-controls">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="add-to-cart-big" onClick={handleAddToCart}>
            <div className="btn-content">
              <ShoppingBag size={20} />
              <span>Adicionar</span>
            </div>
            <span className="total-price">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotal())}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
