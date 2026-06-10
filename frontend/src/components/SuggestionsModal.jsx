import { useState, useMemo } from 'react';
import { ShoppingCart, ArrowRight, Check, X, Sparkles } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { getEmojiByName, isImageEmoji } from '../utils/emojiMap';
import toast from 'react-hot-toast';
import './SuggestionsModal.css';

export default function SuggestionsModal({ isOpen, onClose, establishment, onGoToCart, onContinue }) {
  const { addItem } = useCartStore();
  const [addedItems, setAddedItems] = useState({}); // Track added item IDs

  const suggestions = useMemo(() => {
    if (!establishment || !establishment.categories) return [];
    const list = [];
    establishment.categories.forEach(cat => {
      const catName = cat.name.toLowerCase();
      const isBeverage = catName.includes('bebida') || catName.includes('suco') || catName.includes('refrigerante') || catName.includes('água') || catName.includes('drink');
      const isDessert = catName.includes('sobremesa') || catName.includes('doce') || catName.includes('chocolate') || catName.includes('sorvete') || catName.includes('milkshake');
      const isSide = catName.includes('acompanhamento') || catName.includes('porção') || catName.includes('entrada') || catName.includes('batata') || catName.includes('side') || catName.includes('onion');

      if (isBeverage || isDessert || isSide) {
        cat.products?.forEach(prod => {
          if ((!prod.builderRole || prod.builderRole === 'none') && prod.available !== false) {
            list.push({
              ...prod,
              categoryName: cat.name,
              type: isBeverage ? 'bebida' : isDessert ? 'sobremesa' : 'acompanhamento'
            });
          }
        });
      }
    });
    // Shuffle and get up to 3 suggestions
    return list.sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [establishment]);

  if (!isOpen || suggestions.length === 0) return null;

  const handleAdd = (product) => {
    addItem(product, establishment);
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    toast.success(`${product.name} adicionado ao carrinho! 🛒`, { duration: 2000 });
  };

  const getSuggestionEmoji = (item) => {
    if (item.type === 'bebida') return getEmojiByName(item.name, '🥤');
    if (item.type === 'sobremesa') return getEmojiByName(item.name, '🍰');
    return getEmojiByName(item.name, '🍟');
  };

  return (
    <div className="suggestions-overlay">
      <div className="suggestions-card scale-in">
        <button className="suggestions-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="suggestions-header">
          <div className="suggestions-icon-wrap">
            <Sparkles size={24} className="suggestions-sparkle" />
          </div>
          <h2>Que tal acompanhar?</h2>
          <p>Adicione uma bebida, acompanhamento ou sobremesa do <strong>{establishment?.name}</strong> ao seu pedido!</p>
        </div>

        <div className="suggestions-list">
          {suggestions.map(item => {
            const isAdded = !!addedItems[item.id];
            const emoji = getSuggestionEmoji(item);
            const isImgEmoji = isImageEmoji(emoji);

            return (
              <div key={item.id} className="suggestion-item">
                <div className="suggestion-item-left">
                  {item.image ? (
                    <div className="suggestion-image-wrap">
                      <img src={item.image} alt={item.name} className="suggestion-product-img" />
                    </div>
                  ) : isImgEmoji ? (
                    <div className="suggestion-emoji suggestion-emoji-sticker">
                      <img src={emoji} className="suggestion-emoji-sticker-img" alt={item.name} />
                    </div>
                  ) : (
                    <div className="suggestion-emoji">{emoji}</div>
                  )}
                  
                  <div className="suggestion-details">
                    <h4>{item.name}</h4>
                    <p>{item.description}</p>
                    <span className="suggestion-price">R$ {parseFloat(item.price).toFixed(2)}</span>
                  </div>
                </div>
                
                <button 
                  className={`btn btn-sm suggestion-btn ${isAdded ? 'btn-ghost added' : 'btn-primary'}`}
                  onClick={() => !isAdded && handleAdd(item)}
                  disabled={isAdded}
                >
                  {isAdded ? (
                    <>
                      <Check size={14} /> Adicionado
                    </>
                  ) : (
                    <>
                      Adicionar +
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="suggestions-footer">
          <button className="btn btn-ghost suggestions-btn-continue" onClick={onContinue}>
            Continuar comprando
          </button>
          <button className="btn btn-primary suggestions-btn-cart" onClick={onGoToCart}>
            Ver Carrinho <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
