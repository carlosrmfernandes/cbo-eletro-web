import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import MonthlyChart, { type LinhaMes, type Serie } from '../components/MonthlyChart'
import { formatMes, numberFmt } from '../lib/format'

interface Card {
  chave: 'aguardandoDevolucao' | 'aguardandoReversa' | 'aguardandoRetirada' | 'fc82'
  status: string
  total: number
  canais?: { canal: string; total: number }[]
}

const NOME_CANAL: Record<string, string> = { SHOPEE: 'Shopee', TIKTOK: 'TikTok', 'SEM VENDEDOR': 'Sem vendedor' }

interface Resumo {
  atualizadoEm: string
  cards: Card[]
}

interface Mensal {
  status: Serie[]
  meses: LinhaMes[]
}

const REFRESH_MS = 60_000
const timeFmt = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'medium' })

export default function Dashboard() {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [mensal, setMensal] = useState<Mensal | null>(null)
  const [verTabela, setVerTabela] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, m] = await Promise.all([
        api<Resumo>('/dashboard/resumo'),
        api<Mensal>('/dashboard/mensal'),
      ])
      setResumo(r)
      setMensal(m)
      setError('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, REFRESH_MS)
    return () => clearInterval(id)
  }, [load])

  return (
      <main className="content">
        <div className="page-head">
          <div>
            <h1>Central de Indicadores</h1>
            {resumo && (
              <p className="muted">Atualizado às {timeFmt.format(new Date(resumo.atualizadoEm))}</p>
            )}
          </div>
          <button className="ghost" onClick={load} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {error && <div className="alert">{error}</div>}

        <section className="cards">
          {(resumo?.cards ?? placeholders).map((c, i) => (
            <article key={c.chave} className={`card serie-${i + 1}`}>
              <span className="card-label">
                <span className={`swatch serie-${i + 1}`} />
                {c.status}
              </span>
              <strong className="card-value">{resumo ? numberFmt.format(c.total) : '—'}</strong>
              {c.canais && (
                <ul className="card-canais">
                  {c.canais.map((k) => (
                    <li key={k.canal}>
                      <span>{NOME_CANAL[k.canal] ?? k.canal}</span>
                      <strong>{numberFmt.format(k.total)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Pedidos por mês</h2>
              <p className="muted">Pelo mês da data do pedido</p>
            </div>
            <div className="segmented" role="group" aria-label="Visualização">
              <button className={verTabela ? '' : 'active'} onClick={() => setVerTabela(false)}>Gráfico</button>
              <button className={verTabela ? 'active' : ''} onClick={() => setVerTabela(true)}>Tabela</button>
            </div>
          </div>

          {mensal && (
            <ul className="legend">
              {mensal.status.map((s, i) => (
                <li key={s.chave}><span className={`swatch serie-${i + 1}`} />{s.nome}</li>
              ))}
            </ul>
          )}

          {!mensal ? (
            <div className="panel-empty">Carregando...</div>
          ) : !mensal.meses.length ? (
            <div className="panel-empty">Sem pedidos nesses status.</div>
          ) : verTabela ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    {mensal.status.map((s) => <th key={s.chave}>{s.nome}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {mensal.meses.map((m) => (
                    <tr key={m.mes}>
                      <td>{formatMes(m.mes, true)}</td>
                      {mensal.status.map((s) => <td key={s.chave}>{numberFmt.format(Number(m[s.chave]))}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <MonthlyChart series={mensal.status} meses={mensal.meses} />
          )}
        </section>
      </main>
  )
}

const placeholders: Card[] = [
  { chave: 'aguardandoDevolucao', status: 'Aguardando Devolução', total: 0 },
  { chave: 'aguardandoReversa', status: 'Aguardando Reversa', total: 0 },
  { chave: 'aguardandoRetirada', status: 'Aguardando Retirada', total: 0 },
  { chave: 'fc82', status: 'FC82', total: 0 },
]
