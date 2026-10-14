import { useEffect, useRef, useState } from 'react'

interface Props {
  colunas: { campo: string; titulo: string }[]
  ocultas: string[]
  onChange: (ocultas: string[]) => void
}

// Botão "Colunas" com a lista de checkboxes para mostrar/esconder colunas da tabela.
export default function ColunasMenu({ colunas, ocultas, onChange }: Props) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAberto(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false)
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  const visiveis = colunas.length - ocultas.length
  const alternar = (campo: string) =>
    onChange(ocultas.includes(campo) ? ocultas.filter((c) => c !== campo) : [...ocultas, campo])

  return (
    <div className="colunas-menu" ref={ref}>
      <button type="button" className="ghost" aria-expanded={aberto} onClick={() => setAberto((a) => !a)}>
        Colunas ({visiveis}/{colunas.length})
      </button>
      {aberto && (
        <div className="colunas-pop">
          <div className="colunas-acoes">
            <button type="button" className="link-btn" onClick={() => onChange([])} disabled={!ocultas.length}>
              Mostrar todas
            </button>
          </div>
          {colunas.map((c) => {
            const visivel = !ocultas.includes(c.campo)
            return (
              <label key={c.campo}>
                <input
                  type="checkbox"
                  checked={visivel}
                  // A última coluna visível não pode ser desmarcada.
                  disabled={visivel && visiveis === 1}
                  onChange={() => alternar(c.campo)}
                />
                {c.titulo}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
