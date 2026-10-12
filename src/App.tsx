import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pedidos from './pages/Pedidos'
import Layout from './components/Layout'
import ThemeToggle from './components/ThemeToggle'

function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="splash">Carregando...</div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="splash">Carregando...</div>
  if (user) return <Navigate to="/" replace />
  return (
    <>
      <Outlet />
      <ThemeToggle fixo />
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
      </Route>
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pedidos/:chave" element={<Pedidos />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
