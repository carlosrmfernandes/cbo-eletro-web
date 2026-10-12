import type { ReactNode } from 'react'

export default function AuthLayout({ title, subtitle, children }: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <span className="brand-mark">CBO</span>
          <span className="brand-name">Eletro</span>
        </div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
