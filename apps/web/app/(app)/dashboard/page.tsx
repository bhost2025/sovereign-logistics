import { getContainersByStatus, getKpiSummary } from '@/lib/containers'
import { KpiCard } from '@/components/kpi-card'
import { StatusBadge } from '@/components/status-badge'

export default async function DashboardPage() {
  const [containers, kpis] = await Promise.all([
    getContainersByStatus(),
    getKpiSummary(),
  ])

  const activos = containers.filter(c =>
    !['entregado', 'en_puerto_origen'].includes(c.current_status)
  )
  const detenidos = containers.filter(c => c.current_status === 'detenido_aduana')

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight">Dashboard</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5 font-medium">Vista ejecutiva · Solo lectura</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Activos"    value={kpis.activos}    symbol="◈" accentColor="#4A6FA5" />
        <KpiCard label="En Aduana"  value={kpis.en_aduana}  symbol="◆" accentColor="#B8860B" />
        <KpiCard label="Detenidos"  value={kpis.detenidos}  symbol="▲" accentColor="#C05A00" />
        <KpiCard label="Entregados" value={kpis.entregados} symbol="✓" accentColor="#1A7A8A" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla contenedores activos */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f2f5]">
            <h2 className="text-sm font-extrabold text-[#0a1a3c]">Contenedores Activos</h2>
          </div>
          <div className="overflow-x-auto">
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
                {activos.map(c => {
                  const client = c.container_clients?.[0]?.clients?.name ?? '—'
                  const isLcl = (c.container_clients?.length ?? 0) > 1
                  return (
                    <tr key={c.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-[#0a1a3c] text-[11px]">
                        {c.container_number}
                      </td>
                      <td className="px-5 py-3 text-[#181c1e]">
                        {client}
                        {isLcl && (
                          <span className="ml-1.5 text-[9px] bg-sky-100 text-sky-700 font-bold px-1 py-0.5 rounded">LCL</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[#6b7a8a]">{c.origin_port} → {c.destination_port}</td>
                      <td className="px-5 py-3 text-[#6b7a8a]">
                        {c.eta_date
                          ? new Date(c.eta_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                          : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={c.current_status} />
                      </td>
                    </tr>
                  )
                })}
                {activos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-[#b0bac3] text-xs">
                      Sin contenedores activos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel alertas */}
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#0a1a3c]">▲ Alertas</h2>
            {detenidos.length > 0 && (
              <span className="text-[10px] font-bold bg-[#fef4ed] text-[#C05A00] px-2 py-0.5 rounded">
                {detenidos.length} detenido{detenidos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="p-4 space-y-3">
            {detenidos.map(c => (
              <a
                key={c.id}
                href={`/contenedores/${c.id}`}
                className="block p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] hover:bg-[#fdeee3] transition-colors"
              >
                <div className="font-mono font-bold text-[11px] text-[#0a1a3c]">{c.container_number}</div>
                <div className="text-[10px] text-[#C05A00] font-semibold mt-0.5">Detenido en aduana</div>
                <div className="text-[10px] text-[#8a9aaa] mt-0.5">{c.origin_port} → {c.destination_port}</div>
              </a>
            ))}
            {detenidos.length === 0 && (
              <p className="text-center text-[11px] text-[#b0bac3] py-6">✓ Sin alertas activas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
