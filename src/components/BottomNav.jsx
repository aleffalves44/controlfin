import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Wallet, FileText, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const BottomNav = () => {
  const location = useLocation()
  const { signOut } = useAuth()

  const isActive = (path) => location.pathname.includes(path)

  return (
    <nav className="bottom-nav">
      <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
        <LayoutDashboard size={22} />
        <span>Dashboard</span>
      </Link>
      <Link to="/accounts" className={isActive('/accounts') ? 'active' : ''}>
        <Wallet size={22} />
        <span>Contas</span>
      </Link>
      <Link to="/transactions" className={isActive('/transactions') ? 'active' : ''}>
        <FileText size={22} />
        <span>Transações</span>
      </Link>
      <button onClick={signOut} className="nav-logout">
        <LogOut size={22} />
        <span>Sair</span>
      </button>
    </nav>
  )
}
