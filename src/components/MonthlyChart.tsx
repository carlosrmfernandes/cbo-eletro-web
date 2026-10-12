import { useLayoutEffect, useRef, useState } from 'react'
import { formatMes, numberFmt } from '../lib/format'

export interface Serie {
  chave: string
  nome: string
}

export type LinhaMes = { mes: string } & Record<string, number | string>

const HEIGHT = 300
const M = { top: 16, right: 8, bottom: 32, left: 40 }
const BAR_MAX = 24
const GAP = 2
const RADIUS = 4

// Escala "redonda" para o eixo Y: 0, 5, 10... / 0, 20, 40...
function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1]
  const raw = max / count
  const pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw)!
  const ticks: number[] = []
  for (let v = 0; v < max + step; v += step) ticks.push(v)
  return ticks
}

// Coluna com topo arredondado de 4px e base reta.
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(RADIUS, w / 2, h)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

export default function MonthlyChart({ series, meses }: { series: Serie[]; meses: LinhaMes[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const max = Math.max(0, ...meses.flatMap((m) => series.map((s) => Number(m[s.chave]))))
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]
  const plotW = Math.max(0, width - M.left - M.right)
  const plotH = HEIGHT - M.top - M.bottom
  const band = meses.length ? plotW / meses.length : 0
  const barW = Math.max(2, Math.min(BAR_MAX, (band * 0.75 - GAP * (series.length - 1)) / series.length))
  const groupW = barW * series.length + GAP * (series.length - 1)
  const y = (v: number) => M.top + plotH - (v / top) * plotH
  // Em telas estreitas, mostra só um a cada N rótulos de mês para não sobrepor.
  const labelEvery = Math.max(1, Math.ceil(48 / Math.max(band, 1)))

  const hovered = hover !== null ? meses[hover] : null
  const tipLeft = hover !== null ? M.left + band * hover + band / 2 : 0

  return (
    <div className="chart" ref={wrapRef}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label="Pedidos por mês em cada status">
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
              <text className="chart-tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
                {numberFmt.format(t)}
              </text>
            </g>
          ))}

          {meses.map((m, i) => {
            const x0 = M.left + band * i
            return (
              <g key={m.mes}>
                {hover === i && <rect className="chart-hover-band" x={x0} y={M.top} width={band} height={plotH} />}
                {series.map((s, j) => {
                  const v = Number(m[s.chave])
                  if (!v) return null
                  const x = x0 + (band - groupW) / 2 + j * (barW + GAP)
                  return <path key={s.chave} className={`chart-bar serie-${j + 1}`} d={barPath(x, y(v), barW, y(0) - y(v))} />
                })}
                {i % labelEvery === 0 && (
                  <text className="chart-tick" x={x0 + band / 2} y={HEIGHT - M.bottom + 18} textAnchor="middle">
                    {formatMes(m.mes)}
                  </text>
                )}
                <rect
                  x={x0} y={M.top} width={band} height={plotH} fill="transparent"
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                  onTouchStart={() => setHover(i)}
                />
              </g>
            )
          })}
          <line className="chart-axis" x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} />
        </svg>
      )}

      {hovered && (
        <div
          className="chart-tooltip"
          style={{ left: tipLeft, transform: `translateX(${tipLeft > width / 2 ? 'calc(-100% - 12px)' : '12px'})` }}
        >
          <strong>{formatMes(hovered.mes, true)}</strong>
          {series.map((s, j) => (
            <div key={s.chave} className="chart-tooltip-row">
              <span className={`swatch serie-${j + 1}`} />
              <span>{s.nome}</span>
              <span className="chart-tooltip-value">{numberFmt.format(Number(hovered[s.chave]))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
