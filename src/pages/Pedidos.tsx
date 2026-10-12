import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { numberFmt } from '../lib/format'
import RastreioModal from '../components/RastreioModal'

type Valor = string | number | boolean | null

interface Coluna {
  campo: string
  titulo: string
  tipo?: 'data' | 'moeda'
}

interface Lista {
  chave: string
  status: string
  colunas: Coluna[]
  linhas: Record<string, Valor>[]
}

const dataFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' })
const moedaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function formatar(v: Valor, tipo?: Coluna['tipo']) {
  if (v === null || v === '') return ''
  // 30/12/1899 é a "data vazia" que o sistema grava.
  if (tipo === 'data') return String(v).startsWith('1899-12-30') ? '' : dataFmt.format(new Date(String(v)))
  if (tipo === 'moeda') return moedaFmt.format(Number(v))
  return String(v)
}

export default function Pedidos() {
  const { chave = '' } = useParams()
  const [lista, setLista] = useState<Lista | null>(null)
  const [busca, setBusca] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rastreio, setRastreio] = useState<Record<string, Valor> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setLista(await api<Lista>(`/dashboard/pedidos/${chave}`))
      setError('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [chave])

  useEffect(() => {
    setLista(null)
    setBusca('')
    load()
  }, [load])

  const linhas = useMemo(() => {
    if (!lista) return []
    const termo = busca.trim().toLowerCase()
    if (!termo) return lista.linhas
    return lista.linhas.filter((l) => lista.colunas.some((c) => formatar(l[c.campo], c.tipo).toLowerCase().includes(termo)))
  }, [lista, busca])

  return (
    <main className="content content-wide">
      <div className="page-head">
        <div>
          <h1>{lista?.status ?? 'Pedidos'}</h1>
          {lista && (
            <p className="muted">
              {busca ? `${numberFmt.format(linhas.length)} de ` : ''}
              {numberFmt.format(lista.linhas.length)} pedidos faturados
            </p>
          )}
        </div>
        <div className="page-actions">
          <input
            className="search"
            type="search"
            placeholder="Buscar em qualquer campo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button className="ghost" onClick={load} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      <section className="panel">
        {!lista ? (
          <div className="panel-empty">{error ? 'Não foi possível carregar.' : 'Carregando...'}</div>
        ) : !linhas.length ? (
          <div className="panel-empty">{busca ? 'Nenhum pedido encontrado.' : 'Sem pedidos nesse status.'}</div>
        ) : (
          <div className="table-wrap table-scroll">
            <table className="table table-dados">
              <thead>
                <tr>{lista.colunas.map((c) => <th key={c.campo} className={c.tipo === 'moeda' ? 'num' : ''}>{c.titulo}</th>)}</tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={String(l.PEDIDO)}>
                    {lista.colunas.map((c) => {
                      const texto = formatar(l[c.campo], c.tipo)
                      if (c.campo === 'COD_RASTREAMENTO' && texto) {
                        return (
                          <td key={c.campo}>
                            <button type="button" className="link-btn" onClick={() => setRastreio(l)} title="Ver rastreio">
                              {texto}
                            </button>
                          </td>
                        )
                      }
                      return <td key={c.campo} title={texto} className={c.tipo === 'moeda' ? 'num' : ''}>{texto}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {rastreio && (
        <RastreioModal
          codigo={String(rastreio.COD_RASTREAMENTO)}
          pedido={formatar(rastreio.PEDIDO)}
          cliente={formatar(rastreio.CLIENTE)}
          onClose={() => setRastreio(null)}
        />
      )}
    </main>
  )
}
