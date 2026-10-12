import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

interface Local {
  tipo: string | null
  cidade: string | null
}

interface Evento {
  sro: string
  data: string
  descricao: string
  detalhe: string | null
  local: Local | null
  destino: Local | null
  enderecoRetirada: string | null
  limiteRetirada: string | null
}

interface Rastreio {
  codigo: string
  mensagem: string | null
  servico: string | null
  previsaoEntrega: string | null
  peso: number | null
  valorDeclarado: number | null
  eventos: Evento[]
}

interface Props {
  codigo: string
  pedido?: string
  cliente?: string
  onClose: () => void
}

// Os Correios mandam as datas no horário de Brasília e sem fuso; lidas como hora local, saem como vieram.
const dataHoraFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const dataFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })
const moedaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dia = (s: string) => dataFmt.format(new Date(s.length === 10 ? `${s}T00:00:00` : s))

const trecho = (e: Evento) => {
  if (!e.local?.cidade) return null
  if (e.destino?.cidade) return `${e.local.tipo ?? ''} ${e.local.cidade} → ${e.destino.tipo ?? ''} ${e.destino.cidade}`.trim()
  return [e.local.tipo, e.local.cidade].filter(Boolean).join(' · ')
}

export default function RastreioModal({ codigo, pedido, cliente, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [dados, setDados] = useState<Rastreio | null>(null)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  useEffect(() => {
    let ativo = true
    api<Rastreio>(`/dashboard/rastreio/${encodeURIComponent(codigo)}`)
      .then((d) => ativo && setDados(d))
      .catch((err) => ativo && setError((err as Error).message))
    return () => {
      ativo = false
    }
  }, [codigo])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      /* sem permissão de área de transferência: ignora */
    }
  }

  const ultimo = dados?.eventos[0]
  const resumo = dados && [
    dados.servico,
    dados.previsaoEntrega && `Previsão ${dia(dados.previsaoEntrega)}`,
    dados.peso != null && `${String(dados.peso).replace('.', ',')} kg`,
    dados.valorDeclarado != null && `Declarado ${moedaFmt.format(dados.valorDeclarado)}`,
  ].filter(Boolean)

  return (
    <dialog
      ref={ref}
      className="modal"
      onClose={onClose}
      // Clique fora da caixa (no fundo escurecido) fecha.
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      aria-labelledby="rastreio-titulo"
    >
      <div className="modal-box">
        <header className="modal-head">
          <div>
            <h2 id="rastreio-titulo" className="rastreio-codigo">
              {codigo}
              <button type="button" className="link-btn" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>
            </h2>
            <p className="muted">{[pedido && `Pedido ${pedido}`, cliente].filter(Boolean).join(' · ')}</p>
          </div>
          <button type="button" className="modal-close" onClick={() => ref.current?.close()} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className="modal-body">
          {error ? (
            <div className="alert">{error}</div>
          ) : !dados ? (
            <div className="panel-empty">Consultando os Correios...</div>
          ) : dados.mensagem && !dados.eventos.length ? (
            <div className="alert">{dados.mensagem}</div>
          ) : (
            <>
              {ultimo && (
                <div className="rastreio-atual">
                  <span className="rastreio-label">Situação atual</span>
                  <strong>{ultimo.descricao}</strong>
                  {resumo && resumo.length > 0 && <span className="muted">{resumo.join(' · ')}</span>}
                  {ultimo.limiteRetirada && (
                    <span className="rastreio-retirada">
                      Retirar até {dia(ultimo.limiteRetirada)}
                      {ultimo.enderecoRetirada && <> em {ultimo.enderecoRetirada}</>}
                    </span>
                  )}
                </div>
              )}

              <ol className="timeline">
                {dados.eventos.map((e, i) => (
                  <li key={`${e.sro}-${e.data}`} className={i === 0 ? 'atual' : ''}>
                    <time className="timeline-data">{dataHoraFmt.format(new Date(e.data))}</time>
                    <div className="timeline-texto">
                      <strong>{e.descricao}</strong>
                      {trecho(e) && <span>{trecho(e)}</span>}
                      {e.detalhe && <span className="muted">{e.detalhe}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}
