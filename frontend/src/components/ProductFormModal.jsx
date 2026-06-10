import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { productsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import '../pages/AdminDashboard.css'; // Corrected path

const ProductFormModal = ({ product, categories, establishmentId, defaultBuilderRole = 'none', onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    image: '',
    categoryId: categories[0]?.id || '',
    establishmentId: establishmentId,
    builderRole: defaultBuilderRole,
    modifierGroups: [],
    available: true,
    featured: false
  });

  const [imageFile, setImageFile] = useState(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState('');
  useEffect(() => {
    if (formData.builderRole !== 'none') {
      const MAP_ROLE_TO_CATEGORY_NAMES = {
        massa: ['massas', 'massa'],
        molho: ['molhos', 'molho'],
        proteina: ['proteínas', 'proteína', 'proteinas', 'proteina'],
        topping: ['toppings', 'topping', 'acompanhamentos', 'acompanhamento'],
        fruta: ['frutas frescas', 'frutas', 'fruta'],
        complemento: ['complementos', 'complemento'],
        calda: ['caldas e coberturas', 'caldas', 'coberturas', 'calda', 'cobertura'],
        creme: ['cremes especiais', 'cremes', 'creme'],
        tamanho: ['tamanho do copo', 'tamanho da pizza', 'tamanho', 'tamanhos'],
        sabor: ['sabores tradicionais', 'sabores', 'sabor'],
        borda: ['bordas recheadas', 'bordas', 'borda']
      };

      const cat = categories.find(c => {
        const nameLower = c.name.toLowerCase();
        const keywords = MAP_ROLE_TO_CATEGORY_NAMES[formData.builderRole] || [];
        if (keywords.some(keyword => nameLower.includes(keyword))) return true;
        if (c.products && c.products.some(p => p.builderRole === formData.builderRole)) return true;
        return false;
      });

      if (cat) {
        setDefaultCategoryId(cat.id);
        setFormData(prev => ({ ...prev, categoryId: cat.id }));
      }
    } else {
      setDefaultCategoryId('');
    }
  }, [formData.builderRole, categories]);

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
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        image: '',
        categoryId: categories[0]?.id || '',
        establishmentId: establishmentId,
        builderRole: defaultBuilderRole,
        modifierGroups: [],
        available: true,
        featured: false
      });
    }
  }, [product, categories, defaultBuilderRole]);

  const handleAddGroup = () => {
    setFormData(prev => ({
      ...prev,
      modifierGroups: [
        ...(prev.modifierGroups || []),
        { name: '', min: 0, max: 1, required: false, fields: [] }
      ]
    }));
  };

  const handleRemoveGroup = (groupIndex) => {
    setFormData(prev => ({
      ...prev,
      modifierGroups: (prev.modifierGroups || []).filter((_, i) => i !== groupIndex)
    }));
  };

  const handleUpdateGroup = (groupIndex, key, value) => {
    setFormData(prev => {
      const groups = [...(prev.modifierGroups || [])];
      groups[groupIndex] = { ...groups[groupIndex], [key]: value };
      if (key === 'required') {
        groups[groupIndex].min = value ? Math.max(1, groups[groupIndex].min || 1) : 0;
      }
      return { ...prev, modifierGroups: groups };
    });
  };

  const handleAddOption = (groupIndex) => {
    setFormData(prev => {
      const groups = [...(prev.modifierGroups || [])];
      groups[groupIndex] = {
        ...groups[groupIndex],
        fields: [...(groups[groupIndex].fields || []), { name: '', price: 0 }]
      };
      return { ...prev, modifierGroups: groups };
    });
  };

  const handleRemoveOption = (groupIndex, optionIndex) => {
    setFormData(prev => {
      const groups = [...(prev.modifierGroups || [])];
      groups[groupIndex] = {
        ...groups[groupIndex],
        fields: (groups[groupIndex].fields || []).filter((_, i) => i !== optionIndex)
      };
      return { ...prev, modifierGroups: groups };
    });
  };

  const handleUpdateOption = (groupIndex, optionIndex, key, value) => {
    setFormData(prev => {
      const groups = [...(prev.modifierGroups || [])];
      const fields = [...(groups[groupIndex].fields || [])];
      fields[optionIndex] = { ...fields[optionIndex], [key]: value };
      groups[groupIndex] = { ...groups[groupIndex], fields };
      return { ...prev, modifierGroups: groups };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Omit categoryId if empty, backend treats it as optional
        if (key === 'categoryId' && (!value || value === '')) return;
        payload.append(key, key === 'modifierGroups' ? JSON.stringify(value || []) : value);
      });
      if (imageFile) payload.append('imageFile', imageFile);

      if (product) {
        await productsAPI.update(product.id, payload);
        toast.success('Produto atualizado!');
      } else {
        await productsAPI.create(payload);
        toast.success('Produto criado!');
      }
      onSave();
      onClose();
    } catch (error) {
      if (formData.builderRole === 'none' && !formData.categoryId) {
        toast.error('Selecione uma categoria antes de salvar!');
      } else {
        // Erro genérico (o interceptor do axios já mostra o erro específico)
        console.error(error);
      }
    }
  };


  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
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
              <label>Categoria {formData.builderRole !== 'none' && '(Opcional)'}</label>
              <select 
                value={formData.categoryId} 
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
                required={formData.builderRole === 'none'}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--bg-elevated)', color: '#fff', border: '1px solid var(--border)' }}
              >
                <option value="" disabled={formData.builderRole === 'none'}>
                  {formData.builderRole !== 'none' ? 'Nenhuma (Item do Monte seu)' : 'Selecione uma categoria...'}
                </option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <label style={{ color: '#fff', marginBottom: '12px', display: 'block' }}>Este item pertence a qual setor?</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="itemType" 
                  checked={formData.builderRole === 'none'} 
                  onChange={() => setFormData({...formData, builderRole: 'none'})}
                />
                Pratos, Bebidas e Outros
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="itemType" 
                  checked={formData.builderRole !== 'none'} 
                  onChange={() => setFormData({...formData, builderRole: 'topping'})}
                />
                Monte seu (Ingrediente)
              </label>
            </div>

            {formData.builderRole !== 'none' && (
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Função no "Monte seu"</label>
                <select 
                  value={formData.builderRole} 
                  onChange={e => setFormData({...formData, builderRole: e.target.value})}
                  style={{ marginTop: '4px' }}
                >
                   <option value="topping">Acompanhamento / Topping</option>
                  <option value="proteina">Proteína / Carne</option>
                  <option value="massa">Massa</option>
                  <option value="molho">Molho</option>
                  <option value="fruta">Fruta</option>
                  <option value="creme">Creme / Gelato</option>
                  <option value="complemento">Complemento (Açaí)</option>
                  <option value="calda">Calda / Cobertura</option>
                  <option value="tamanho">Tamanho / Recipiente</option>
                  <option value="borda">Borda</option>
                  <option value="sabor">Sabor</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Imagem do Produto</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
            />
            {formData.image && !imageFile && (
              <small style={{ color: '#94A3B8' }}>Imagem atual: {formData.image.split('/').pop()}</small>
            )}
          </div>


          <div className="form-group" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ margin: 0, fontWeight: '600' }}>Grupos de Adicionais / Modificadores</label>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddGroup}
                style={{ padding: '6px 12px', borderRadius: '8px' }}
              >
                + Novo Grupo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(formData.modifierGroups || []).map((group, gIdx) => (
                <div
                  key={gIdx}
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(gIdx)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Excluir
                  </button>

                  <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--primary)' }}>
                    Grupo #{gIdx + 1}
                  </h4>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Nome do Grupo (Ex: Escolha o Ponto)</label>
                    <input
                      type="text"
                      className="input"
                      value={group.name}
                      onChange={e => handleUpdateGroup(gIdx, 'name', e.target.value)}
                      placeholder="Nome do grupo..."
                      required
                      style={{ padding: '8px 12px' }}
                    />
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Mínimo</label>
                      <input
                        type="number"
                        className="input"
                        value={group.min}
                        onChange={e => handleUpdateGroup(gIdx, 'min', parseInt(e.target.value) || 0)}
                        min="0"
                        style={{ padding: '8px 12px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Máximo</label>
                      <input
                        type="number"
                        className="input"
                        value={group.max}
                        onChange={e => handleUpdateGroup(gIdx, 'max', parseInt(e.target.value) || 1)}
                        min="1"
                        style={{ padding: '8px 12px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={group.required || false}
                          onChange={e => handleUpdateGroup(gIdx, 'required', e.target.checked)}
                        />
                        Obrigatório
                      </label>
                    </div>
                  </div>

                  {/* Options (fields) */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Opções de Escolha</span>
                      <button
                        type="button"
                        onClick={() => handleAddOption(gIdx)}
                        style={{
                          background: 'rgba(108, 99, 255, 0.1)',
                          color: '#6C63FF',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        + Nova Opção
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(group.fields || []).map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="input"
                            value={opt.name}
                            onChange={e => handleUpdateOption(gIdx, oIdx, 'name', e.target.value)}
                            placeholder="Nome (Ex: Coca-Cola)"
                            required
                            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                          />
                          <input
                            type="number"
                            step="0.01"
                            className="input"
                            value={opt.price}
                            onChange={e => handleUpdateOption(gIdx, oIdx, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="Preço (Ex: 5.00)"
                            required
                            style={{ padding: '6px 10px', fontSize: '0.85rem', maxWidth: '100px' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(gIdx, oIdx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                            title="Remover opção"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {(group.fields || []).length === 0 && (
                        <p style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', margin: '4px 0' }}>
                          Nenhuma opção cadastrada. Adicione pelo menos uma opção.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(formData.modifierGroups || []).length === 0 && (
                <div style={{
                  padding: '20px',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  color: '#94A3B8',
                  fontSize: '0.85rem'
                }}>
                  Nenhum grupo de adicionais configurado para este item.
                </div>
              )}
            </div>
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
            <button type="button" className="btn btn-primary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
