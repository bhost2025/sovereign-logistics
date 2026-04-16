import { getContainerById } from '@/lib/containers'
import { StatusBadge, STATUS_CONFIG } from '@/components/status-badge'
import { ChangeStatusForm } from '@/components/change-status-form'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

export default async function ContenedorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [container, t, ts] = await Promise.all([
    getContainerById(id).catch(() => null),
    getTranslations('containers'),
    getTranslations('status'),
  ])
  if (!container) notFound()

  const log = container.container_status_log ?? []
  const clients = container.container_clients ?? []
  const invoices = container.invoices ?? []
  const isLcl = clients.length > 1
  const cfg = STATUS_CONFIG[container.current_status]

  return (
    <div className="p-8 max-w-[1100px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <a href="/tablero" className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase">
            {t('back')}
          </a>
          <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2 font-mono">
            {container.container_number}
          </h1>
          {container.bl_number && (
            <p className="text-xs text-[#8a9aaa] mt-0.5">BL: {container.bl_number}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isLcl && (
            <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded">LCL</span>
          )}
          <StatusBadge status={container.current_status} label={ts(container.current_status as any)} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: info + LCL + facturas */}
        <div className="space-y-5">
          {/* Info del contenedor */}
          <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-5">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-4">{t('tripData')}</h2>
            <div className="space-y-3">
              {[
                { label: t('originPort'), value: container.origin_port },
                { label: t('destPort'),   value: container.destination_port },
                { label: t('departure'),  value: container.departure_date ? new Date(container.departure_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                { label: t('eta'),        value: container.eta_date ? new Date(container.eta_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                { label: t('arrival'),    value: container.arrival_date ? new Date(container.arrival_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold text-[#8a9aaa] uppercase tracking-wider">{label}</span>
                  <span className="text-xs font-semibold text-[#181c1e]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clientes LCL */}
          <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                {isLcl ? `${t('lclClients')} (${clients.length})` : t('client')}
              </h2>
              <a
                href={`/contenedores/${container.id}/agregar-cliente`}
                className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c] transition-colors"
              >
                {t('addClient')}
              </a>
            </div>
            <div className="space-y-3">
              {clients.map((cc, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#181c1e]">{cc.clients?.name}</div>
                    {cc.clients?.contact_name && (
                      <div className="text-[10px] text-[#8a9aaa]">{cc.clients.contact_name}</div>
                    )}
                    {cc.clients?.email && (
                      <div className="text-[10px] text-[#8a9aaa]">{cc.clients.email}</div>
                    )}
                  </div>
                  {cc.share_pct != null && (
                    <span className="text-[10px] font-bold bg-[#f0f2f5] text-[#556479] px-2 py-0.5 rounded shrink-0">
                      {cc.share_pct}%
                    </span>
                  )}
                </div>
              ))}
              {clients.length === 0 && (
                <p className="text-[11px] text-[#b0bac3]">{t('noClients')}</p>
              )}
            </div>
          </div>

          {/* Facturas */}
          <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                {t('invoicesSection')} {invoices.length > 0 && `(${invoices.length})`}
              </h2>
              <a
                href={`/contenedores/${container.id}/facturas/nueva`}
                className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c] transition-colors"
              >
                {t('newInvoice')}
              </a>
            </div>
            {invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#181c1e]">{inv.invoice_number}</div>
                      <div className="text-[10px] text-[#8a9aaa]">{inv.clients?.name}</div>
                    </div>
                    {inv.declared_value && (
                      <span className="text-[10px] font-bold text-[#556479]">
                        {inv.currency} {Number(inv.declared_value).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#b0bac3]">{t('noInvoices')}</p>
            )}
          </div>

          {/* Notas */}
          {container.notes && (
            <div className="bg-[#fdf8ec] border-l-[3px] border-[#B8860B] rounded-r-xl p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#B8860B] mb-1">{t('notes')}</div>
              <p className="text-xs text-[#181c1e]">{container.notes}</p>
            </div>
          )}

          {/* Cambiar estado */}
          <ChangeStatusForm
            containerId={container.id}
            currentStatus={container.current_status}
          />
        </div>

        {/* Columna derecha: Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-6">{t('statusHistory')}</h2>

          {log.length === 0 ? (
            <p className="text-xs text-[#b0bac3] text-center py-8">{t('noHistory')}</p>
          ) : (
            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-[#e8ebee]" />

              <div className="space-y-6">
                {log.map((entry, i) => {
                  const isCurrent = i === log.length - 1
                  const statusCfg = STATUS_CONFIG[entry.new_status]
                  const isDetained = entry.new_status === 'detenido_aduana'

                  return (
                    <div key={entry.id} className="flex gap-4 relative">
                      {/* Dot */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 mt-0.5"
                        style={{
                          background: isCurrent ? statusCfg.color : '#e8ebee',
                          color: isCurrent ? 'white' : '#8a9aaa',
                          boxShadow: isCurrent ? `0 0 0 3px ${statusCfg.color}22` : 'none',
                        }}
                      >
                        {statusCfg.symbol}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-2 ${isDetained ? 'bg-[#fef4ed] border-l-[3px] border-[#C05A00] rounded-r-lg pl-3 pr-2 py-2 -ml-1' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-xs font-bold"
                            style={{ color: isCurrent ? statusCfg.color : '#181c1e' }}
                          >
                            {ts(entry.new_status as any)}
                          </span>
                          <span className="text-[10px] text-[#8a9aaa] shrink-0">
                            {new Date(entry.changed_at).toLocaleDateString('es-MX', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-[11px] text-[#6b7a8a] mt-0.5">{entry.notes}</p>
                        )}
                        {entry.users?.full_name && (
                          <p className="text-[10px] text-[#b0bac3] mt-0.5">{t('by')} {entry.users.full_name}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Estado actual si no hay log */}
          {log.length === 0 && (
            <div className="flex items-center gap-3 p-4 rounded-lg mt-4" style={{ background: cfg.bg }}>
              <span className="text-xl" style={{ color: cfg.color }}>{cfg.symbol}</span>
              <div>
                <div className="text-sm font-bold" style={{ color: cfg.color }}>{ts(container.current_status as any)}</div>
                <div className="text-[10px] text-[#8a9aaa]">{t('currentStatus')}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
