import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { productsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import '../pages/AdminDashboard.css'; // Corrected path

const ProductFormModal = ({ product, categories, establishmentId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    categoryId: categories[0]?.id || '',
    establishmentId: establishmentId,
    builderRole: 'none',
    modifierGroups: [],
    available: true,
    featured: false
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        originalPrice: product.originalPrice || '',
        image: product.image || '',
        categoryId: product.categoryId,
        establishmentId: product.establishmentId,
        builderRole: product.builderRole || 'none',
        modifierGroups: product.modifierGroups || [],
        available: product.available,
        featured: product.featured || false
      });
    }
  }, [product, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (product) {
        await productsAPI.update(product.id, formData);
        toast.success('Produto atualizado!');
      } else {
        await productsAPI.create(formData);
        toast.success('Produto criado!');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>{product ? 'Editar Item' : 'Novo Item'}</h2>
          <button className="close-modal" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label>Nome do Item</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              required
              placeholder="Ex: Pizza Margherita"
            />
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva o item..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Preço (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <select 
                value={formData.categoryId} 
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                required
              >
                <option value="">Selecione...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Grupos de Modificadores (JSON)</label>
            <textarea 
              value={JSON.stringify(formData.modifierGroups, null, 2)} 
              onChange={e => {
                try {
                  setFormData({...formData, modifierGroups: JSON.parse(e.target.value)});
                } catch (err) {}
              }}
              placeholder='[]'
              rows="5"
              style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
          </div>

          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
               <input 
                type="checkbox" 
                checked={formData.available} 
                onChange={e => setFormData({...formData, available: e.target.checked})}
               />
               Disponível
             </label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
               <input 
                type="checkbox" 
                checked={formData.featured} 
                onChange={e => setFormData({...formData, featured: e.target.checked})}
               />
               Destaque
             </label>
          </div>

          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-submit">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
