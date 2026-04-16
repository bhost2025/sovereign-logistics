import { getContainersByStatus, getKpiSummary, getContainersProximosEta, getDirectorStats } from '@/lib/containers'
import { KpiCard } from '@/components/kpi-card'
import { StatusBadge } from '@/components/status-badge'
import { getTranslations } from 'next-intl/server'

const INVOICE_STATUS_LABEL: Record<string, string> = {
  pendiente:  'Pendiente',
  pagada:     'Pagada',
  cancelada:  'Cancelada',
}
const INVOICE_STATUS_COLOR: Record<string, string> = {
  pendiente:  'text-amber-600 bg-amber-50',
  pagada:     'text-emerald-600 bg-emerald-50',
  cancelada:  'text-red-500 bg-red-50',
}

export default async function DashboardPage() {
  const [containers, kpis, proximos, stats, t, ts, ti] = await Promise.all([
    getContainersByStatus(),
    getKpiSummary(),
    getContainersProximosEta(30),
    getDirectorStats(),
    getTranslations('dashboard'),
    getTranslations('status'),
    getTranslations('invoices'),
  ])

  const detenidos = containers.filter(c => c.current_status === 'detenido_aduana')
  const totalFacturado = Object.values(stats.invoiceStats as Record<string, { count: number; total: number }>)
    .reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="p-8 max-w-[1200px] space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight">{t('title')}</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">{t('subtitle')}</p>
        </div>
        <a
          href="/dashboard/reporte"
          target="_blank"
          className="flex items-center gap-2 bg-[#0a1a3c] text-white text-xs font-bold px-4 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
        >
          {t('exportPdf')}
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label={t('total')}     value={kpis.total}       symbol="◱" accentColor="#4A6FA5" />
        <KpiCard label={t('inTransit')} value={kpis.en_transito} symbol="▶" accentColor="#1A7A8A" />
        <KpiCard label={t('inCustoms')} value={kpis.en_aduana}   symbol="◆" accentColor="#B8860B" />
        <KpiCard label={t('detained')}  value={kpis.detenidos}   symbol="▲" accentColor="#C05A00" />
        <KpiCard label={t('delivered')} value={kpis.entregados}  symbol="✓" accentColor="#2D7A4F" />
      </div>

      {/* Fila 2: Facturas + Top Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Resumen de Facturas */}
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-4">{t('invoices')}</h2>
          <div className="space-y-3 mb-4">
            {(['pendiente', 'pagada', 'cancelada'] as const).map(status => {
              const s = (stats.invoiceStats as any)[status] ?? { count: 0, total: 0 }
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${INVOICE_STATUS_COLOR[status]}`}>
                      {ti(status)}
                    </span>
                    <span className="text-[11px] text-[#8a9aaa]">{s.count} docs</span>
                  </div>
                  <span className="text-xs font-bold text-[#181c1e]">
                    ${s.total.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="border-t border-[#f0f2f5] pt-3 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{t('totalDeclared')}</span>
            <span className="text-sm font-extrabold text-[#0a1a3c]">
              ${totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Top Clientes */}
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-4">{t('topClients')}</h2>
          <div className="space-y-3">
            {(stats.topClients as { name: string; count: number }[]).map((c, i) => {
              const max = (stats.topClients as any[])[0]?.count || 1
              const pct = Math.round((c.count / max) * 100)
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-[#181c1e] truncate">{c.name}</span>
                    <span className="text-[10px] font-bold text-[#8a9aaa] shrink-0 ml-2">{c.count} cont.</span>
                  </div>
                  <div className="h-1.5 bg-[#f0f2f5] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: i === 0 ? '#4A6FA5' : '#c5c6cf' }}
                    />
                  </div>
                </div>
              )
            })}
            {(stats.topClients as any[]).length === 0 && (
              <p className="text-xs text-[#b0bac3] text-center py-4">{t('sinDatos')}</p>
            )}
          </div>
        </div>

        {/* Volumen por mes */}
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-6">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-4">{t('volumeMonth')}</h2>
          <div className="space-y-2">
            {(stats.containersByMonth as { month: string; label: string; count: number }[]).map(m => {
              const max = Math.max(...(stats.containersByMonth as any[]).map((x: any) => x.count), 1)
              const pct = Math.round((m.count / max) * 100)
              return (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-[#8a9aaa] w-12 shrink-0 uppercase">{m.label}</span>
                  <div className="flex-1 h-4 bg-[#f0f2f5] rounded overflow-hidden">
                    <div
                      className="h-full rounded bg-[#4A6FA5] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#181c1e] w-4 text-right">{m.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Fila 3: Próximos ETAs + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Próximos a llegar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#0a1a3c]">{t('upcoming')}</h2>
            <span className="text-[10px] font-bold text-[#8a9aaa]">{t('next30')}</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#f0f2f5]">
                {['Contenedor', 'Cliente', 'Ruta', 'ETA', 'Estado'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proximos.map(c => {
                const clientName = (c.container_clients as any[])?.[0]?.clients?.name ?? '—'
                const isLcl = (c.container_clients as any[])?.length > 1
                const eta = new Date(c.eta_date!)
                const daysLeft = Math.ceil((eta.getTime() - Date.now()) / 86400000)
                return (
                  <tr key={c.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-[#0a1a3c] text-[11px]">
                      {c.container_number}
                    </td>
                    <td className="px-5 py-3 text-[#181c1e]">
                      {clientName}
                      {isLcl && <span className="ml-1.5 text-[9px] bg-sky-100 text-sky-700 font-bold px-1 py-0.5 rounded">LCL</span>}
                    </td>
                    <td className="px-5 py-3 text-[#6b7a8a]">{c.origin_port} → {c.destination_port}</td>
                    <td className="px-5 py-3">
                      <div className="text-[#181c1e] font-semibold">
                        {eta.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className={`text-[9px] font-bold ${daysLeft <= 7 ? 'text-amber-600' : 'text-[#b0bac3]'}`}>
                        {daysLeft === 0 ? t('today') : daysLeft === 1 ? t('tomorrow') : t('inDays', { days: daysLeft })}
                      </div>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={c.current_status} label={ts(c.current_status as any)} /></td>
                  </tr>
                )
              })}
              {proximos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#b0bac3]">
                    {t('noUpcoming')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Alertas */}
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#0a1a3c]">▲ {t('alerts')}</h2>
            {detenidos.length > 0 && (
              <span className="text-[10px] font-bold bg-[#fef4ed] text-[#C05A00] px-2 py-0.5 rounded">
                {detenidos.length} detenido{detenidos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="p-4 space-y-3">
            {detenidos.map(c => {
              const clientName = c.container_clients?.[0]?.clients?.name ?? '—'
              return (
                <div key={c.id} className="p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00]">
                  <div className="font-mono font-bold text-[11px] text-[#0a1a3c]">{c.container_number}</div>
                  <div className="text-[10px] text-[#6b7a8a] mt-0.5">{clientName}</div>
                  <div className="text-[10px] text-[#C05A00] font-semibold mt-0.5">{t('detainedCustoms')}</div>
                  <div className="text-[10px] text-[#8a9aaa]">{c.origin_port} → {c.destination_port}</div>
                </div>
              )
            })}
            {detenidos.length === 0 && (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">✓</p>
                <p className="text-[11px] text-[#b0bac3]">{t('noAlerts')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
