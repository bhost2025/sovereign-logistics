import { getContainersByStatus } from '@/lib/containers'
import { StatusBadge, STATUS_CONFIG, type ContainerStatus } from '@/components/status-badge'
import { getTranslations, getLocale } from 'next-intl/server'

const COLUMNS: ContainerStatus[] = [
  'en_puerto_origen', 'zarpo', 'en_transito_maritimo', 'eta_puerto_destino',
  'en_aduana', 'liberado_aduana', 'detenido_aduana', 'transito_terrestre', 'entregado',
]

export default async function TableroPage() {
  const [containers, t, tn, tc, locale] = await Promise.all([
    getContainersByStatus(),
    getTranslations('status'),
    getTranslations('nav'),
    getTranslations('containers'),
    getLocale(),
  ])
  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'

  const byStatus = COLUMNS.reduce((acc, s) => {
    acc[s] = containers.filter(c => c.current_status === s)
    return acc
  }, {} as Record<ContainerStatus, typeof containers>)

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <div className="px-8 py-4 flex items-center justify-between border-b border-[#e8ebee] bg-white/60 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="text-base font-extrabold text-[#0a1a3c] tracking-tight">{tn('tablero')}</h1>
          <p className="text-[10px] text-[#8a9aaa] font-medium">{containers.length} {tn('contenedores').toLowerCase()}</p>
        </div>
        <a
          href="/contenedores/nuevo"
          className="bg-[#0a1a3c] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#142a5c] transition-colors"
        >
          + {tn('contenedores')}
        </a>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(status => {
            const cfg    = STATUS_CONFIG[status]
            const label  = t(status as any)
            const cards  = byStatus[status]
            const isAlert = status === 'detenido_aduana'

            return (
              <div key={status} className="w-[210px] shrink-0 flex flex-col">
                {/* Column header */}
                <div
                  className="rounded-t-lg px-3 py-2 flex items-center justify-between"
                  style={{ background: cfg.bg, borderTop: `3px solid ${cfg.color}` }}
                >
                  <span className="text-[11px] font-bold" style={{ color: cfg.color }}>
                    {cfg.symbol} {label}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: isAlert && cards.length > 0 ? '#C05A00' : cfg.color + '22',
                      color: isAlert && cards.length > 0 ? 'white' : cfg.color,
                    }}
                  >
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 bg-[#f0f2f5] rounded-b-lg p-2 space-y-2 overflow-y-auto min-h-[200px]">
                  {cards.map(c => {
                    const clients = c.container_clients ?? []
                    const isLcl = clients.length > 1
                    const clientName = clients[0]?.clients?.name ?? '—'

                    return (
                      <a
                        key={c.id}
                        href={`/contenedores/${c.id}`}
                        className="block bg-white rounded-lg p-3 shadow-[0_1px_8px_rgba(24,28,30,0.07)] hover:shadow-[0_2px_16px_rgba(24,28,30,0.12)] transition-shadow"
                        style={isAlert ? { borderLeft: `3px solid #C05A00` } : {}}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[11px] font-extrabold text-[#0a1a3c] tracking-tight font-mono">
                            {c.container_number}
                          </span>
                          {isLcl && (
                            <span className="text-[9px] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded shrink-0">
                              LCL
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#6b7a8a] font-medium truncate">
                          {clientName}{isLcl && ` +${clients.length - 1}`}
                        </div>
                        <div className="text-[10px] text-[#8a9aaa] mt-1">
                          {c.origin_port} → {c.destination_port}
                        </div>
                        {c.eta_date && (
                          <div className="text-[9px] font-bold text-[#8a9aaa] mt-1.5">
                            ETA {new Date(c.eta_date).toLocaleDateString(jsLocale, { day: '2-digit', month: 'short' })}
                          </div>
                        )}
                      </a>
                    )
                  })}
                  {cards.length === 0 && (
                    <div className="text-center text-[10px] text-[#b0bac3] py-6">{tc('emptyColumn')}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
