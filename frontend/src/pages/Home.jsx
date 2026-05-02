import { useState, useEffect } from 'react';
import { Search, ChevronRight, Zap, Star, Clock } from 'lucide-react';
import { establishmentsAPI } from '../services/api';
import EstablishmentCard from '../components/EstablishmentCard';
import EstablishmentSkeleton from '../components/EstablishmentSkeleton';
import './Home.css';

const FILTERS = [
  { key: 'all', label: 'Todos', emoji: '🍽️' },
  { key: 'acai', label: 'Açaí', emoji: '🍇' },
  { key: 'pizza', label: 'Pizza', emoji: '🍕' },
  { key: 'burger', label: 'Burger', emoji: '🍔' },
  { key: 'sushi', label: 'Sushi', emoji: '🍱' },
  { key: 'bakery', label: 'Padaria', emoji: '🥐' },
];

export default function Home() {
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchEstablishments = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filter !== 'all') params.type = filter;
        if (search) params.search = search;
        const { data } = await establishmentsAPI.list(params);
        setEstablishments(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchEstablishments, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search, filter]);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>
        <div className="container hero-content">
          <div className="hero-badge">
            <Zap size={14} fill="currentColor" /> Entrega rápida na sua cidade
          </div>
          <h1 className="hero-title">
            Seu restaurante<br />
            <span className="hero-accent">favorito</span> em casa
          </h1>
          <p className="hero-subtitle">
            Escolha entre centenas de restaurantes e receba seu pedido com agilidade e sabor.
          </p>

          <div className="hero-search">
            <Search size={20} className="search-icon" />
            <input
              className="hero-search-input"
              placeholder="Buscar restaurante ou prato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">200+</span>
              <span className="stat-label">Restaurantes</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">30min</span>
              <span className="stat-label">Tempo médio</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">4.8 ⭐</span>
              <span className="stat-label">Avaliação</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container home-main">
        {/* Filter Pills */}
        <div className="filter-section">
          <h2 className="section-title">Explorar categorias</h2>
          <div className="filter-pills">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-pill ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                <span className="filter-emoji">{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="results-section">
          <div className="results-header">
            <h2 className="section-title">
              {search ? `Resultados para "${search}"` : 'Estabelecimentos'}
            </h2>
            <span className="results-count">
              {establishments.length} {establishments.length === 1 ? 'encontrado' : 'encontrados'}
            </span>
          </div>

          {loading ? (
            <div className="est-grid">
              {[1,2,3,4,5,6].map(i => <EstablishmentSkeleton key={i} />)}
            </div>
          ) : establishments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>Nenhum estabelecimento encontrado</h3>
              <p>Tente outro filtro ou termo de busca</p>
              <button className="btn btn-ghost" onClick={() => { setSearch(''); setFilter('all'); }}>
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="est-grid">
              {establishments.map(est => (
                <EstablishmentCard key={est.id} establishment={est} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
