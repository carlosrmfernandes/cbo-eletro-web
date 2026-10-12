const mesCurto = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const mesLongo = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

export const numberFmt = new Intl.NumberFormat('pt-BR')

// '2026-09' -> 'set/26' (curto) ou 'setembro de 2026' (longo)
export function formatMes(mes: string, longo = false) {
  return (longo ? mesLongo : mesCurto).format(new Date(`${mes}-01T00:00:00Z`)).replace('.', '').replace(' de ', longo ? ' de ' : '/')
}
