import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, ShoppingCart, Star
} from 'lucide-react';
import { establishmentsAPI, productsAPI } from '../services/api';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import './PizzaBuilder.css';

const STEPS = [
  {
    key: 'tamanho',
    label: 'Tamanho',
    subtitle: 'Escolha a dimensão da sua pizza',
    emoji: '📏',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    single: true,
  },
  {
    key: 'sabor',
    label: 'Sabores',
    subtitle: 'Escolha o sabor da sua pizza',
    emoji: '🍕',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    single: true, // Por enquanto 1 sabor, mas podemos expandir para meio a meio
  },
  {
    key: 'borda',
    label: 'Borda',
    subtitle: 'Adicione uma borda recheada',
    emoji: '🥯',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
    single: true,
  },
];

const PIZZA_EMOJIS = {
  'Pizza P (4 Fatias)': '🍕', 'Pizza M (6 Fatias)': '🍕', 'Pizza G (8 Fatias)': '🍕',
  'Calabresa Tradicional': '🍕', 'Marguerita Especial': '🍅', 'Carne de Sol com Nata': '🥩',
  'Frango com Catupiry': '🍗', 'Quatro Queijos': '🧀',
  'Sem Borda Recheada': '🥖', 'Borda de Catupiry': '🥯', 'Borda de Cheddar': '🥯', 'Borda de Chocolate': '🍫',
};

export default function PizzaBuilder() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    tamanho: null,
    sabor: null,
    borda: null,
  });
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [estRes] = await Promise.all([establishmentsAPI.getBySlug(slug)]);
        const est = estRes.data.data;
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
  }, [slug]);

  const handleSelect = (stepKey, product) => {
    setSelections(prev => ({ ...prev, [stepKey]: product }));
  };

  const calcTotal = () => {
    const { tamanho, sabor, borda } = selections;
    let total = 0;
    if (tamanho) total += parseFloat(tamanho.price);
    if (sabor) total += parseFloat(sabor.price);
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
    const { tamanho, sabor, borda } = selections;
    
    const compositeProduct = {
      id: `pizza-${Date.now()}`,
      name: `${sabor.name}`,
      description: `${tamanho.name} ${borda.name !== 'Sem Borda Recheada' ? `• Borda: ${borda.name}` : ''}`,
      price: calcTotal(),
      isCustomPizza: true,
      pizzaSelections: { tamanho, sabor, borda },
    };

    addItem(compositeProduct, establishment);
    toast.success('Sua pizza foi adicionada ao carrinho! 🍕', { duration: 2500 });
    navigate('/cart');
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
              {[
                { label: 'Tamanho', emoji: '📏', item: tamanho, color: '#EF4444' },
                { label: 'Sabor', emoji: '🍕', item: sabor, color: '#F59E0B' },
                { label: 'Borda', emoji: '🥯', item: borda, color: '#10B981' },
              ].map(({ label, emoji, item, color }) => item && (
                <div key={label} className="pb-summary-row" style={{ borderColor: `${color}30` }}>
                  <div className="pb-summary-row-left">
                    <span className="pb-summary-emoji">{PIZZA_EMOJIS[item.name] || emoji}</span>
                    <div><span className="pb-summary-cat" style={{color}}>{label}</span><span className="pb-summary-name">{item.name}</span></div>
                  </div>
                  <span className="pb-summary-price">{parseFloat(item.price) === 0 ? 'Incluso' : `R$ ${parseFloat(item.price).toFixed(2)}`}</span>
                </div>
              ))}
            </div>
            <div className="pb-summary-total"><span>Total</span><span className="pb-total-value">R$ {total.toFixed(2)}</span></div>
            <button className="btn btn-primary btn-lg pb-cart-btn pizza-btn" onClick={handleAddToCart}>
              <ShoppingCart size={20} /> Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-page pizza-theme">
      <div className="container pb-container">
        <div className="pb-header">
          <Link to={`/store/${slug}`} className="pb-back-btn"><ArrowLeft size={16} /> Voltar</Link>
          <div className="pb-title-row">
            <div>
              <h1 className="pb-title pizza-text-gradient">Monte sua Pizza</h1>
              <p className="pb-subtitle">{establishment?.name} · {total > 0 ? 'Quase pronta!' : 'Comece pelo tamanho'}</p>
            </div>
            <div className="pb-running-total"><span>Total</span><strong>R$ {total.toFixed(2)}</strong></div>
          </div>
        </div>

        <div className="pb-stepper">
          {STEPS.map((s, i) => (
            <button key={s.key} className={`pb-step ${i === currentStep ? 'active' : ''} ${selections[s.key] ? 'done' : ''}`}
              style={i === currentStep ? { borderColor: s.color, background: s.bg } : {}} onClick={() => setCurrentStep(i)}>
              <div className="pb-step-dot" style={i === currentStep || selections[s.key] ? { background: s.color } : {}}>
                {selections[s.key] ? <Check size={12} /> : <span>{i + 1}</span>}
              </div>
              <div className="pb-step-label"><span className="pb-step-emoji">{s.emoji}</span><span>{s.label}</span></div>
            </button>
          ))}
        </div>

        <div className="pb-content fade-in" key={currentStep}>
          <div className="pb-step-header" style={{ borderColor: step.border, background: step.bg }}>
            <span className="pb-step-emoji-lg">{step.emoji}</span>
            <div><h2 className="pb-step-title" style={{ color: step.color }}>{step.label}</h2><p className="pb-step-sub">{step.subtitle}</p></div>
          </div>
          <div className="pb-options-grid">
            {stepItems.map(product => {
              const isSelected = selections[step.key]?.id === product.id;
              return (
                <button key={product.id} className={`pb-option ${isSelected ? 'selected' : ''}`}
                  style={isSelected ? { borderColor: step.color, background: step.bg } : {}} onClick={() => handleSelect(step.key, product)}>
                  {product.featured && <div className="pb-option-star"><Star size={10} fill="#FFB800" color="#FFB800" /></div>}
                  <div className="pb-option-emoji">{PIZZA_EMOJIS[product.name] || '🍕'}</div>
                  <div className="pb-option-body"><span className="pb-option-name">{product.name}</span><span className="pb-option-desc">{product.description}</span></div>
                  <div className="pb-option-price">{parseFloat(product.price) === 0 ? <span className="pb-free">Grátis</span> : `R$ ${parseFloat(product.price).toFixed(2)}`}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-nav">
          {currentStep > 0 ? <button className="btn btn-ghost pb-nav-btn" onClick={handleBack}><ArrowLeft size={16} /> Anterior</button> : <div />}
          <button className="btn btn-primary pb-nav-btn pizza-btn" onClick={handleNext} disabled={!selections[step.key]}>
            {currentStep < STEPS.length - 1 ? <>Próximo <ArrowRight size={16} /></> : <>Ver resumo <Check size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
