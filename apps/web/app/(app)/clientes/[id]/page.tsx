import { getClientById } from '@/lib/clients'
import { StatusBadge } from '@/components/status-badge'
import { notFound } from 'next/navigation'

const STATUS_LABEL: Record<string, string> = {
  pendiente:  'Pendiente',
  pagada:     'Pagada',
  cancelada:  'Cancelada',
}

const STATUS_COLOR: Record<string, string> = {
  pendiente:  'bg-yellow-100 text-yellow-700',
  pagada:     'bg-green-100 text-green-700',
  cancelada:  'bg-red-100 text-red-600',
}

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClientById(id).catch(() => null)
  if (!client) notFound()

  const containers = client.container_clients?.map((cc: any) => cc.containers).filter(Boolean) ?? []
  const invoices   = (client.invoices as any[]) ?? []

  return (
    <div className="p-8 max-w-[900px] space-y-8">
      {/* Header */}
      <div>
        <a href="/clientes" className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase">
          ← Clientes
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

      {/* Historial de Contenedores */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-3">
          Historial de Contenedores
        </h2>
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#f0f2f5]">
                {['Contenedor', 'Ruta', 'ETA', 'Estado', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                    {h}
                  </th>
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
                      ? new Date(c.eta_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={c.current_status} /></td>
                  <td className="px-5 py-3">
                    <a href={`/contenedores/${c.id}`} className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">
                      Ver →
                    </a>
                  </td>
                </tr>
              ))}
              {containers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#b0bac3]">
                    Sin contenedores registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Facturas */}
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-3">
          Facturas
        </h2>
        <div className="space-y-4">
          {invoices.map((inv: any) => (
            <div key={inv.id} className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
              {/* Factura header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f5]">
                <div>
                  <span className="font-bold text-[#0a1a3c] text-sm">{inv.invoice_number}</span>
                  <span className="ml-3 text-[10px] text-[#8a9aaa]">
                    Contenedor: <span className="font-mono font-bold">{inv.containers?.container_number ?? '—'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {inv.declared_value && (
                    <span className="text-xs font-bold text-[#181c1e]">
                      {inv.currency} {Number(inv.declared_value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${STATUS_COLOR[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[inv.status] ?? inv.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              {inv.invoice_items?.length > 0 && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#f0f2f5]">
                      {['Descripción', 'Cantidad', 'Unidad', 'Precio Unit.', 'Total'].map(h => (
                        <th key={h} className="px-5 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                          {h}
                        </th>
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
                          {Number(item.unit_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-2.5 font-bold text-[#0a1a3c]">
                          {Number(item.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {(!inv.invoice_items || inv.invoice_items.length === 0) && (
                <p className="px-6 py-4 text-[11px] text-[#b0bac3]">Sin productos registrados.</p>
              )}
            </div>
          ))}
          {invoices.length === 0 && (
            <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] px-6 py-8 text-center text-[#b0bac3] text-xs">
              Sin facturas registradas.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
