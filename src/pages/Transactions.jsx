import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getDefaultCategories } from '../utils/categorizer'
import { 
  ChevronLeft, ChevronRight, Search, TrendingUp, TrendingDown, 
  CreditCard, Building2, Trash2, X, ChevronDown
} from 'lucide-react'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const getInitialMonth = () => {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() - 1 }
}

const getMonthRange = (year, month) => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0]
  }
}

export const Transactions = () => {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(getInitialMonth())
  const [dateRange, setDateRange] = useState(() => {
    const { year, month } = getInitialMonth()
    return getMonthRange(year, month)
  })
  const [showFilters, setShowFilters] = useState(false)
  const [searchDescription, setSearchDescription] = useState('')
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    accountId: ''
  })
  const [categories] = useState(getDefaultCategories())
  const [openCategoryId, setOpenCategoryId] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  useEffect(() => {
    loadTransactions()
  }, [dateRange, filters])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenCategoryId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    if (!accountsData) {
      const { data } = await supabase.from('accounts').select('*').eq('user_id', user.id)
      accountsData = data || []
    }

    if (accountsData.length > 0) {
      const accountIds = accountsData.map(a => a.id)
      
      let query = supabase
        .from('transactions')
        .select('*, accounts(name, bank, type)')
        .in('account_id', accountIds)
        .order('date', { ascending: false })

      if (dateRange.startDate) query = query.gte('date', dateRange.startDate)
      if (dateRange.endDate) query = query.lte('date', dateRange.endDate)
      if (filters.accountId) query = query.eq('account_id', filters.accountId)
      if (filters.category) query = query.eq('category', filters.category)
      if (filters.type) query = query.eq('type', filters.type)

      const { data } = await query
      
      let formatted = (data || []).map(t => ({
        ...t,
        accountName: t.accounts?.name,
        accountBank: t.accounts?.bank,
        accountType: t.accounts?.type
      }))

      if (searchDescription) {
        const search = searchDescription.toLowerCase()
        formatted = formatted.filter(t => t.description?.toLowerCase().includes(search))
      }
      
      setTransactions(formatted)
    }
    setLoading(false)
  }

  const handlePrevMonth = () => {
    let newMonth = currentMonth.month - 1
    let newYear = currentMonth.year
    if (newMonth < 0) { newMonth = 11; newYear-- }
    setCurrentMonth({ year: newYear, month: newMonth })
    setDateRange(getMonthRange(newYear, newMonth))
  }

  const handleNextMonth = () => {
    const now = new Date()
    if (currentMonth.year > now.getFullYear() || 
        (currentMonth.year === now.getFullYear() && currentMonth.month >= now.getMonth())) return
    let newMonth = currentMonth.month + 1
    let newYear = currentMonth.year
    if (newMonth > 11) { newMonth = 0; newYear++ }
    setCurrentMonth({ year: newYear, month: newMonth })
    setDateRange(getMonthRange(newYear, newMonth))
  }

  const clearFilters = () => {
    setFilters({ category: '', type: '', accountId: '' })
    setSearchDescription('')
  }

  const handleDelete = async (id) => {
    if (confirm('Excluir esta transação?')) {
      await supabase.from('transactions').delete().eq('id', id)
      loadTransactions()
    }
  }

  const handleCategoryChange = async (id, newCategory) => {
    await supabase.from('transactions').update({ category: newCategory }).eq('id', id)
    setTransactions(transactions.map(t => t.id === id ? { ...t, category: newCategory } : t))
    setOpenCategoryId(null)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const canGoNext = () => {
    const now = new Date()
    return currentMonth.year < now.getFullYear() || 
           (currentMonth.year === now.getFullYear() && currentMonth.month < now.getMonth())
  }

  const monthLabel = currentMonth.year 
    ? `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}`
    : 'Todos'

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <div className="transactions-page">
      {/* Month Selector */}
      <div className="month-selector">
        <button onClick={handlePrevMonth} className="month-nav-btn">
          <ChevronLeft size={20} />
        </button>
        <div className="month-current" onClick={() => setShowFilters(!showFilters)}>
          <span className="month-label">{monthLabel}</span>
          <span className="month-hint">filtros</span>
        </div>
        <button onClick={handleNextMonth} className={`month-nav-btn ${!canGoNext() ? 'disabled' : ''}`} disabled={!canGoNext()}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <span>Filtros</span>
            <button onClick={clearFilters} className="btn-clear">Limpar</button>
          </div>
          
          <div className="filter-section">
            <label>Buscar descrição</label>
            <div className="search-input">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchDescription}
                onChange={e => setSearchDescription(e.target.value)}
              />
              {searchDescription && <button onClick={() => setSearchDescription('')}><X size={14}/></button>}
            </div>
          </div>

          <div className="filter-section">
            <label>Conta</label>
            <select value={filters.accountId} onChange={e => setFilters({...filters, accountId: e.target.value})}>
              <option value="">Todas</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="filter-section">
            <label>Tipo</label>
            <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
              <option value="">Todos</option>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>

          <div className="filter-section">
            <label>Categoria</label>
            <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
              <option value="">Todas</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="transactions-summary">
        <span className="summary-count">{transactions.length} transações</span>
        <span className="summary-income">
          <TrendingUp size={14} /> {formatCurrency(totalIncome)}
        </span>
        <span className="summary-expense">
          <TrendingDown size={14} /> {formatCurrency(totalExpense)}
        </span>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="loading">Carregando...</div>
      ) : transactions.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma transação encontrada.</p>
        </div>
      ) : (
        <div className="transactions-list" ref={dropdownRef}>
          {transactions.map(t => (
            <div key={t.id} className="transaction-card">
              <div className="transaction-header">
                <div className="transaction-account">
                  {t.accountType === 'cartao_credito' ? <CreditCard size={14} /> : <Building2 size={14} />}
                  <span>{t.accountName}</span>
                </div>
                <div className="transaction-date">{new Date(t.date).toLocaleDateString('pt-BR')}</div>
              </div>
              
              <div className="transaction-body">
                <span className="transaction-desc">{t.description}</span>
                
                <div className="transaction-amount-row">
                  <span className={`transaction-amount ${t.type}`}>
                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(t.amount))}
                  </span>
                  <button onClick={() => handleDelete(t.id)} className="btn-delete-transaction" title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="category-selector-wrapper">
                  <button 
                    className={`category-selector ${t.type} ${openCategoryId === t.id ? 'open' : ''}`}
                    onClick={() => setOpenCategoryId(openCategoryId === t.id ? null : t.id)}
                  >
                    <span className="category-current">{t.category || 'Selecionar'}</span>
                    <ChevronDown size={14} />
                  </button>
                  
                  {openCategoryId === t.id && (
                    <div className="category-dropdown">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          className={`category-option ${t.category === cat ? 'active' : ''}`}
                          onClick={() => handleCategoryChange(t.id, cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
