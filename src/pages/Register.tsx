import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import AuthLayout from '../components/AuthLayout'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (senha !== confirmacao) {
      setError('As senhas não conferem')
      return
    }
    setSubmitting(true)
    try {
      await register(nome, email, senha)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Preencha seus dados para acessar o painel.">
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Nome
          <input autoComplete="name" required minLength={2} value={nome}
            onChange={(e) => setNome(e.target.value)} />
        </label>
        <label>
          E-mail
          <input type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Senha
          <input type="password" autoComplete="new-password" required minLength={6} value={senha}
            onChange={(e) => setSenha(e.target.value)} />
        </label>
        <label>
          Confirmar senha
          <input type="password" autoComplete="new-password" required minLength={6} value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)} />
        </label>
        {error && <div className="alert">{error}</div>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
      <p className="switch">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthLayout>
  )
}
