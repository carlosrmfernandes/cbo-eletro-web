import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setUnauthorizedHandler, tokenStorage } from '../lib/api'

export interface User {
  id: number
  name: string
  email: string
}

interface AuthResponse {
  token: string
  user: User
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => !!tokenStorage.get())

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!tokenStorage.get()) return
    api<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(logout)
      .finally(() => setLoading(false))
  }, [logout])

  const handleAuth = (r: AuthResponse) => {
    tokenStorage.set(r.token)
    setUser(r.user)
  }

  const login = async (email: string, password: string) => {
    handleAuth(await api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }))
  }

  const register = async (name: string, email: string, password: string) => {
    handleAuth(await api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
