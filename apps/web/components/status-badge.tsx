import type { Database } from '@sovereign/db'

export type ContainerStatus = Database['public']['Enums']['container_status']

export const STATUS_CONFIG: Record<ContainerStatus, {
  label: string   // fallback label (es)
  symbol: string
  color: string
  bg: string
}> = {
  en_puerto_origen:     { label: 'Puerto Origen',  symbol: '◎', color: '#556479', bg: '#f0f2f5' },
  zarpo:                { label: 'Zarpó',           symbol: '▶', color: '#4A6FA5', bg: '#eef2f8' },
  en_transito_maritimo: { label: 'En Tránsito',     symbol: '◈', color: '#4A6FA5', bg: '#eef2f8' },
  eta_puerto_destino:   { label: 'ETA Puerto',      symbol: '◉', color: '#4A6FA5', bg: '#eef2f8' },
  en_aduana:            { label: 'En Aduana',       symbol: '◆', color: '#B8860B', bg: '#fdf8ec' },
  liberado_aduana:      { label: 'Liberado ✓',      symbol: '✓', color: '#1A7A8A', bg: '#edf6f7' },
  detenido_aduana:      { label: 'Detenido ▲',      symbol: '▲', color: '#C05A00', bg: '#fef4ed' },
  transito_terrestre:   { label: 'T. Terrestre',    symbol: '◱', color: '#7A6A00', bg: '#fdf9e6' },
  entregado:            { label: 'Entregado',        symbol: '✓', color: '#2D7A4F', bg: '#e6f4ea' },
}

export function StatusBadge({ status, label }: { status: ContainerStatus; label?: string }) {
  const cfg = STATUS_CONFIG[status]
  const text = label ?? cfg.label
  return (
    <span
      className="inline-flex items-center gap-1.5 pr-2.5 py-0.5 rounded text-[11px] font-bold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="w-[3px] self-stretch rounded-l" style={{ background: cfg.color }} />
      {cfg.symbol} {text}
    </span>
  )
}
