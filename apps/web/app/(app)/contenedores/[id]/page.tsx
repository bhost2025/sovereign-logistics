import { getContainerById } from '@/lib/containers'
import { StatusBadge, STATUS_CONFIG } from '@/components/status-badge'
import { ChangeStatusForm } from '@/components/change-status-form'
import { DocumentsTab } from '@/components/documents-tab'
import { LclClientPanel } from '@/components/lcl-client-panel'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { can } from '@/lib/auth/can'
import { softDeleteContainer } from '../actions'

type Tab = 'info' | 'documentos' | 'historial' | 'facturas'
const TAB_IDS: Tab[] = ['info', 'documentos', 'historial', 'facturas']

function formatLastSeen(updatedAt: string, locale: string) {
  const diff = Date.now() - new Date(updatedAt).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (mins < 1)   return rtf.format(0, 'minute')
  if (mins < 60)  return rtf.format(-mins, 'minute')
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-days, 'day')
}

function dateLocale(locale: string) {
  if (locale === 'zh') return 'zh-CN'
  if (locale === 'en') return 'en-US'
  return 'es-MX'
}

export default async function ContenedorDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; doc_status?: string }>
}) {
  const { id }                  = await params
  const { tab: tabParam, doc_status: docStatusParam } = await searchParams

  const activeTab: Tab = (TAB_IDS.find(id => id === tabParam) as Tab | undefined) ?? 'info'

  const [container, t, ts, locale, canEdit, canDelete] = await Promise.all([
    getContainerById(id).catch(() => null),
    getTranslations('containers'),
    getTranslations('status'),
    getLocale(),
    can('edit_containers'),
    can('delete_containers'),
  ])
  if (!container) notFound()

  const log      = container.container_status_log ?? []
  const clients  = container.container_clients ?? []
  const invoices = container.invoices ?? []
  const products = (container as any).container_products ?? []
  const isLcl    = clients.length > 1
  const cfg      = STATUS_CONFIG[container.current_status]
  const lastUpdater = (container as any).last_updater?.full_name as string | undefined

  return (
    <div className="p-8 max-w-[1100px]">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
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
          {/* Last seen */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-[#8a9aaa]">
            <span>◎</span>
            <span>
              {t('lastUpdated')}: <strong className="text-[#556479]">{formatLastSeen(container.updated_at, locale)}</strong>
              {lastUpdater && <> · {t('by')} <strong className="text-[#556479]">{lastUpdater}</strong></>}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLcl && (
            <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded">LCL</span>
          )}
          <StatusBadge status={container.current_status} label={ts(container.current_status as any)} />
          {canEdit && (
            <a
              href={`/contenedores/${container.id}/editar`}
              className="text-xs font-bold text-[#4A6FA5] border border-[#4A6FA5] px-3 py-1.5 rounded-lg hover:bg-[#eef2f8] transition-colors"
            >
              ◈ {t('editBtn')}
            </a>
          )}
          {canDelete && (
            <form action={softDeleteContainer.bind(null, container.id)} onSubmit={(e) => {
              if (!confirm(t('deleteConfirm'))) e.preventDefault()
            }}>
              <button
                type="submit"
                className="text-xs font-bold text-[#C05A00] border border-[#C05A00] px-3 py-1.5 rounded-lg hover:bg-[#fef4ed] transition-colors"
              >
                ▲ {t('archiveBtn')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-0.5 mb-6 border-b border-[#e8ebee]">
        {TAB_IDS.map(tabId => {
          const labelKey = tabId === 'info' ? 'tabInfo' : tabId === 'documentos' ? 'tabDocuments' : tabId === 'historial' ? 'tabHistory' : 'tabInvoices'
          return (
            <a
              key={tabId}
              href={`/contenedores/${container.id}?tab=${tabId}`}
              className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-px ${
                activeTab === tabId
                  ? 'border-[#0a1a3c] text-[#0a1a3c]'
                  : 'border-transparent text-[#8a9aaa] hover:text-[#181c1e]'
              }`}
            >
              {t(labelKey as any)}
            </a>
          )
        })}
      </div>

      {/* Tab: Información */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-5">

            {/* Info del contenedor */}
            <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-4">{t('tripData')}</h2>
              <div className="space-y-3">
                {[
                  { label: t('originPort'), value: container.origin_port },
                  { label: t('destPort'),   value: container.destination_port },
                  { label: t('departure'),  value: container.departure_date ? new Date(container.departure_date).toLocaleDateString(dateLocale(locale), { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                  { label: t('eta'),        value: container.eta_date ? new Date(container.eta_date).toLocaleDateString(dateLocale(locale), { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                  { label: t('arrival'),    value: container.arrival_date ? new Date(container.arrival_date).toLocaleDateString(dateLocale(locale), { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-[#8a9aaa] uppercase tracking-wider">{label}</span>
                    <span className="text-xs font-semibold text-[#181c1e]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clientes LCL — interactivo */}
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
              <LclClientPanel
                containerId={container.id}
                clients={clients as any}
                products={products}
                invoices={invoices as any}
                isLcl={isLcl}
              />
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

          {/* Columna derecha: Timeline (resumen) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{t('statusHistory')}</h2>
              <a href={`/contenedores/${container.id}?tab=historial`} className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">
                {t('viewAll')}
              </a>
            </div>
            {log.length === 0 ? (
              <p className="text-xs text-[#b0bac3] text-center py-8">{t('noHistory')}</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-[#e8ebee]" />
                <div className="space-y-5">
                  {log.slice(-4).map((entry, i, arr) => {
                    const isCurrent  = i === arr.length - 1
                    const statusCfg  = STATUS_CONFIG[entry.new_status]
                    const isDetained = entry.new_status === 'detenido_aduana'
                    return (
                      <div key={entry.id} className="flex gap-4 relative">
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
                        <div className={`flex-1 pb-2 ${isDetained ? 'bg-[#fef4ed] border-l-[3px] border-[#C05A00] rounded-r-lg pl-3 pr-2 py-2 -ml-1' : ''}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold" style={{ color: isCurrent ? statusCfg.color : '#181c1e' }}>
                              {ts(entry.new_status as any)}
                            </span>
                            <span className="text-[10px] text-[#8a9aaa] shrink-0">
                              {new Date(entry.changed_at).toLocaleDateString(dateLocale(locale), { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          {entry.notes && <p className="text-[11px] text-[#6b7a8a] mt-0.5">{entry.notes}</p>}
                          {entry.users?.full_name && <p className="text-[10px] text-[#b0bac3] mt-0.5">{t('by')} {entry.users.full_name}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Documentos */}
      {activeTab === 'documentos' && (
        <DocumentsTab containerId={container.id} filterStatus={docStatusParam} />
      )}

      {/* Tab: Historial completo */}
      {activeTab === 'historial' && (
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-6">{t('statusHistory')}</h2>
          {log.length === 0 ? (
            <p className="text-xs text-[#b0bac3] text-center py-8">{t('noHistory')}</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-[#e8ebee]" />
              <div className="space-y-6">
                {log.map((entry, i) => {
                  const isCurrent  = i === log.length - 1
                  const statusCfg  = STATUS_CONFIG[entry.new_status]
                  const isDetained = entry.new_status === 'detenido_aduana'
                  return (
                    <div key={entry.id} className="flex gap-4 relative">
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
                      <div className={`flex-1 pb-2 ${isDetained ? 'bg-[#fef4ed] border-l-[3px] border-[#C05A00] rounded-r-lg pl-3 pr-2 py-2 -ml-1' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold" style={{ color: isCurrent ? statusCfg.color : '#181c1e' }}>
                            {ts(entry.new_status as any)}
                          </span>
                          <span className="text-[10px] text-[#8a9aaa] shrink-0">
                            {new Date(entry.changed_at).toLocaleDateString(dateLocale(locale), { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {entry.notes && <p className="text-[11px] text-[#6b7a8a] mt-0.5">{entry.notes}</p>}
                        {entry.users?.full_name && <p className="text-[10px] text-[#b0bac3] mt-0.5">{t('by')} {entry.users.full_name}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Facturas */}
      {activeTab === 'facturas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#0a1a3c]">
              {t('invoicesSection')} {invoices.length > 0 && `(${invoices.length})`}
            </h2>
            <a
              href={`/contenedores/${container.id}/facturas/nueva`}
              className="bg-[#0a1a3c] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#142a5c] transition-colors"
            >
              {t('newInvoice')}
            </a>
          </div>
          {invoices.length > 0 ? (
            <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#f0f2f5]">
                    {[t('invoiceNumber'), t('client'), t('description'), t('value')].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                      <td className="px-5 py-3 font-bold text-[#0a1a3c]">{inv.invoice_number}</td>
                      <td className="px-5 py-3 text-[#6b7a8a]">{inv.clients?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-[#6b7a8a]">{inv.description ?? '—'}</td>
                      <td className="px-5 py-3 font-bold text-[#556479]">
                        {inv.declared_value ? `${inv.currency} ${Number(inv.declared_value).toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-12 text-center">
              <p className="text-2xl mb-2">◱</p>
              <p className="text-sm text-[#b0bac3]">{t('noInvoices')}</p>
              <a
                href={`/contenedores/${container.id}/facturas/nueva`}
                className="inline-block mt-4 text-xs font-bold text-[#4A6FA5] hover:text-[#0a1a3c]"
              >
                {t('newInvoice')} →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
