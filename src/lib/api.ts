const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'cbo-eletro:token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get()
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.()
    throw new ApiError(res.status, data.message ?? 'Erro inesperado')
  }
  return data as T
}
