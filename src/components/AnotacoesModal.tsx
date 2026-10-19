import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

export interface Anotacao {
  id: string
  texto: string
  por: string | null
  em: string
}

interface Props {
  pedido: string
  cliente?: string
  onAtualizado: (anotacoes: Anotacao[]) => void
  onClose: () => void
}

const quandoFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

// Histórico de anotações do pedido, visto por todos. Só dá para adicionar: nada é editado nem apagado.
export default function AnotacoesModal({ pedido, cliente, onAtualizado, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)
  const [lista, setLista] = useState<Anotacao[] | null>(null)
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ref.current?.showModal()
    campo.current?.focus()
  }, [])

  useEffect(() => {
    let ativo = true
    api<{ anotacoes: Anotacao[] }>(`/dashboard/pedidos/${encodeURIComponent(pedido)}/anotacoes`)
      .then(({ anotacoes }) => {
        if (!ativo) return
        setLista(anotacoes)
        // Pode ter chegado anotação de outro usuário desde que a lista foi carregada.
        onAtualizado(anotacoes)
      })
      .catch((err) => ativo && setError((err as Error).message))
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido])

  const adicionar = async () => {
    const novo = texto.trim()
    if (!novo || salvando) return
    setSalvando(true)
    setError('')
    try {
      const { anotacoes } = await api<{ anotacoes: Anotacao[] }>(
        `/dashboard/pedidos/${encodeURIComponent(pedido)}/anotacoes`,
        { method: 'POST', body: JSON.stringify({ texto: novo }) },
      )
      setLista(anotacoes)
      onAtualizado(anotacoes)
      setTexto('')
      campo.current?.focus()
    } catch (err) {
      // Mantém o texto digitado para tentar de novo.
      setError((err as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      // Clique fora da caixa (no fundo escurecido) fecha.
      onClick={(e) => {
        // Pelo portal o clique ainda sobe até a linha da tabela no React: não deixa selecionar a linha.
        e.stopPropagation()
        if (e.target === e.currentTarget) ref.current?.close()
      }}
      aria-labelledby="anotacoes-titulo"
    >
      <div className="modal-box">
        <header className="modal-head">
          <div>
            <h2 id="anotacoes-titulo">Anotações · Pedido {pedido}</h2>
            {cliente && <p className="muted">{cliente}</p>}
          </div>
          <button type="button" className="modal-close" onClick={() => ref.current?.close()} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className="modal-body">
          <form
            className="anotacao-form"
            onSubmit={(e) => {
              e.preventDefault()
              adicionar()
            }}
          >
            <textarea
              ref={campo}
              value={texto}
              maxLength={2000}
              rows={3}
              disabled={salvando}
              placeholder="Escreva uma anotação (Ctrl+Enter adiciona)"
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  adicionar()
                }
              }}
            />
            <div className="anotacao-acoes">
              <span className="muted">Todos os usuários veem as anotações, que não podem ser apagadas.</span>
              <button type="submit" disabled={salvando || !texto.trim()}>
                {salvando ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </form>

          {error && <div className="alert">{error}</div>}

          {!lista ? (
            !error && <div className="panel-empty">Carregando...</div>
          ) : !lista.length ? (
            <div className="panel-empty">Nenhuma anotação ainda.</div>
          ) : (
            <ul className="anotacoes">
              {lista.map((a) => (
                <li key={a.id}>
                  <div className="anotacao-autor">
                    <strong>{a.por ?? 'Usuário removido'}</strong>
                    <time className="muted">{quandoFmt.format(new Date(a.em))}</time>
                  </div>
                  <p>{a.texto}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  )
}
