import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, Plus, Minus, ShoppingCart,
  ChefHat, Leaf, Flame, Star, Info, Sparkles
} from 'lucide-react';
import { establishmentsAPI, productsAPI } from '../services/api';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import './PastaBuilder.css';

// ── Configuração dos passos ────────────────────────────────
const STEPS = [
  {
    key: 'massa',
    label: 'Massa',
    subtitle: 'Escolha o tipo de massa',
    emoji: '🍝',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    single: true,
  },
  {
    key: 'molho',
    label: 'Molho',
    subtitle: 'Selecione o molho',
    emoji: '🫙',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    single: true,
  },
  {
    key: 'proteina',
    label: 'Proteína',
    subtitle: 'Escolha a proteína',
    emoji: '🍗',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.25)',
    single: true,
  },
  {
    key: 'topping',
    label: 'Toppings',
    subtitle: 'Adicione toppings (opcional)',
    emoji: '🧀',
    color: '#16A34A',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.25)',
    single: false, // múltipla seleção
  },
];

const PASTA_EMOJIS = {
  'Espaguete': '🍝', 'Penne': '🫙', 'Fettuccine': '🍜',
  'Rigatoni': '🥫', 'Farfalle': '🦋', 'Talharim Integral': '🌾',
  'Pomodoro': '🍅', 'Pesto Genovese': '🌿', 'Bolonhesa': '🥩',
  'Alfredo': '🧈', 'Arrabbiata': '🌶️', 'Carbonara': '🥚',
  'Funghi Trifolati': '🍄',
  'Frango Grelhado': '🐔', 'Camarão Salteado': '🦐',
  'Salmão Grelhado': '🐟', 'Carne Moída': '🥩',
  'Linguiça Artesanal': '🌭', 'Sem proteína': '🥦',
  'Parmesão Ralado': '🧀', 'Mussarela de Búfala': '⚪',
  'Tomate Cereja': '🍅', 'Rúcula Fresca': '🥬',
  'Azeitonas Pretas': '🫒', 'Cogumelos Paris': '🍄',
  'Bacon Crocante': '🥓', 'Pimenta Calabresa': '🌶️',
  'Azeite Trufado': '✨',
};

export default function PastaBuilder() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [establishment, setEstablishment] = useState(null);
  const [items, setItems] = useState(null); // { massa: [], molho: [], proteina: [], topping: [] }
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    massa: null,
    molho: null,
    proteina: null,
    topping: [],  // array para múltipla seleção
  });
  const [showSummary, setShowSummary] = useState(false);

  // ── Carregar dados ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [estRes] = await Promise.all([
          establishmentsAPI.getBySlug(slug),
        ]);
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

  // ── Seleção de item ────────────────────────────────────────
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

  // ── Calcular preço total ───────────────────────────────────
  const calcTotal = () => {
    const { massa, molho, proteina, topping } = selections;
    let total = 0;
    if (massa) total += parseFloat(massa.price);
    if (molho) total += parseFloat(molho.price);
    if (proteina) total += parseFloat(proteina.price);
    topping.forEach(t => { total += parseFloat(t.price); });
    return total;
  };

  const isStepValid = () => {
    const step = STEPS[currentStep];
    if (step.single) return !!selections[step.key];
    return true; // toppings são opcionais
  };

  const canAdvance = () => {
    if (showSummary) return false;
    if (currentStep < STEPS.length - 1) return isStepValid();
    return isStepValid();
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

  // ── Adicionar ao carrinho ──────────────────────────────────
  const handleAddToCart = () => {
    const { massa, molho, proteina, topping } = selections;

    // Monta um "produto composto" para o carrinho
    const toppingNames = topping.map(t => t.name).join(', ');
    const compositeProduct = {
      id: `pasta-${Date.now()}`,
      name: `${massa.name} ao ${molho.name}`,
      description: `${proteina.name}${toppingNames ? ` • ${toppingNames}` : ''}`,
      price: calcTotal(),
      isCustomPasta: true,
      // guardar as seleções para exibir no carrinho/pedido
      pastaSelections: { massa, molho, proteina, toppings: topping },
    };

    addItem(compositeProduct, establishment);
    toast.success('Sua massa foi adicionada ao carrinho! 🍝', { duration: 2500 });
    navigate('/cart');
  };

  // ── Loading / not found ────────────────────────────────────
  if (loading) {
    return (
      <div className="pb-loading">
        <div className="pb-loading-inner">
          <div className="pb-loading-spinner">🍝</div>
          <p>Preparando o cardápio...</p>
        </div>
      </div>
    );
  }

  const step = STEPS[currentStep];
  const stepItems = items?.[step?.key] || [];
  const total = calcTotal();
  const stepsCompleted = STEPS.filter(s =>
    s.single ? !!selections[s.key] : true
  ).length;

  // ── SUMMARY VIEW ──────────────────────────────────────────
  if (showSummary) {
    const { massa, molho, proteina, topping } = selections;
    return (
      <div className="pb-page">
        <div className="container pb-container">
          <button className="pb-back-btn" onClick={handleBack}>
            <ArrowLeft size={16} /> Editar
          </button>

          <div className="pb-summary scale-in">
            <div className="pb-summary-header">
              <div className="pb-summary-icon">🍝</div>
              <h1>Sua massa está pronta!</h1>
              <p>Confira os ingredientes antes de adicionar ao carrinho</p>
            </div>

            <div className="pb-summary-items">
              {[
                { label: 'Massa', emoji: '🍝', item: massa, color: '#F59E0B' },
                { label: 'Molho', emoji: '🫙', item: molho, color: '#EF4444' },
                { label: 'Proteína', emoji: '🍗', item: proteina, color: '#8B5CF6' },
              ].map(({ label, emoji, item, color }) => item && (
                <div key={label} className="pb-summary-row" style={{ borderColor: `${color}30` }}>
                  <div className="pb-summary-row-left">
                    <span className="pb-summary-emoji">{PASTA_EMOJIS[item.name] || emoji}</span>
                    <div>
                      <span className="pb-summary-cat" style={{ color }}>{label}</span>
                      <span className="pb-summary-name">{item.name}</span>
                    </div>
                  </div>
                  <span className="pb-summary-price">
                    {parseFloat(item.price) === 0 ? 'Incluso' : `R$ ${parseFloat(item.price).toFixed(2)}`}
                  </span>
                </div>
              ))}

              {topping.length > 0 && (
                <div className="pb-summary-toppings">
                  <span className="pb-summary-cat" style={{ color: '#16A34A' }}>🧀 Toppings</span>
                  <div className="pb-summary-topping-list">
                    {topping.map(t => (
                      <div key={t.id} className="pb-summary-row pb-topping-row">
                        <div className="pb-summary-row-left">
                          <span className="pb-summary-emoji">{PASTA_EMOJIS[t.name] || '🧀'}</span>
                          <span className="pb-summary-name">{t.name}</span>
                        </div>
                        <span className="pb-summary-price">+R$ {parseFloat(t.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pb-summary-total">
              <span>Total do prato</span>
              <span className="pb-total-value">R$ {total.toFixed(2)}</span>
            </div>

            <button className="btn btn-primary btn-lg pb-cart-btn" onClick={handleAddToCart}>
              <ShoppingCart size={20} />
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── BUILDER VIEW ──────────────────────────────────────────
  return (
    <div className="pb-page">
      <div className="container pb-container">

        {/* Header */}
        <div className="pb-header">
          <Link to={`/store/${slug}`} className="pb-back-btn">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <div className="pb-title-row">
            <div>
              <h1 className="pb-title">Monte sua massa</h1>
              <p className="pb-subtitle">
                {establishment?.name} · {STEPS.filter(s => s.single ? !!selections[s.key] : selections.topping.length > 0).length} de {STEPS.length - 1} obrigatórios
              </p>
            </div>
            {total > 0 && (
              <div className="pb-running-total">
                <span>Total</span>
                <strong>R$ {total.toFixed(2)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Stepper */}
        <div className="pb-stepper">
          {STEPS.map((s, i) => {
            const isActive = i === currentStep;
            const isDone = s.single ? !!selections[s.key] : selections.topping.length > 0;
            const isPast = i < currentStep;
            return (
              <button
                key={s.key}
                className={`pb-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
                style={isActive ? { borderColor: s.color, background: s.bg } : {}}
                onClick={() => setCurrentStep(i)}
              >
                <div
                  className="pb-step-dot"
                  style={isDone || isActive ? { background: s.color } : {}}
                >
                  {isDone ? <Check size={12} /> : <span>{i + 1}</span>}
                </div>
                <div className="pb-step-label">
                  <span className="pb-step-emoji">{s.emoji}</span>
                  <span>{s.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="pb-content fade-in" key={currentStep}>
          <div className="pb-step-header" style={{ borderColor: step.border, background: step.bg }}>
            <span className="pb-step-emoji-lg">{step.emoji}</span>
            <div>
              <h2 className="pb-step-title" style={{ color: step.color }}>{step.label}</h2>
              <p className="pb-step-sub">{step.subtitle}</p>
            </div>
            {!step.single && (
              <span className="pb-multi-badge">Múltipla seleção</span>
            )}
          </div>

          <div className="pb-options-grid">
            {stepItems.map(product => {
              const isSelected = step.single
                ? selections[step.key]?.id === product.id
                : selections.topping.some(t => t.id === product.id);
              const emoji = PASTA_EMOJIS[product.name] || step.emoji;

              return (
                <button
                  key={product.id}
                  className={`pb-option ${isSelected ? 'selected' : ''}`}
                  style={isSelected ? {
                    borderColor: step.color,
                    background: step.bg,
                    boxShadow: `0 0 0 1px ${step.color}40, 0 8px 24px rgba(0,0,0,0.3)`
                  } : {}}
                  onClick={() => handleSelect(step.key, product, step.single)}
                >
                  {product.featured && !isSelected && (
                    <div className="pb-option-star">
                      <Star size={10} fill="#FFB800" color="#FFB800" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="pb-option-check" style={{ background: step.color }}>
                      <Check size={13} />
                    </div>
                  )}

                  <div className="pb-option-emoji">{emoji}</div>
                  <div className="pb-option-body">
                    <span className="pb-option-name">{product.name}</span>
                    <span className="pb-option-desc">{product.description}</span>
                  </div>
                  <div className="pb-option-price" style={isSelected ? { color: step.color } : {}}>
                    {parseFloat(product.price) === 0
                      ? <span className="pb-free">Incluso</span>
                      : `R$ ${parseFloat(product.price).toFixed(2)}`}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Toppings counter */}
          {!step.single && selections.topping.length > 0 && (
            <div className="pb-topping-info" style={{ color: step.color, borderColor: step.border, background: step.bg }}>
              <Sparkles size={14} />
              {selections.topping.length} topping{selections.topping.length > 1 ? 's' : ''} selecionado{selections.topping.length > 1 ? 's' : ''}
              {' · '}+R$ {selections.topping.reduce((s, t) => s + parseFloat(t.price), 0).toFixed(2)}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="pb-nav">
          {currentStep > 0 ? (
            <button className="btn btn-ghost pb-nav-btn" onClick={handleBack}>
              <ArrowLeft size={16} /> Anterior
            </button>
          ) : (
            <div />
          )}

          <button
            className="btn btn-primary pb-nav-btn pb-nav-next"
            onClick={handleNext}
            disabled={step.single && !selections[step.key]}
            style={step.single && !selections[step.key] ? {} : {
              background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)`,
              boxShadow: `0 4px 16px ${step.color}40`,
            }}
          >
            {currentStep < STEPS.length - 1 ? (
              <>Próximo <ArrowRight size={16} /></>
            ) : (
              <>Ver resumo <Check size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
