import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Edit3, Trash2, Eye, EyeOff, Layout, Palette, MessageCircle, ChefHat } from 'lucide-react';
import { establishmentsAPI, productsAPI, categoriesAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductFormModal from '../components/ProductFormModal';
import './StorePage.css'; // reuse styling

// Builder only categories defined in StorePage
const BUILDER_ONLY_CATEGORIES = ['Massas', 'Molhos', 'Proteínas', 'Toppings'];

export default function BuilderMenu() {
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { slug } = useParams();
  const [establishment, setEstablishment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const { data } = await establishmentsAPI.getBySlug(slug);
      setEstablishment(data.data);
    } catch (err) {
      toast.error('Falha ao carregar estabelecimento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [slug]);

  // filter only builder categories and their products
  const builderCategories = useMemo(() => {
    if (!establishment) return [];
    return (establishment.categories || [])
      .filter(c => BUILDER_ONLY_CATEGORIES.includes(c.name))
      .map(c => ({
        ...c,
        products: c.products?.filter(p => p.builderRole && p.builderRole !== 'none') || []
      }))
      .filter(c => c.products.length > 0);
  }, [establishment]);

  // set first available category as active
  useEffect(() => {
    if (builderCategories.length > 0) {
      setActiveCategory(prev =>
        builderCategories.some(c => c.id === prev) ? prev : builderCategories[0].id
      );
    } else {
      setActiveCategory(null);
    }
  }, [builderCategories]);

  if (loading) {
    return (
      <div className="store-loading"><p>Carregando...</p></div>
    );
  }

  if (!establishment) {
    return (
      <div className="store-not-found">
        <p>Estabelecimento não encontrado.</p>
        <Link to="/" className="btn btn-primary">Voltar</Link>
      </div>
    );
  }

  const activeCat = builderCategories.find(c => c.id === activeCategory);

  return (
    <div className="store-page builder-menu">
      {/* Header */}
      <div className="store-cover">
          <Link to={`/store/${slug}`} className="back-btn">
            <ArrowLeft size={18} /> Voltar ao Cardápio
          </Link>
          <h1>{establishment.name} – Monte o Seu</h1>
          <button className="btn btn-primary" onClick={() => { setSelectedProduct(null); setIsProductModalOpen(true); }} style={{ marginTop: '12px' }}>
            <Plus size={16} /> Novo Item
          </button>
        </div>

      {/* Category tabs */}
      <div className="cat-tabs-wrapper">
        <div className="cat-tabs">
          {builderCategories.map(cat => (
            <button
              key={cat.id}
              className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.icon} {cat.name} <span className="cat-count">{cat.products?.length || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      {activeCat && (
          <div className="products-section">
            <div className="products-grid">
              {activeCat.products.map(product => (
                <div key={product.id} className="builder-product-wrapper" style={{ position: 'relative' }}>
                  <ProductCard product={product} establishment={establishment} isAdminMode={false} />
                  <div className="builder-action-overlay" style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                    <button className="btn btn-ghost btn-sm" title="Editar" onClick={() => { setSelectedProduct(product); setIsProductModalOpen(true); }}>
                      <Edit3 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-sm" title="Excluir" onClick={async () => {
                      if (window.confirm('Deseja excluir este item?')) {
                        try {
                          await productsAPI.delete(product.id);
                          toast.success('Item excluído');
                          fetchStoreData();
                        } catch (e) {
                          toast.error('Erro ao excluir item');
                        }
                      }
                    }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      {isProductModalOpen && (
        <ProductFormModal
          product={selectedProduct}
          categories={establishment?.categories || []}
          establishmentId={establishment?.id}
          defaultBuilderRole={selectedProduct ? selectedProduct.builderRole : 'topping'}
          onClose={() => setIsProductModalOpen(false)}
          onSave={fetchStoreData}
        />
      )}
    </div>
  );
}
