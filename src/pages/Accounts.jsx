import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Plus, CreditCard, Building2, Edit2, Trash2, Upload, Wallet } from 'lucide-react'

export const Accounts = () => {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', bank: '', type: 'conta_corrente' })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    if (user) {
      loadAccounts()
    }
  }, [user])

  const loadAccounts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    
    setAccounts(data || [])
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (editingId) {
      await supabase
        .from('accounts')
        .update({ name: formData.name, bank: formData.bank, type: formData.type })
        .eq('id', editingId)
    } else {
      await supabase
        .from('accounts')
        .insert({ user_id: user.id, name: formData.name, bank: formData.bank, type: formData.type })
    }

    setFormData({ name: '', bank: '', type: 'conta_corrente' })
    setEditingId(null)
    setShowModal(false)
    loadAccounts()
  }

  const handleEdit = (account) => {
    setFormData({ name: account.name, bank: account.bank, type: account.type || 'conta_corrente' })
    setEditingId(account.id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta conta? Todas as transações também serão excluídas.')) {
      await supabase.from('transactions').delete().eq('account_id', id)
      await supabase.from('accounts').delete().eq('id', id)
      loadAccounts()
    }
  }

  const openNewModal = () => {
    setFormData({ name: '', bank: '', type: 'conta_corrente' })
    setEditingId(null)
    setShowModal(true)
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="accounts-page">
      {accounts.length === 0 ? (
        <div className="empty-state">
          <Wallet size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p>Nenhuma conta cadastrada.</p>
          <p>Adicione uma conta para começar.</p>
          <button onClick={openNewModal} className="btn-primary" style={{ marginTop: '1.5rem' }}>
            <Plus size={18} />
            Adicionar Conta
          </button>
        </div>
      ) : (
        <>
          <button onClick={openNewModal} className="btn-add-account">
            <Plus size={20} />
            Adicionar Conta
          </button>

          <div className="accounts-grid">
            {accounts.map(account => (
              <div key={account.id} className="account-card">
                <div className="account-card-header">
                  <div className={`account-icon ${account.type === 'cartao_credito' ? 'card' : 'bank'}`}>
                    {account.type === 'cartao_credito' ? <CreditCard size={24} /> : <Building2 size={24} />}
                  </div>
                  <div className="account-info">
                    <h3>{account.name}</h3>
                    <p className="bank">{account.bank}</p>
                  </div>
                  <div className="account-actions-menu">
                    <button onClick={() => handleEdit(account)} className="btn-icon" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(account.id)} className="btn-icon danger" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <a href={`/controlfin/import/${account.id}`} className="btn-import">
                  <Upload size={18} />
                  Importar Extrato
                </a>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Editar Conta' : 'Nova Conta'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tipo da Conta</label>
                <div className="type-selector">
                  <button
                    type="button"
                    className={`type-option ${formData.type === 'conta_corrente' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, type: 'conta_corrente' })}
                  >
                    <Building2 size={20} />
                    <span>Conta Corrente</span>
                  </button>
                  <button
                    type="button"
                    className={`type-option ${formData.type === 'cartao_credito' ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, type: 'cartao_credito' })}
                  >
                    <CreditCard size={20} />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>Nome da Conta</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Minha Conta Principal"
                />
              </div>
              
              <div className="form-group">
                <label>Banco</label>
                <input
                  type="text"
                  value={formData.bank}
                  onChange={e => setFormData({ ...formData, bank: e.target.value })}
                  required
                  placeholder="Ex: Nubank, Itaú, Banco do Brasil"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
