import { useEffect, useState } from 'react'

type Tema = 'light' | 'dark'
const THEME_KEY = 'cbo-eletro:tema'

// Sem escolha salva, segue o tema do sistema operacional.
function temaInicial(): Tema {
  const salvo = localStorage.getItem(THEME_KEY)
  if (salvo === 'light' || salvo === 'dark') return salvo
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function ThemeToggle({ fixo = false }: { fixo?: boolean }) {
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => {
    document.documentElement.dataset.theme = tema
  }, [tema])

  function alternar() {
    const novo = tema === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, novo)
    setTema(novo)
  }

  const label = tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'
  return (
    <button className={fixo ? 'theme-toggle fixo' : 'theme-toggle'} onClick={alternar} aria-label={label} title={label}>
      {tema === 'dark' ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  )
}
