import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Wallet, FileText, LogOut } from 'lucide-react'

export const Header = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/dashboard" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="ControlFin Logo" style={{ height: '32px' }} />
          ControlFin
        </Link>
        
        {user && (
          <nav className="nav">
            <Link to="/dashboard" title="Dashboard">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <Link to="/accounts" title="Contas">
              <Wallet size={18} />
              <span>Contas</span>
            </Link>
            <Link to="/transactions" title="Transações">
              <FileText size={18} />
              <span>Transações</span>
            </Link>
            <button onClick={handleLogout} className="btn-logout" title="Sair">
              <LogOut size={18} />
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
