import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthLayout from '../components/AuthLayout'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, senha)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Entrar" subtitle="Acesse o painel com seu e-mail e senha.">
      <form className="form" onSubmit={handleSubmit}>
        <label>
          E-mail
          <input type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Senha
          <input type="password" autoComplete="current-password" required value={senha}
            onChange={(e) => setSenha(e.target.value)} />
        </label>
        {error && <div className="alert">{error}</div>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="switch">
        Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </AuthLayout>
  )
}
