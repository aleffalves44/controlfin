import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingDown, CreditCard, Calendar } from 'lucide-react'

const COLORS = ['#6C5CE7', '#00B894', '#FDCB6E', '#FF6B6B', '#A29BFE', '#74B9FF', '#FD79A8', '#E17055', '#00CEC9', '#FFEAA7']

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

export const Dashboard = () => {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('last')
  const [dateRange, setDateRange] = useState(getMonthDates('last'))

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, dateRange])

  useEffect(() => {
    setDateRange(getMonthDates(selectedMonth))
  }, [selectedMonth])

  const loadData = async () => {
    setLoading(true)
    
    const { data: accountsData } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    
    setAccounts(accountsData || [])

    if (accountsData && accountsData.length > 0) {
      const accountIds = accountsData.map(a => a.id)
      
      let query = supabase
        .from('transactions')
        .select('*')
        .in('account_id', accountIds)
        .order('date', { ascending: false })

      if (dateRange.startDate) {
        query = query.gte('date', dateRange.startDate)
      }
      if (dateRange.endDate) {
        query = query.lte('date', dateRange.endDate)
      }
      
      const { data: transactionsData } = await query
      
      setTransactions(transactionsData || [])
    }
    
    setLoading(false)
  }

  const getFilteredTransactions = () => {
    return transactions
  }

  const getCategoryData = () => {
    const filtered = getFilteredTransactions()
    const categories = {}
    filtered
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Não categorizado'
        categories[cat] = (categories[cat] || 0) + Math.abs(t.amount)
      })

    return Object.entries(categories).map(([name, value]) => ({ name, value }))
  }

  const getMonthlyData = () => {
    const filtered = getFilteredTransactions()
    const monthly = {}
    filtered
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const month = t.date.substring(0, 7)
        monthly[month] = (monthly[month] || 0) + Math.abs(t.amount)
      })

    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, total]) => ({ month, total }))
  }

  const getTotalExpenses = () => {
    return getFilteredTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  }

  const getTotalIncome = () => {
    return getFilteredTransactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const getBalance = () => {
    const totalExpenses = getTotalExpenses()
    const totalIncome = getTotalIncome()
    const accountsBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
    return accountsBalance + totalIncome - totalExpenses
  }

  const getTopCategory = () => {
    const categoryData = getCategoryData()
    if (categoryData.length === 0) return '-'
    const top = categoryData.reduce((a, b) => a.value > b.value ? a : b)
    return top.name
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="month-filter" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{ minWidth: '160px' }}
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-header">
            <h3>Total de Gastos</h3>
            <div className="summary-card-icon red">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="expense">{formatCurrency(getTotalExpenses())}</p>
        </div>
        <div className="summary-card">
          <div className="summary-card-header">
            <h3>Principal Categoria</h3>
            <div className="summary-card-icon yellow">
              <CreditCard size={20} />
            </div>
          </div>
          <p>{getTopCategory()}</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>Nenhuma transação encontrada.</p>
          <p>Importe seu extrato na página de Contas.</p>
        </div>
      ) : (
        <div className="charts-container">
          <div className="chart-card">
            <h3>Gastos por Categoria</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getCategoryData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getCategoryData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    background: '#1A1A24', 
                    border: '1px solid #2D2D3A',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Evolução de Gastos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getMonthlyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3A" />
                <XAxis dataKey="month" stroke="#6B6B7B" />
                <YAxis stroke="#6B6B7B" />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ 
                    background: '#1A1A24', 
                    border: '1px solid #2D2D3A',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#6C5CE7" strokeWidth={2} dot={{ fill: '#6C5CE7' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
