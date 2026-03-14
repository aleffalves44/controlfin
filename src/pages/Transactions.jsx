import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getDefaultCategories } from '../utils/categorizer'

const getLastMonthDates = () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0]
  }
}

const MONTHS = [
  { value: '', label: 'Todos' },
  { value: 'current', label: 'Mês atual' },
  { value: 'last', label: 'Mês anterior' },
  { value: '2026-01', label: 'Janeiro 2026' },
  { value: '2025-12', label: 'Dezembro 2025' },
  { value: '2025-11', label: 'Novembro 2025' },
  { value: '2025-10', label: 'Outubro 2025' },
  { value: '2025-09', label: 'Setembro 2025' },
  { value: '2025-08', label: 'Agosto 2025' },
  { value: '2025-07', label: 'Julho 2025' },
  { value: '2025-06', label: 'Junho 2025' },
  { value: '2025-05', label: 'Maio 2025' },
  { value: '2025-04', label: 'Abril 2025' },
  { value: '2025-03', label: 'Março 2025' },
  { value: '2025-02', label: 'Fevereiro 2025' },
  { value: '2025-01', label: 'Janeiro 2025' },
]

const getMonthDates = (monthValue) => {
  const now = new Date()
  let year, month

  if (monthValue === 'current') {
    year = now.getFullYear()
    month = now.getMonth()
  } else if (monthValue === 'last') {
    year = now.getFullYear()
    month = now.getMonth() - 1
  } else if (monthValue) {
    const [y, m] = monthValue.split('-')
    year = parseInt(y)
    month = parseInt(m) - 1
  }

  if (year !== undefined) {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    }
  }
  return { startDate: '', endDate: '' }
}

export const Transactions = () => {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const defaultDates = getLastMonthDates()
  const [filters, setFilters] = useState({
    month: 'last',
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    category: '',
    type: '',
    accountId: ''
  })
  const [sortOrder, setSortOrder] = useState('desc')
  const [editingCategory, setEditingCategory] = useState(null)
  const [categories] = useState(getDefaultCategories())

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    loadTransactions()
  }, [filters, sortOrder])

  const loadData = async () => {
    const { data: accountsData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    
    setAccounts(accountsData || [])
    await loadTransactions(accountsData)
  }

  const loadTransactions = async (accountsData = accounts) => {
    setLoading(true)
    
    let query = supabase
      .from('transactions')
      .select('*, accounts(name, bank, type)')
      .order('date', { ascending: sortOrder === 'asc' })

    if (accountsData?.length > 0) {
      const accountIds = accountsData.map(a => a.id)
      
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId)
      } else {
        query = query.in('account_id', accountIds)
      }

      if (filters.startDate) {
        query = query.gte('date', filters.startDate)
      }

      if (filters.endDate) {
        query = query.lte('date', filters.endDate)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.type) {
        query = query.eq('type', filters.type)
      }

      const { data } = await query
      
      const formatted = (data || []).map(t => ({
        ...t,
        accountName: t.accounts?.name,
        accountBank: t.accounts?.bank,
        accountType: t.accounts?.type
      }))
      
      setTransactions(formatted)
    }
    
    setLoading(false)
  }

  const handleCategoryChange = async (transactionId, newCategory) => {
    await supabase
      .from('transactions')
      .update({ category: newCategory })
      .eq('id', transactionId)

    setTransactions(transactions.map(t => 
      t.id === transactionId ? { ...t, category: newCategory } : t
    ))
    setEditingCategory(null)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const clearFilters = () => {
    const defaultDates = getLastMonthDates()
    setFilters({
      month: 'last',
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      category: '',
      type: '',
      accountId: ''
    })
  }

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Transações</h1>
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Mês</label>
            <select
              value={filters.month}
              onChange={e => {
                const dates = getMonthDates(e.target.value)
                setFilters({ 
                  ...filters, 
                  month: e.target.value,
                  startDate: dates.startDate, 
                  endDate: dates.endDate 
                })
              }}
            >
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Data Início</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value, month: '' })}
            />
          </div>

          <div className="filter-group">
            <label>Data Fim</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value, month: '' })}
            />
          </div>

          <div className="filter-group">
            <label>Conta</label>
            <select
              value={filters.accountId}
              onChange={e => setFilters({ ...filters, accountId: e.target.value })}
            >
              <option value="">Todas</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.bank}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Categoria</label>
            <select
              value={filters.category}
              onChange={e => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">Todas</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Tipo</label>
            <select
              value={filters.type}
              onChange={e => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Ordenar</label>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="desc">Mais recentes</option>
              <option value="asc">Mais antigos</option>
            </select>
          </div>
        </div>

        <button onClick={clearFilters} className="btn-secondary">
          Limpar Filtros
        </button>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma transação encontrada.</p>
          <p>Importe um extrato ou ajuste os filtros.</p>
        </div>
      ) : (
        <div className="transactions-table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Conta</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <span className="account-badge">
                      {t.accountName}
                      <span className={`account-type-badge ${t.accountType}`}>
                        {t.accountType === 'cartao_credito' ? 'CC' : 'CCorr'}
                      </span>
                    </span>
                  </td>
                  <td className="description-cell">{t.description}</td>
                  <td>
                    {editingCategory === t.id ? (
                      <select
                        value={t.category}
                        onChange={e => handleCategoryChange(t.id, e.target.value)}
                        onBlur={() => setEditingCategory(null)}
                        autoFocus
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <span 
                        className="category-badge"
                        onClick={() => setEditingCategory(t.id)}
                        title="Clique para editar"
                      >
                        {t.category || 'Não categorizado'}
                      </span>
                    )}
                  </td>
                  <td className={`amount-cell ${t.type}`}>
                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="transactions-summary">
        <span>Total: {transactions.length} transações</span>
        <span className="income-total">
          Receitas: {formatCurrency(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0))}
        </span>
        <span className="expense-total">
          Despesas: {formatCurrency(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0))}
        </span>
      </div>
    </div>
  )
}
