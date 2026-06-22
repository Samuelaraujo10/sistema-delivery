import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Users, Plus, Edit3, Trash2, X, Check, Mail, Phone, Lock } from 'lucide-react';
import { teamAPI } from '../services/api';
import Skeleton from '../components/Skeleton';
// CSS options managed globally

export default function TeamManagement({ establishmentId }) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, member: null });
  const [editingMember, setEditingMember] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'waiter',
    active: true
  });

  const roles = [
    { id: 'waiter', label: 'Garçom' },
    { id: 'kitchen', label: 'Cozinha' },
    { id: 'cashier', label: 'Caixa / Balcão' },
    { id: 'manager', label: 'Gerente' }
  ];

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const { data } = await teamAPI.list();
      setTeam(data.data || []);
    } catch (err) {
      toast.error('Erro ao buscar equipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [establishmentId]);

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        email: member.email, // Email não pode ser alterado depois? O backend atualiza.
        password: '', // Senha em branco para não atualizar, a menos que digite
        phone: member.phone || '',
        role: member.role,
        active: member.active
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'waiter',
        active: true
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return toast.error('Preencha os campos obrigatórios.');
    if (!editingMember && (!formData.email || !formData.password)) return toast.error('Email e senha são obrigatórios para novo membro.');

    setIsSaving(true);
    try {
      const payload = { ...formData };
      if (editingMember && !payload.password) {
        delete payload.password; // Não envia senha se não for alterar
      }

      if (editingMember) {
        await teamAPI.update(editingMember.id, payload);
        toast.success('Membro atualizado!');
      } else {
        await teamAPI.create(payload);
        toast.success('Membro adicionado!');
      }
      setModalOpen(false);
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar membro.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.member) return;
    try {
      await teamAPI.delete(deleteModal.member.id);
      toast.success('Membro removido da equipe.');
      setDeleteModal({ open: false, member: null });
      fetchTeam();
    } catch (err) {
      toast.error('Erro ao excluir membro.');
    }
  };

  const toggleActive = async (member) => {
    try {
      await teamAPI.update(member.id, { active: !member.active });
      toast.success(`Membro ${!member.active ? 'ativado' : 'desativado'}.`);
      fetchTeam();
    } catch (err) {
      toast.error('Erro ao alterar status.');
    }
  };

  const getRoleLabel = (roleId) => {
    return roles.find(r => r.id === roleId)?.label || roleId;
  };

  if (loading) {
    return (
      <div className="team-container">
        <Skeleton height="200px" width="100%" />
      </div>
    );
  }

  return (
    <div className="team-container admin-card fade-in">
      <div className="team-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Users size={24} color="#6C63FF" /> Equipe e Funcionários</h2>
          <p className="text-muted" style={{ margin: '4px 0 0' }}>Gerencie garçons, cozinha e operadores do caixa.</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Adicionar Membro
        </button>
      </div>

      {team.length === 0 ? (
        <div className="empty-state">
          <Users size={48} color="#94A3B8" style={{ marginBottom: '16px' }} />
          <h3>Nenhum membro na equipe</h3>
          <p>Você ainda não adicionou funcionários para ajudar na sua loja.</p>
        </div>
      ) : (
        <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {team.map(member => (
            <div key={member.id} className="team-member-card" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(108, 99, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(108, 99, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
            >
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #6C63FF, #FF6584)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '1.4rem', fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)'
                  }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--text)' }}>{member.name}</h3>
                    <span style={{ 
                      background: 'rgba(108, 99, 255, 0.1)', color: '#6C63FF', 
                      padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold',
                      display: 'inline-block'
                    }}>
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                </div>
                
                <div className="action-buttons" style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleOpenModal(member)} style={{ background: 'var(--bg-card-hover)', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s' }} title="Editar">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => setDeleteModal({ open: true, member })} style={{ background: 'rgba(255, 68, 68, 0.1)', border: 'none', color: '#FF4444', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s' }} title="Remover">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'var(--bg-card-hover)', padding: '6px', borderRadius: '6px', display: 'flex', color: 'var(--text)' }}>
                    ✉️
                  </div>
                  {member.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'var(--bg-card-hover)', padding: '6px', borderRadius: '6px', display: 'flex', color: 'var(--text)' }}>
                    📱
                  </div>
                  {member.phone || 'Sem telefone'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', margin: 'auto -24px -24px -24px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '0 0 20px 20px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Status do acesso</span>
                <button 
                  onClick={() => toggleActive(member)}
                  style={{ 
                    background: member.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                    color: member.active ? '#22C55E' : '#94A3B8',
                    border: member.active ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(148, 163, 184, 0.2)',
                    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: member.active ? '#22C55E' : '#94A3B8', boxShadow: member.active ? '0 0 8px #22C55E' : 'none' }} />
                  {member.active ? 'Ativo' : 'Inativo'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Member Form Modal */}
      {modalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%', margin: 'auto' }}>
            <div className="modal-header">
              <h2>{editingMember ? 'Editar Membro' : 'Novo Membro'}</h2>
              <button className="close-modal" onClick={() => setModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="admin-form" style={{ marginTop: '20px' }}>
              
              <div className="form-group">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Ex: João Silva" required 
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>E-mail de Login *</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    disabled={!!editingMember}
                    placeholder="joao@restaurante.com" required={!editingMember}
                  />
                  {editingMember && <small style={{ color: '#94A3B8' }}>O e-mail não pode ser alterado.</small>}
                </div>
                
                <div className="form-group">
                  <label>{editingMember ? 'Nova Senha (Opcional)' : 'Senha de Acesso *'}</label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    placeholder="******" required={!editingMember} 
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Cargo *</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Telefone (Opcional)</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="(00) 00000-0000" 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ marginTop: '16px', width: '100%' }}>
                {isSaving ? 'Salvando...' : (editingMember ? 'Salvar Alterações' : 'Cadastrar Membro')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%', margin: 'auto', textAlign: 'center' }}>
            <div style={{ marginBottom: '20px', color: '#FF6584' }}>
              <Trash2 size={48} />
            </div>
            <h3 style={{ marginBottom: '12px' }}>Remover da Equipe?</h3>
            <p style={{ color: '#94A3B8', marginBottom: '24px', lineHeight: '1.5' }}>
              Tem certeza que deseja remover <strong>{deleteModal.member?.name}</strong>? O acesso ao painel será bloqueado permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteModal({ open: false, member: null })} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={confirmDelete} className="btn btn-danger" style={{ flex: 1, background: '#FF6584', color: '#fff', border: 'none' }}>Remover</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
