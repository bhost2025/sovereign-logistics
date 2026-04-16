import { getContainersByStatus } from '@/lib/containers'
import { StatusBadge } from '@/components/status-badge'
import { getTranslations } from 'next-intl/server'

export default async function ContenedoresPage() {
  const [containers, t, ts] = await Promise.all([
    getContainersByStatus(),
    getTranslations('containers'),
    getTranslations('status'),
  ])

  const dateLocale = { 'en': 'en-US', 'zh': 'zh-CN', 'es': 'es-MX' }

  return (
    <div className="p-8 max-w-[1000px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight">{t('title')}</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">{containers.length} registros</p>
        </div>
        <a
          href="/contenedores/nuevo"
          className="bg-[#0a1a3c] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#142a5c] transition-colors"
        >
          {t('new')}
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f0f2f5]">
              {[t('container'), t('bl'), t('client'), t('route'), t('eta'), t('status'), ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {containers.map(c => {
              const client = c.container_clients?.[0]?.clients?.name ?? '—'
              const isLcl  = (c.container_clients?.length ?? 0) > 1
              return (
                <tr key={c.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-[#0a1a3c] text-[11px]">{c.container_number}</td>
                  <td className="px-5 py-3 text-[#6b7a8a]">{c.bl_number ?? '—'}</td>
                  <td className="px-5 py-3 text-[#181c1e]">
                    {client}
                    {isLcl && <span className="ml-1.5 text-[9px] bg-sky-100 text-sky-700 font-bold px-1 py-0.5 rounded">LCL</span>}
                  </td>
                  <td className="px-5 py-3 text-[#6b7a8a]">{c.origin_port} → {c.destination_port}</td>
                  <td className="px-5 py-3 text-[#6b7a8a]">
                    {c.eta_date
                      ? new Date(c.eta_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.current_status} label={ts(c.current_status as any)} />
                  </td>
                  <td className="px-5 py-3">
                    <a href={`/contenedores/${c.id}`} className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">Ver →</a>
                  </td>
                </tr>
              )
            })}
            {containers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[#b0bac3]">
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
