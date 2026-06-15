import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, ShoppingCart, Star
} from 'lucide-react';
import { establishmentsAPI, productsAPI } from '../services/api';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import { getEmojiByName, isImageEmoji } from '../utils/emojiMap';
import { useAuthStore } from '../store/authStore';
import SuggestionsModal from '../components/SuggestionsModal';
import './PizzaBuilder.css';

const STEPS = [
  {
    key: 'tamanho',
    label: 'Tamanho',
    subtitle: 'Escolha a dimensão da sua pizza',
    emoji: '📏',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.16)',
    border: 'rgba(239,68,68,0.45)',
    single: true,
  },
  {
    key: 'sabor',
    label: 'Sabores',
    subtitle: 'Escolha até 3 sabores',
    emoji: '🍕',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.16)',
    border: 'rgba(245,158,11,0.45)',
    single: false,
    max: 3,
  },
  {
    key: 'borda',
    label: 'Borda',
    subtitle: 'Adicione uma borda recheada (Opcional)',
    emoji: '🥯',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.16)',
    border: 'rgba(16,185,129,0.45)',
    single: true,
    required: false,
  },
];

export default function PizzaBuilder({ isEmbedded = false, onClose = null, embeddedEstablishment = null }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const isUserAdmin = user?.role === 'admin';

  const [establishment, setEstablishment] = useState(embeddedEstablishment);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    tamanho: null,
    sabor: [],
    borda: null,
  });
  const [showSummary, setShowSummary] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let est = embeddedEstablishment;
        if (!est) {
          const [estRes] = await Promise.all([establishmentsAPI.getBySlug(slug)]);
          est = estRes.data.data;
        }
        setEstablishment(est);
        const itemsRes = await productsAPI.builderItems(est.id);
        setItems(itemsRes.data.data);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar cardápio');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, embeddedEstablishment]);

  const handleSelect = (stepKey, product, single, max) => {
    if (single) {
      setSelections(prev => ({ ...prev, [stepKey]: product }));
    } else {
      setSelections(prev => {
        const arr = prev[stepKey];
        const exists = arr.find(i => i.id === product.id);
        if (exists) {
          return { ...prev, [stepKey]: arr.filter(i => i.id !== product.id) };
        } else {
          if (max && arr.length >= max) {
            toast.error(`Você pode escolher no máximo ${max} opções.`);
            return prev;
          }
          return { ...prev, [stepKey]: [...arr, product] };
        }
      });
    }
  };

  const calcTotal = () => {
    const { tamanho, sabor, borda } = selections;
    let total = 0;
    if (tamanho) total += parseFloat(tamanho.price);
    if (sabor && sabor.length > 0) {
      const highestSaborPrice = Math.max(...sabor.map(s => parseFloat(s.price)));
      total += highestSaborPrice;
    }
    if (borda) total += parseFloat(borda.price);
    return total;
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleBack = () => {
    if (showSummary) { setShowSummary(false); return; }
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleAddToCart = () => {
    if (isUserAdmin) {
      toast.error('Administradores não podem realizar pedidos.');
      return;
    }
    const { tamanho, sabor, borda } = selections;
    
    const saboresText = sabor.map(s => s.name).join(', ');
    const compositeProduct = {
      id: `pizza-${Date.now()}`,
      name: `Pizza ${tamanho.name.split(' ')[0]}`,
      description: `${saboresText} ${borda && borda.name !== 'Sem Borda' ? `• Borda: ${borda.name}` : '• Sem Borda Recheada'}`,
      price: calcTotal(),
      isCustomPizza: true,
      pizzaSelections: { tamanho, sabor, borda: borda || { name: 'Sem Borda', price: 0 } },
    };

    addItem(compositeProduct, establishment);
    toast.success('Sua pizza foi adicionada ao carrinho! 🍕', { duration: 2500 });
    
    const hasSuggestions = establishment?.categories?.some(cat => {
      const catName = cat.name.toLowerCase();
      const isSugCat = catName.includes('bebida') || catName.includes('suco') || catName.includes('refrigerante') || catName.includes('água') || catName.includes('drink') ||
                       catName.includes('sobremesa') || catName.includes('doce') || catName.includes('chocolate') || catName.includes('sorvete') || catName.includes('milkshake') ||
                       catName.includes('acompanhamento') || catName.includes('porção') || catName.includes('entrada') || catName.includes('batata') || catName.includes('side') || catName.includes('onion');
      return isSugCat && cat.products?.some(p => (!p.builderRole || p.builderRole === 'none') && p.available !== false);
    });

    if (hasSuggestions) {
      setIsSuggestionsOpen(true);
    } else {
      if (isEmbedded && onClose) {
        onClose();
      } else {
        navigate('/cart');
      }
    }
  };

  if (loading) return <div className="pb-loading"><div className="pb-loading-spinner">🍕</div></div>;

  const step = STEPS[currentStep];
  const stepItems = items?.[step?.key] || [];
  const total = calcTotal();

  if (showSummary) {
    const { tamanho, sabor, borda } = selections;
    return (
      <div className="pb-page pizza-theme">
        <div className="container pb-container">
          <button className="pb-back-btn" onClick={handleBack}><ArrowLeft size={16} /> Editar</button>
          <div className="pb-summary scale-in">
            <div className="pb-summary-header pizza-gradient">
              <div className="pb-summary-icon">🍕</div>
              <h1>Pizza no Forno!</h1>
              <p>Confira os detalhes do seu pedido</p>
            </div>
            <div className="pb-summary-items">
              <div className="pb-summary-row" style={{ borderColor: '#EF444430' }}>
                <div className="pb-summary-row-left">
                  <span className="pb-summary-emoji">
                    {tamanho.image ? (
                       <img src={tamanho.image} alt={tamanho.name} style={{width:'1em', height:'1em', objectFit:'contain'}} />
                    ) : isImageEmoji(getEmojiByName(tamanho.name, '📏'))
                      ? <img src={getEmojiByName(tamanho.name, '📏')} alt={tamanho.name} style={{width:'1em', height:'1em', objectFit:'contain'}} />
                      : getEmojiByName(tamanho.name, '📏')}
                  </span>
                  <div><span className="pb-summary-cat" style={{color: '#EF4444'}}>Tamanho</span><span className="pb-summary-name">{tamanho.name}</span></div>
                </div>
                <span className="pb-summary-price">R$ {parseFloat(tamanho.price).toFixed(2)}</span>
              </div>
              
              {sabor.length > 0 && (
                <div className="pb-summary-group">
                  <span className="pb-summary-cat" style={{ color: '#F59E0B' }}>🍕 Sabores (até 3)</span>
                  {sabor.map(s => (
                    <div key={s.id} className="pb-summary-row pb-topping-row">
                      <div className="pb-summary-row-left">
                        <span className="pb-summary-emoji">
                          {s.image ? (
                            <img src={s.image} alt={s.name} style={{width:'1em', height:'1em', objectFit:'contain'}} />
                          ) : isImageEmoji(getEmojiByName(s.name, '🍕'))
                            ? <img src={getEmojiByName(s.name, '🍕')} alt={s.name} style={{width:'1em', height:'1em', objectFit:'contain'}} />
                            : getEmojiByName(s.name, '🍕')}
                        </span>
                        <span className="pb-summary-name">{s.name}</span>
                      </div>
                      <span className="pb-summary-price">{parseFloat(s.price) === 0 ? 'Incluso' : `Maior valor (R$ ${parseFloat(s.price).toFixed(2)})`}</span>
                    </div>
                  ))}
                  {sabor.length > 1 && (
                    <div className="pb-summary-row pb-topping-row" style={{ marginTop: '4px', opacity: 0.7 }}>
                      <div className="pb-summary-row-left"><span className="pb-summary-emoji">ℹ️</span><span className="pb-summary-name" style={{fontSize: '11px'}}>Cobrado pelo sabor de maior valor</span></div>
                    </div>
                  )}
                </div>
              )}

              {borda && (
                <div className="pb-summary-row" style={{ borderColor: '#10B98130' }}>
                  <div className="pb-summary-row-left">
                    <span className="pb-summary-emoji">
                      {borda.image ? (
                        <img src={borda.image} alt={borda.name} style={{width:'1em', height:'1em', objectFit:'contain'}} />
                      ) : isImageEmoji(getEmojiByName(borda.name, '🥯'))
                        ? <img src={getEmojiByName(borda.name, '🥯')} alt={borda.name} style={{width:'1em', height:'1em', objectFit:'contain'}} />
                        : getEmojiByName(borda.name, '🥯')}
                    </span>
                    <div><span className="pb-summary-cat" style={{color: '#10B981'}}>Borda</span><span className="pb-summary-name">{borda.name}</span></div>
                  </div>
                  <span className="pb-summary-price">{parseFloat(borda.price) === 0 ? 'Incluso' : `R$ ${parseFloat(borda.price).toFixed(2)}`}</span>
                </div>
              )}
            </div>
            <div className="pb-summary-total"><span>Total</span><span className="pb-total-value">R$ {total.toFixed(2)}</span></div>
            {!isUserAdmin && (
              <button className="btn btn-primary btn-lg pb-cart-btn pizza-btn" onClick={handleAddToCart}>
                <ShoppingCart size={20} /> Adicionar ao carrinho
              </button>
            )}
          </div>
        </div>
        <SuggestionsModal 
          isOpen={isSuggestionsOpen} 
          onClose={isEmbedded && onClose ? onClose : () => navigate('/cart')} 
          establishment={establishment}
          onGoToCart={() => navigate('/cart')}
          onContinue={isEmbedded && onClose ? onClose : () => navigate(`/store/${slug}`)}
        />
      </div>
    );
  }

  return (
    <div className="pb-page pizza-theme">
      <div className="container pb-container">
        <div className="pb-header">
          {isEmbedded ? (
            <button onClick={onClose} className="pb-back-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={16} /> Voltar
            </button>
          ) : (
            <Link to={`/store/${slug}`} className="pb-back-btn"><ArrowLeft size={16} /> Voltar</Link>
          )}
          <div className="pb-title-row">
            <div>
              <h1 className="pb-title pizza-text-gradient">Monte sua Pizza</h1>
              <p className="pb-subtitle">{establishment?.name} · {total > 0 ? 'Quase pronta!' : 'Comece pelo tamanho'}</p>
            </div>
            <div className="pb-running-total"><span>Total</span><strong>R$ {total.toFixed(2)}</strong></div>
          </div>
        </div>

        <div className="pb-stepper">
          {STEPS.map((s, i) => {
            const isDone = s.single ? selections[s.key] : selections[s.key] && selections[s.key].length > 0;
            return (
              <button key={s.key} className={`pb-step ${i === currentStep ? 'active' : ''} ${isDone ? 'done' : ''}`}
                style={i === currentStep ? { borderColor: s.color, background: s.bg } : {}} onClick={() => setCurrentStep(i)}>
                <div className="pb-step-dot" style={i === currentStep || isDone ? { background: s.color } : {}}>
                  {isDone ? <Check size={12} /> : <span>{i + 1}</span>}
                </div>
                <div className="pb-step-label"><span className="pb-step-emoji">{s.emoji}</span><span>{s.label}</span></div>
              </button>
            );
          })}
        </div>

        <div className="pb-content fade-in" key={currentStep}>
          <div className="pb-step-header" style={{ borderColor: step.border, background: step.bg }}>
            <span className="pb-step-emoji-lg">{step.emoji}</span>
            <div><h2 className="pb-step-title" style={{ color: step.color }}>{step.label}</h2><p className="pb-step-sub">{step.subtitle}</p></div>
            {!step.single && <span className="pb-multi-badge pizza-badge" style={{background: step.color + '20', color: step.color}}>Até {step.max} opções</span>}
          </div>
          <div className="pb-options-grid">
            {stepItems.map(product => {
              const isSelected = step.single ? selections[step.key]?.id === product.id : selections[step.key].some(i => i.id === product.id);
              return (
                <button key={product.id} className={`pb-option ${isSelected ? 'selected' : ''}`}
                  style={isSelected ? { borderColor: step.color, background: step.bg } : {}} onClick={() => handleSelect(step.key, product, step.single, step.max)}>
                  {product.featured && <div className="pb-option-star"><Star size={10} fill="#FFB800" color="#FFB800" /></div>}
                  <div className="pb-option-emoji">
                    {product.image ? (
                       <img src={product.image} alt={product.name} style={{width:'1em', height:'1em', objectFit:'contain'}} />
                    ) : isImageEmoji(getEmojiByName(product.name, step.emoji))
                      ? <img src={getEmojiByName(product.name, step.emoji)} alt={product.name} style={{width:'1em', height:'1em', objectFit:'contain'}} />
                      : getEmojiByName(product.name, step.emoji)}
                  </div>
                  <div className="pb-option-body"><span className="pb-option-name">{product.name}</span><span className="pb-option-desc">{product.description}</span></div>
                  <div className="pb-option-price">{parseFloat(product.price) === 0 ? <span className="pb-free">Grátis</span> : `R$ ${parseFloat(product.price).toFixed(2)}`}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-nav">
          {currentStep > 0 ? <button className="btn btn-primary pb-nav-btn" onClick={handleBack}><ArrowLeft size={16} /> Anterior</button> : <div />}
          <button className="btn btn-primary pb-nav-btn pizza-btn" onClick={handleNext} disabled={step.required !== false && (!selections[step.key] || (Array.isArray(selections[step.key]) && selections[step.key].length === 0))}>
            {currentStep < STEPS.length - 1 ? (
              (step.required === false && (!selections[step.key] || selections[step.key].length === 0)) ? <>Pular etapa <ArrowRight size={16} /></> : <>Próximo <ArrowRight size={16} /></>
            ) : (
              (step.required === false && (!selections[step.key] || selections[step.key].length === 0)) ? <>Ir sem borda <Check size={16} /></> : <>Ver resumo <Check size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
