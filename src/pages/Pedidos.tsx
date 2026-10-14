import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { numberFmt } from '../lib/format'
import RastreioModal from '../components/RastreioModal'
import ColunasMenu from '../components/ColunasMenu'
import ObservacaoCell, { type Observacao } from '../components/ObservacaoCell'

type Valor = string | number | boolean | null

interface Coluna {
  campo: string
  titulo: string
  tipo?: 'data' | 'moeda' | 'observacao'
}

interface Lista {
  chave: string
  status: string
  colunas: Coluna[]
  ocultas: string[]
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
  const [selecionado, setSelecionado] = useState<string | null>(null)

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
    setSelecionado(null)
    load()
  }, [load])

  const visiveis = useMemo(() => lista?.colunas.filter((c) => !lista.ocultas.includes(c.campo)) ?? [], [lista])

  // A busca olha só as colunas visíveis.
  const linhas = useMemo(() => {
    if (!lista) return []
    const termo = busca.trim().toLowerCase()
    if (!termo) return lista.linhas
    return lista.linhas.filter((l) => visiveis.some((c) => formatar(l[c.campo], c.tipo).toLowerCase().includes(termo)))
  }, [lista, visiveis, busca])

  const atualizarObservacao = (pedido: Valor, o: Observacao | null) =>
    setLista((l) =>
      l && {
        ...l,
        linhas: l.linhas.map((x) =>
          x.PEDIDO === pedido ? { ...x, OBSERVACAO: o?.texto ?? null, OBSERVACAO_POR: o?.por ?? null, OBSERVACAO_EM: o?.em ?? null } : x,
        ),
      },
    )

  // Atualiza a tela na hora e salva no banco; se falhar, volta como estava.
  const salvarOcultas = async (ocultas: string[]) => {
    if (!lista) return
    const antes = lista.ocultas
    setLista({ ...lista, ocultas })
    try {
      await api('/dashboard/pedidos/colunas', { method: 'PUT', body: JSON.stringify({ ocultas }) })
      setError('')
    } catch (err) {
      setLista((l) => (l ? { ...l, ocultas: antes } : l))
      setError(`Não foi possível salvar as colunas: ${(err as Error).message}`)
    }
  }

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
          {lista && <ColunasMenu colunas={lista.colunas} ocultas={lista.ocultas} onChange={salvarOcultas} />}
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
                <tr>{visiveis.map((c) => <th key={c.campo} className={c.tipo === 'moeda' ? 'num' : ''}>{c.titulo}</th>)}</tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr
                    key={String(l.PEDIDO)}
                    className={selecionado === String(l.PEDIDO) ? 'selecionada' : ''}
                    onClick={() => setSelecionado(String(l.PEDIDO))}
                  >
                    {visiveis.map((c) => {
                      const texto = formatar(l[c.campo], c.tipo)
                      if (c.tipo === 'observacao') {
                        return (
                          <ObservacaoCell
                            key={c.campo}
                            pedido={String(l.PEDIDO)}
                            texto={texto}
                            por={l.OBSERVACAO_POR as string | null}
                            em={l.OBSERVACAO_EM as string | null}
                            onSalvo={(o) => atualizarObservacao(l.PEDIDO, o)}
                          />
                        )
                      }
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
