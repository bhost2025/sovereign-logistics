import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG: Record<string, { label: string; symbol: string; color: string; bg: string }> = {
  en_puerto_origen:     { label: 'Puerto Origen',  symbol: '◎', color: '#556479', bg: '#f0f2f5' },
  zarpo:                { label: 'Zarpó',           symbol: '▶', color: '#4A6FA5', bg: '#eef2f8' },
  en_transito_maritimo: { label: 'En Tránsito',     symbol: '◈', color: '#4A6FA5', bg: '#eef2f8' },
  eta_puerto_destino:   { label: 'ETA Puerto',      symbol: '◉', color: '#4A6FA5', bg: '#eef2f8' },
  en_aduana:            { label: 'En Aduana',       symbol: '◆', color: '#B8860B', bg: '#fdf8ec' },
  liberado_aduana:      { label: 'Liberado',        symbol: '✓', color: '#1A7A8A', bg: '#edf6f7' },
  detenido_aduana:      { label: 'Detenido',        symbol: '▲', color: '#C05A00', bg: '#fef4ed' },
  transito_terrestre:   { label: 'T. Terrestre',    symbol: '◱', color: '#7A6A00', bg: '#fdf9e6' },
  entregado:            { label: 'Entregado',       symbol: '✓', color: '#1A7A8A', bg: '#edf6f7' },
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: container } = await (supabase as any)
    .from('containers')
    .select(`
      container_number, bl_number, origin_port, destination_port,
      current_status, departure_date, eta_date, arrival_date,
      container_status_log(
        id, new_status, notes, changed_at,
        users(full_name)
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .order('changed_at', { referencedTable: 'container_status_log', ascending: true })
    .single()

  if (!container) notFound()

  const cfg = STATUS_CONFIG[container.current_status] ?? STATUS_CONFIG.en_puerto_origen
  const log = container.container_status_log ?? []
  const isDetained = container.current_status === 'detenido_aduana'

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'

  return (
    <div className="min-h-screen bg-[#f7fafc] font-sans">
      {/* Header navy */}
      <div className="bg-[#0a1a3c] px-6 py-5 flex items-center gap-4">
        <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center text-sm font-extrabold text-white">S</div>
        <div>
          <div className="text-[11px] font-bold text-white/60 tracking-widest uppercase">Sovereign Logistics</div>
          <div className="text-[10px] text-white/40">Rastreo de Contenedor</div>
        </div>
      </div>

      <div className="max-w-[640px] mx-auto px-6 py-8 space-y-6">

        {/* Container header card */}
        <div className="bg-white rounded-2xl shadow-[0_1px_20px_rgba(24,28,30,0.07)] overflow-hidden">
          <div className="h-[4px]" style={{ background: cfg.color }} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-1">Contenedor</p>
                <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight font-mono">
                  {container.container_number}
                </h1>
                {container.bl_number && (
                  <p className="text-[11px] text-[#8a9aaa] mt-0.5">BL: {container.bl_number}</p>
                )}
              </div>
              <span
                className="inline-flex items-center gap-1.5 pl-0 pr-3 py-1 rounded text-sm font-bold shrink-0 mt-1"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                <span className="w-[3px] self-stretch rounded-l" style={{ background: cfg.color }} />
                {cfg.symbol} {cfg.label}
              </span>
            </div>

            {isDetained && (
              <div className="mt-4 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
                ▲ Este contenedor está detenido en aduana. Contacta a tu agente para más información.
              </div>
            )}
          </div>
        </div>

        {/* Trip data */}
        <div className="bg-white rounded-2xl shadow-[0_1px_20px_rgba(24,28,30,0.07)] p-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-4">Datos del Viaje</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Puerto Origen',  value: container.origin_port },
              { label: 'Puerto Destino', value: container.destination_port },
              { label: 'Fecha de Salida', value: fmtDate(container.departure_date) },
              { label: 'ETA',             value: fmtDate(container.eta_date) },
              ...(container.arrival_date ? [{ label: 'Llegada Real', value: fmtDate(container.arrival_date) }] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-[#8a9aaa] mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-[#0a1a3c]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status timeline */}
        {log.length > 0 && (
          <div className="bg-white rounded-2xl shadow-[0_1px_20px_rgba(24,28,30,0.07)] p-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-5">Historial de Estados</h2>
            <div className="space-y-0">
              {log.map((entry: any, i: number) => {
                const entryCfg = STATUS_CONFIG[entry.new_status] ?? STATUS_CONFIG.en_puerto_origen
                const isCurrent = i === log.length - 1
                return (
                  <div key={entry.id} className="flex gap-4">
                    {/* Timeline spine */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full mt-0.5 shrink-0 border-2"
                        style={{
                          background: isCurrent ? entryCfg.color : '#fff',
                          borderColor: isCurrent ? entryCfg.color : '#d0d5de',
                        }}
                      />
                      {i < log.length - 1 && (
                        <div className="w-px flex-1 bg-[#e8ebee] my-1" />
                      )}
                    </div>
                    {/* Entry content */}
                    <div className={`pb-5 min-w-0 flex-1 ${i === log.length - 1 ? 'pb-0' : ''}`}>
                      <p className={`text-sm font-bold ${isCurrent ? '' : 'text-[#556479]'}`} style={isCurrent ? { color: entryCfg.color } : {}}>
                        {entryCfg.symbol} {entryCfg.label}
                      </p>
                      {entry.notes && (
                        <p className="text-[11px] text-[#6b7a8a] mt-0.5">{entry.notes}</p>
                      )}
                      <p className="text-[10px] text-[#b0bac3] mt-1">
                        {new Date(entry.changed_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {entry.users?.full_name && ` · ${entry.users.full_name}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-[#b0bac3]">
          Sovereign Logistics · Información actualizada automáticamente
        </p>
      </div>
    </div>
  )
}
