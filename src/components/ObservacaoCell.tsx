import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

export interface Observacao {
  texto: string
  por: string | null
  em: string
}

interface Props {
  pedido: string
  texto: string
  por: string | null
  em: string | null
  onSalvo: (observacao: Observacao | null) => void
}

const quandoFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

// Observação do pedido, compartilhada entre todos: clique para editar; Enter ou sair do campo salva, Esc cancela.
export default function ObservacaoCell({ pedido, texto, por, em, onSalvo }: Props) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(texto)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editando) input.current?.focus()
  }, [editando])

  const abrir = () => {
    setValor(texto)
    setErro('')
    setEditando(true)
  }

  const salvar = async () => {
    const novo = valor.trim()
    if (novo === texto) return setEditando(false)
    setSalvando(true)
    try {
      const { observacao } = await api<{ observacao: Observacao | null }>(
        `/dashboard/pedidos/${encodeURIComponent(pedido)}/observacao`,
        { method: 'PUT', body: JSON.stringify({ texto: novo }) },
      )
      onSalvo(observacao)
      setEditando(false)
    } catch (err) {
      // Continua editando para não perder o que foi digitado.
      setErro((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  if (editando) {
    return (
      <td className="obs-cell">
        <input
          ref={input}
          className="obs-input"
          value={valor}
          maxLength={2000}
          disabled={salvando}
          placeholder="Escreva a observação"
          onChange={(e) => setValor(e.target.value)}
          onBlur={salvar}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setEditando(false)
          }}
        />
        {erro && <span className="obs-erro">{erro}</span>}
      </td>
    )
  }

  const autoria = por && em ? `${por} em ${quandoFmt.format(new Date(em))}` : ''
  return (
    <td className="obs-cell" title={texto ? `${texto}${autoria ? `\n— ${autoria}` : ''}` : 'Clique para adicionar'}>
      <button type="button" className="obs-view" onClick={abrir}>
        {texto ? (
          <>
            <Lampada />
            <span className="obs-texto">{texto}</span>
          </>
        ) : (
          <span className="obs-vazia">+ Adicionar</span>
        )}
      </button>
    </td>
  )
}

// Lâmpada amarela: sinaliza que o pedido tem observação.
function Lampada() {
  return (
    <svg className="obs-lampada" viewBox="0 0 24 24" width="16" height="16" aria-label="Tem observação" role="img">
      <path
        d="M12 2a7 7 0 0 0-4 12.75V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.25A7 7 0 0 0 12 2Z"
        fill="#f5c518"
        stroke="#b38600"
        strokeWidth="1.2"
      />
      <path d="M9 20h6M10 22h4" stroke="#8a6d00" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
