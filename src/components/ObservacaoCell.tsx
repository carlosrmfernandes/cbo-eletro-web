import { useState } from 'react'
import { createPortal } from 'react-dom'
import AnotacoesModal, { type Anotacao } from './AnotacoesModal'

interface Props {
  pedido: string
  cliente?: string
  // Última anotação e quantas o pedido tem.
  texto: string
  por: string | null
  em: string | null
  qtd: number
  onAtualizado: (anotacoes: Anotacao[]) => void
}

const quandoFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

// Anotações do pedido, compartilhadas entre todos: na coluna só a lâmpada; o clique abre o histórico.
export default function ObservacaoCell({ pedido, cliente, texto, por, em, qtd, onAtualizado }: Props) {
  const [aberto, setAberto] = useState(false)

  const autoria = por && em ? `${por} em ${quandoFmt.format(new Date(em))}` : ''
  const dica = qtd
    ? `${qtd === 1 ? '1 anotação' : `${qtd} anotações`}. Última:\n${texto}${autoria ? `\n— ${autoria}` : ''}`
    : 'Clique para adicionar uma anotação'

  return (
    <td className="obs-cell" title={dica}>
      <button type="button" className="obs-view" onClick={() => setAberto(true)}>
        {qtd ? (
          <>
            <Lampada />
            {qtd > 1 && <span className="obs-qtd">{qtd}</span>}
          </>
        ) : (
          <span className="obs-vazia">+ Adicionar</span>
        )}
      </button>
      {/* No body, para o modal não herdar os estilos da célula. */}
      {aberto &&
        createPortal(
          <AnotacoesModal pedido={pedido} cliente={cliente} onAtualizado={onAtualizado} onClose={() => setAberto(false)} />,
          document.body,
        )}
    </td>
  )
}

// Lâmpada amarela: sinaliza que o pedido tem anotação.
function Lampada() {
  return (
    <svg className="obs-lampada" viewBox="0 0 24 24" width="16" height="16" aria-label="Tem anotação" role="img">
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
