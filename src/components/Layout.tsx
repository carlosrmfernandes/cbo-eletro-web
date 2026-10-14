import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import ThemeToggle from './ThemeToggle'

// Mesma ordem (e cores) dos cards do dashboard.
const STATUS = [
  { chave: 'aguardandoDevolucao', nome: 'Aguardando Devolução' },
  { chave: 'aguardandoReversa', nome: 'Aguardando Reversa' },
  { chave: 'aguardandoRetirada', nome: 'Aguardando Retirada' },
  { chave: 'fc82', nome: 'FC82' },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">CBO</span>
          <span className="brand-name">Eletro</span>
        </div>
        <div className="user">
          <span>{user?.name}</span>
          <ThemeToggle />
          <button className="ghost" onClick={logout}>Sair</button>
        </div>
      </header>

      <div className="shell">
        <nav className="sidebar" aria-label="Menu">
          <NavLink to="/" end className="side-link">Indicadores</NavLink>
          <span className="side-title">Pedidos</span>
          {STATUS.map((s, i) => (
            <NavLink key={s.chave} to={`/pedidos/${s.chave}`} className="side-link">
              <span className={`swatch serie-${i + 1}`} />
              {s.nome}
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </div>
    </div>
  )
}
