// src/pages/MenuManagement.jsx
import React, { useState, useMemo, useEffect } from 'react';
import './MenuManagement.css';
import { Plus, Trash2, Edit3, LayoutGrid, Settings2 } from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';

const typeEmoji = {
  acai: 'AC',
  pizza: 'PZ',
  burger: 'BG',
};

// Helper function to detect if a category is part of the custom builder
const isBuilderCategory = (cat) => {
  const nameLower = cat.name.toLowerCase();
  const builderKeywords = [
    'massa', 'molho', 'proteína', 'proteina', 'topping', 
    'tamanho', 'sabor', 'borda', 'creme', 'calda', 
    'complemento', 'fruta', 'ingrediente'
  ];
  const hasKeyword = builderKeywords.some(kw => nameLower.includes(kw));
  const hasBuilderProduct = cat.products && cat.products.some(p => p.builderRole && p.builderRole !== 'none');
  return hasKeyword || hasBuilderProduct;
};

/**
 * Componente de gerenciamento de cardápio (aba "Menu")
 * Recebe diversas callbacks e estados do componente pai (StorePage).
 * Renderiza a lista de categorias na barra lateral filtradas por aba (Pratos vs Ingredientes),
 * permite gerenciar as categorias e produtos de maneira isolada e intuitiva.
 */
export default function MenuManagement({
  establishment,
  activeCategory,
  setActiveCategory,
  handleEditCategory,
  handleDeleteCategory,
  handleAddCategory,
  activecat,
  isImageEmoji,
  getEmojiByName,
  type,
  handleToggleAvailability,
  handleEditProduct,
  handleDeleteProduct,
  setEditingProduct,
  setIsFormOpen,
  menuSubTab,
  setMenuSubTab
}) {
  // Quick add product button (abre modal já existente em StorePage)
  const handleQuickAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };
  
  // Filter categories dynamically based on current tab selection
  const filteredCategories = useMemo(() => {
    if (!establishment || !establishment.categories) return [];
    return establishment.categories.filter(c => {
      const isBuilder = isBuilderCategory(c);
      return menuSubTab === 'ingredients' ? isBuilder : !isBuilder;
    });
  }, [establishment, menuSubTab]);

  // Pagination setup
  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const totalProducts = activecat?.products?.length || 0;
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = activecat?.products?.slice(startIdx, startIdx + itemsPerPage) || [];

  // Reset active category and page when filtered categories change
  useEffect(() => {
    if (filteredCategories.length > 0) {
      const isCurrentValid = filteredCategories.some(c => c.id === activeCategory);
      if (!isCurrentValid) {
        setActiveCategory(filteredCategories[0].id);
      }
    } else {
      setActiveCategory(null);
    }
    setCurrentPage(1);
  }, [filteredCategories, activeCategory, setActiveCategory]);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  return (
    <div className="admin-menu-management">
      {/* Admin view header */}
      <div className="admin-view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2>Gerenciamento do Cardápio</h2>
          <p>Adicione pratos, organize categorias e controle a disponibilidade dos produtos</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => handleAddCategory()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
          >
            <Plus size={16} /> Nova Categoria
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleQuickAdd}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Sub-tab Toggle (Cardápio Principal vs Monte seu) */}
      <div className="menu-subtab-container" style={{ display: 'flex', gap: '12px', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
        <button
          className={`subtab-btn ${menuSubTab === 'dishes' ? 'active' : ''}`}
          onClick={() => setMenuSubTab('dishes')}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: menuSubTab === 'dishes' ? 'rgba(108, 99, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
            background: menuSubTab === 'dishes' ? 'rgba(108, 99, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
            color: menuSubTab === 'dishes' ? '#8B85FF' : '#94A3B8',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <LayoutGrid size={16} /> Cardápio Principal (Pratos e Bebidas)
        </button>
        <button
          className={`subtab-btn ${menuSubTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setMenuSubTab('ingredients')}
          style={{
            padding: '12px 24px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: menuSubTab === 'ingredients' ? 'rgba(108, 99, 255, 0.3)' : 'rgba(255, 255, 255, 0.05)',
            background: menuSubTab === 'ingredients' ? 'rgba(108, 99, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
            color: menuSubTab === 'ingredients' ? '#8B85FF' : '#94A3B8',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Settings2 size={16} /> Ingredientes (Monte o Seu)
        </button>
      </div>

      <div className="admin-management-content">
        {/* Sidebar de Categorias */}
        <aside className="admin-sidebar">
          <div className="sidebar-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <label style={{ margin: 0, fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                {menuSubTab === 'ingredients' ? 'Categorias do Construtor' : 'Categorias de Venda'}
              </label>
            </div>

            <div className="sidebar-items">
              {filteredCategories.map((cat) => (
                <div 
                  key={cat.id} 
                  className={`sidebar-item-container ${activeCategory === cat.id ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '10px', transition: 'all 0.2s ease', border: '1px solid transparent' }}
                >
                  <button
                    className={`sidebar-item ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', padding: '10px 14px', outline: 'none' }}
                  >
                    <span>{cat.icon} {cat.name}</span>
                    <span className="cat-count" style={{ marginLeft: '8px', opacity: 0.6, fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      {cat.products?.length || 0}
                    </span>
                  </button>
                  
                  <div className="category-actions" style={{ display: 'flex', gap: '4px', paddingRight: '8px' }}>
                    <button
                      className="cat-edit-btn"
                      onClick={(e) => { e.stopPropagation(); handleEditCategory(cat); }}
                      title="Renomear Categoria"
                      style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="cat-delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                      title="Excluir Categoria"
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                  Nenhuma categoria cadastrada.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Lista de Produtos */}
        <main className="admin-main-list">
          <div className="admin-list-header">
            <h3>{activecat ? activecat.name : 'Nenhuma categoria selecionada'}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {totalProducts} {totalProducts === 1 ? 'item' : 'itens'}
            </span>
          </div>

          {activecat && activecat.products && activecat.products.length > 0 ? (
            <div className="admin-products-list">
              {paginatedProducts.map((product) => (
                <div key={product.id} className={`admin-list-item ${!product.available ? 'out-of-stock' : ''}`}>
                  <div className="item-main-info">
                    <div className="item-img-placeholder">
                      {product.image ? (
                        <img src={optimizeImage(product.image, 200)} alt={product.name} loading="lazy" />
                      ) : isImageEmoji(getEmojiByName(product.name, typeEmoji[establishment.type])) ? (
                        <img 
                          src={getEmojiByName(product.name, typeEmoji[establishment.type])} 
                          alt={product.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <span>{getEmojiByName(product.name, typeEmoji[establishment.type])}</span>
                      )}
                    </div>
                    
                    <div className="item-text">
                      <h4>{product.name}</h4>
                      <p>{product.description || 'Sem descrição'}</p>
                      <span className="item-price">R$ {parseFloat(product.price).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="item-actions">
                    <button 
                      className={`item-status-btn ${product.available ? 'available' : 'unavailable'}`}
                      onClick={() => handleToggleAvailability(product)}
                    >
                      {product.available ? 'Disponível' : 'Indisponível'}
                    </button>
                    <button className="item-edit-btn" onClick={() => handleEditProduct(product)}>
                      <Edit3 size={12} style={{ marginRight: '4px' }} /> Editar
                    </button>
                    <button className="item-delete-btn" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 size={12} style={{ marginRight: '4px' }} /> Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              Nenhum item cadastrado nesta categoria.
            </div>
          )}

          {/* Controle de Paginação */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                disabled={currentPage === 1}
                className="btn btn-ghost btn-xs"
              >
                Anterior
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`btn btn-xs ${currentPage === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className="btn btn-ghost btn-xs"
              >
                Próximo
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
