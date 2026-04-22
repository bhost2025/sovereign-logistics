import { getClientById, getClientCargoSnapshot } from '@/lib/clients'
import { StatusBadge } from '@/components/status-badge'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [client, snapshot, tc, tg, ti, locale] = await Promise.all([
    getClientById(id).catch(() => null),
    getClientCargoSnapshot(id),
    getTranslations('cargo'),
    getTranslations('containers'),
    getTranslations('invoices'),
    getLocale(),
  ])
  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'
  if (!client) notFound()

  const containers = client.container_clients?.map((cc: any) => cc.containers).filter(Boolean) ?? []
  const invoices   = (client.invoices as any[]) ?? []

  const TABLE_HEADERS = [tg('container'), tg('route'), tg('eta'), tg('status'), '']

  return (
    <div className="p-8 max-w-[960px] space-y-8">

      {/* Header */}
      <div>
        <a href="/clientes" className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase">
          {tg('backToClients')}
        </a>
        <div className="flex items-start justify-between mt-2">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight">{client.name}</h1>
            <p className="text-[11px] text-[#8a9aaa] mt-0.5">
              {client.contact_name && <span>{client.contact_name} · </span>}
              {client.email && <span>{client.email} · </span>}
              {client.phone && <span>{client.phone}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Cargo Snapshot ─── */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-3">
          {tc('activeTitle')}
        </h2>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: tc('inTransit'),  value: snapshot.inTransit.length, symbol: '◈', color: '#4A6FA5', bg: '#eef2f8' },
            { label: tc('inCustoms'),  value: snapshot.inCustoms.length, symbol: '◆', color: '#B8860B', bg: '#fdf8ec' },
            { label: tc('delivered'),  value: snapshot.delivered.length, symbol: '✓', color: '#1A7A8A', bg: '#edf6f7' },
            { label: tc('totalActive'), value: snapshot.inTransit.length + snapshot.inCustoms.length, symbol: '◱', color: '#0a1a3c', bg: '#f0f2f5' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
              <div className="h-[3px]" style={{ background: kpi.color }} />
              <div className="p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#8a9aaa' }}>
                  {kpi.symbol} {kpi.label}
                </div>
                <div className="text-2xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Declared value */}
        {snapshot.totalValue > 0 && (
          <div className="bg-[#eef2f8] rounded-xl px-5 py-3 flex items-center justify-between mb-5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#556479]">
              ◱ {tc('declaredValue')}
            </span>
            <span className="text-sm font-extrabold text-[#0a1a3c]">
              USD {snapshot.totalValue.toLocaleString(jsLocale, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Active containers table */}
        {(snapshot.inTransit.length > 0 || snapshot.inCustoms.length > 0) ? (
          <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#f0f2f5]">
                  {TABLE_HEADERS.map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...snapshot.inTransit, ...snapshot.inCustoms].map((c: any) => (
                  <tr key={c.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-[#0a1a3c] text-[11px]">{c.container_number}</td>
                    <td className="px-5 py-3 text-[#6b7a8a]">{c.origin_port} → {c.destination_port}</td>
                    <td className="px-5 py-3 text-[#6b7a8a]">
                      {c.eta_date
                        ? new Date(c.eta_date).toLocaleDateString(jsLocale, { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={c.current_status} /></td>
                    <td className="px-5 py-3">
                      <a href={`/contenedores/${c.id}`} className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">{tg('view')}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] px-5 py-8 text-center">
            <p className="text-2xl mb-2">✓</p>
            <p className="text-xs text-[#b0bac3]">{tc('noCargo')}</p>
          </div>
        )}
      </div>

      {/* ─── Historial de Contenedores ─── */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-3">
          {tc('containerHistory')} ({containers.length})
        </h2>
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#f0f2f5]">
                {TABLE_HEADERS.map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {containers.map((c: any) => (
                <tr key={c.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-[#0a1a3c] text-[11px]">{c.container_number}</td>
                  <td className="px-5 py-3 text-[#6b7a8a]">{c.origin_port} → {c.destination_port}</td>
                  <td className="px-5 py-3 text-[#6b7a8a]">
                    {c.eta_date
                      ? new Date(c.eta_date).toLocaleDateString(jsLocale, { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={c.current_status} /></td>
                  <td className="px-5 py-3">
                    <a href={`/contenedores/${c.id}`} className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">{tg('view')}</a>
                  </td>
                </tr>
              ))}
              {containers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#b0bac3]">
                    {tc('noContainers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Facturas ─── */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-3">
          {tc('invoicesTitle')} ({invoices.length})
        </h2>
        <div className="space-y-4">
          {invoices.map((inv: any) => (
            <div key={inv.id} className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f5]">
                <div>
                  <span className="font-bold text-[#0a1a3c] text-sm">{inv.invoice_number}</span>
                  <span className="ml-3 text-[10px] text-[#8a9aaa]">
                    {tc('containerLabel')}: <span className="font-mono font-bold">{inv.containers?.container_number ?? '—'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {inv.declared_value && (
                    <span className="text-xs font-bold text-[#181c1e]">
                      {inv.currency} {Number(inv.declared_value).toLocaleString(jsLocale, { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    inv.status === 'pagada'    ? 'bg-[#edf6f7] text-[#1A7A8A]' :
                    inv.status === 'cancelada' ? 'bg-[#fef4ed] text-[#C05A00]' :
                                                 'bg-[#fdf8ec] text-[#B8860B]'
                  }`}>
                    {inv.status === 'pagada' ? `✓ ${ti('pagada')}` : inv.status === 'cancelada' ? `✕ ${ti('cancelada')}` : `◆ ${ti('pendiente')}`}
                  </span>
                </div>
              </div>

              {inv.invoice_items?.length > 0 && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#f0f2f5]">
                      {[tc('description'), tc('quantity'), tc('unit'), tc('unitPrice'), tc('total')].map(h => (
                        <th key={h} className="px-5 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inv.invoice_items.map((item: any) => (
                      <tr key={item.id} className="border-b border-[#f7fafc]">
                        <td className="px-5 py-2.5 text-[#181c1e]">{item.description}</td>
                        <td className="px-5 py-2.5 text-[#6b7a8a]">{item.quantity}</td>
                        <td className="px-5 py-2.5 text-[#6b7a8a]">{item.unit ?? '—'}</td>
                        <td className="px-5 py-2.5 text-[#6b7a8a]">
                          {Number(item.unit_price).toLocaleString(jsLocale, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-2.5 font-bold text-[#0a1a3c]">
                          {Number(item.total).toLocaleString(jsLocale, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {(!inv.invoice_items || inv.invoice_items.length === 0) && (
                <p className="px-6 py-4 text-[11px] text-[#b0bac3]">{tc('noProductsShort')}</p>
              )}
            </div>
          ))}
          {invoices.length === 0 && (
            <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] px-6 py-8 text-center text-[#b0bac3] text-xs">
              {tc('noInvoices')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
