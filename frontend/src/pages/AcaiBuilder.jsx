import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, ShoppingCart, Star, Sparkles
} from 'lucide-react';
import { establishmentsAPI, productsAPI } from '../services/api';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import './AcaiBuilder.css';

const STEPS = [
  {
    key: 'tamanho',
    label: 'Tamanho',
    subtitle: 'Escolha o tamanho do seu copo',
    emoji: '🥤',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.25)',
    single: true,
  },
  {
    key: 'creme',
    label: 'Cremes',
    subtitle: 'Base de açaí com cremes especiais',
    emoji: '🍨',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
    single: false,
  },
  {
    key: 'fruta',
    label: 'Frutas',
    subtitle: 'Selecione as frutas fresquinhas',
    emoji: '🍓',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    single: false,
  },
  {
    key: 'complemento',
    label: 'Complementos',
    subtitle: 'Adicione aquele toque especial',
    emoji: '🥜',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    single: false,
  },
  {
    key: 'calda',
    label: 'Caldas',
    subtitle: 'Para finalizar com chave de ouro',
    emoji: '🍯',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.08)',
    border: 'rgba(236,72,153,0.25)',
    single: false,
  },
];

const ACAI_EMOJIS = {
  'Copo 300ml': '🥤', 'Copo 500ml': '🥤', 'Copo 700ml': '🥤', 'Tigela 1 Litro': '🥣',
  'Banana': '🍌', 'Morango': '🍓', 'Manga': '🥭', 'Kiwi': '🥝',
  'Leite em Pó': '🥛', 'Granola Tradicional': '🥣', 'Paçoca': '🥜', 'M&Ms': '🍫', 'Coco Ralado': '🥥',
  'Castanha de Caju': '🥜', 'Amendoim Triturado': '🥜',
  'Creme de Ninho': '🍦', 'Creme de Morango': '🍓', 'Creme de Cupuaçu': '🍨',
  'Leite Condensado': '🍯', 'Nutella Real': '🍫', 'Mel de Engenho': '🍯',
};

export default function AcaiBuilder() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    tamanho: null,
    creme: [],
    fruta: [],
    complemento: [],
    calda: [],
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

  const handleSelect = (stepKey, product, single) => {
    if (single) {
      setSelections(prev => ({ ...prev, [stepKey]: product }));
    } else {
      setSelections(prev => {
        const arr = prev[stepKey];
        const exists = arr.find(i => i.id === product.id);
        return {
          ...prev,
          [stepKey]: exists ? arr.filter(i => i.id !== product.id) : [...arr, product],
        };
      });
    }
  };

  const calcTotal = () => {
    const { tamanho, creme, fruta, complemento, calda } = selections;
    let total = 0;
    if (tamanho) total += parseFloat(tamanho.price);
    [creme, fruta, complemento, calda].forEach(arr => {
      arr.forEach(i => { total += parseFloat(i.price); });
    });
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
    const { tamanho, creme, fruta, complemento, calda } = selections;
    const extras = [...creme, ...fruta, ...complemento, ...calda].map(i => i.name).join(', ');
    
    const compositeProduct = {
      id: `acai-${Date.now()}`,
      name: `Açaí ${tamanho.name}`,
      description: extras || 'Personalizado do seu jeito',
      price: calcTotal(),
      isCustomAcai: true,
      acaiSelections: { tamanho, creme, fruta, complemento, calda },
    };

    addItem(compositeProduct, establishment);
    toast.success('Seu açaí foi adicionado ao carrinho! 🍇', { duration: 2500 });
    navigate('/cart');
  };

  if (loading) return <div className="pb-loading"><div className="pb-loading-spinner">🍇</div></div>;

  const step = STEPS[currentStep];
  const stepItems = items?.[step?.key] || [];
  const total = calcTotal();

  if (showSummary) {
    return (
      <div className="pb-page acai-theme">
        <div className="container pb-container">
          <button className="pb-back-btn" onClick={handleBack}><ArrowLeft size={16} /> Editar</button>
          <div className="pb-summary scale-in">
            <div className="pb-summary-header acai-gradient">
              <div className="pb-summary-icon">🍇</div>
              <h1>Açaí Perfeito!</h1>
              <p>Confira sua combinação antes de pedir</p>
            </div>
            <div className="pb-summary-items">
              <div className="pb-summary-row" style={{ borderColor: '#7C3AED30' }}>
                <div className="pb-summary-row-left">
                  <span className="pb-summary-emoji">🥤</span>
                  <div><span className="pb-summary-cat" style={{color: '#7C3AED'}}>Tamanho</span><span className="pb-summary-name">{selections.tamanho.name}</span></div>
                </div>
                <span className="pb-summary-price">R$ {parseFloat(selections.tamanho.price).toFixed(2)}</span>
              </div>
              {['creme', 'fruta', 'complemento', 'calda'].map(key => selections[key].length > 0 && (
                <div key={key} className="pb-summary-group">
                  <span className="pb-summary-cat" style={{ color: STEPS.find(s=>s.key===key).color }}>
                    {STEPS.find(s=>s.key===key).emoji} {STEPS.find(s=>s.key===key).label}
                  </span>
                  {selections[key].map(item => (
                    <div key={item.id} className="pb-summary-row pb-topping-row">
                      <div className="pb-summary-row-left">
                        <span className="pb-summary-emoji">{ACAI_EMOJIS[item.name] || '✨'}</span>
                        <span className="pb-summary-name">{item.name}</span>
                      </div>
                      <span className="pb-summary-price">{parseFloat(item.price) === 0 ? 'Grátis' : `+R$ ${parseFloat(item.price).toFixed(2)}`}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="pb-summary-total"><span>Total</span><span className="pb-total-value">R$ {total.toFixed(2)}</span></div>
            <button className="btn btn-primary btn-lg pb-cart-btn acai-btn" onClick={handleAddToCart}>
              <ShoppingCart size={20} /> Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-page acai-theme">
      <div className="container pb-container">
        <div className="pb-header">
          <Link to={`/store/${slug}`} className="pb-back-btn"><ArrowLeft size={16} /> Voltar</Link>
          <div className="pb-title-row">
            <div>
              <h1 className="pb-title acai-text-gradient">Monte seu Açaí</h1>
              <p className="pb-subtitle">{establishment?.name} · {total > 0 ? 'Sua obra de arte' : 'Comece escolhendo o tamanho'}</p>
            </div>
            <div className="pb-running-total"><span>Total</span><strong>R$ {total.toFixed(2)}</strong></div>
          </div>
        </div>

        <div className="pb-stepper">
          {STEPS.map((s, i) => (
            <button key={s.key} className={`pb-step ${i === currentStep ? 'active' : ''} ${selections[s.key]?.id || selections[s.key]?.length > 0 ? 'done' : ''}`}
              style={i === currentStep ? { borderColor: s.color, background: s.bg } : {}} onClick={() => setCurrentStep(i)}>
              <div className="pb-step-dot" style={i === currentStep || selections[s.key]?.id || selections[s.key]?.length > 0 ? { background: s.color } : {}}>
                {selections[s.key]?.id || selections[s.key]?.length > 0 ? <Check size={12} /> : <span>{i + 1}</span>}
              </div>
              <div className="pb-step-label"><span className="pb-step-emoji">{s.emoji}</span><span>{s.label}</span></div>
            </button>
          ))}
        </div>

        <div className="pb-content fade-in" key={currentStep}>
          <div className="pb-step-header" style={{ borderColor: step.border, background: step.bg }}>
            <span className="pb-step-emoji-lg">{step.emoji}</span>
            <div><h2 className="pb-step-title" style={{ color: step.color }}>{step.label}</h2><p className="pb-step-sub">{step.subtitle}</p></div>
            {!step.single && <span className="pb-multi-badge acai-badge">Múltipla seleção</span>}
          </div>
          <div className="pb-options-grid">
            {stepItems.map(product => {
              const isSelected = step.single ? selections[step.key]?.id === product.id : selections[step.key].some(i => i.id === product.id);
              return (
                <button key={product.id} className={`pb-option ${isSelected ? 'selected' : ''}`}
                  style={isSelected ? { borderColor: step.color, background: step.bg } : {}} onClick={() => handleSelect(step.key, product, step.single)}>
                  {product.featured && <div className="pb-option-star"><Star size={10} fill="#FFB800" color="#FFB800" /></div>}
                  <div className="pb-option-emoji">{ACAI_EMOJIS[product.name] || '✨'}</div>
                  <div className="pb-option-body"><span className="pb-option-name">{product.name}</span><span className="pb-option-desc">{product.description}</span></div>
                  <div className="pb-option-price">{parseFloat(product.price) === 0 ? <span className="pb-free">Grátis</span> : `R$ ${parseFloat(product.price).toFixed(2)}`}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pb-nav">
          {currentStep > 0 ? <button className="btn btn-ghost pb-nav-btn" onClick={handleBack}><ArrowLeft size={16} /> Anterior</button> : <div />}
          <button className="btn btn-primary pb-nav-btn acai-btn" onClick={handleNext} disabled={step.single && !selections[step.key]}>
            {currentStep < STEPS.length - 1 ? <>Próximo <ArrowRight size={16} /></> : <>Ver resumo <Check size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
