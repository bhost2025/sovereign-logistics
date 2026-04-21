import { getClients } from '@/lib/clients'
import { getTranslations } from 'next-intl/server'

export default async function ClientesPage() {
  const [clients, t] = await Promise.all([
    getClients(),
    getTranslations('clients'),
  ])

  return (
    <div className="p-8 max-w-[1000px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight">{t('title')}</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">{clients.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/clientes"
            className="text-xs font-bold text-[#556479] bg-[#f0f2f5] hover:bg-[#e0e3e8] px-3 py-2 rounded-md transition-colors"
          >
            ↓ CSV
          </a>
          <a
            href="/clientes/nuevo"
            className="bg-[#0a1a3c] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#142a5c] transition-colors"
          >
            {t('new')}
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f0f2f5]">
              {[t('title'), t('contact'), t('email'), t('phone'), t('containers'), ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                <td className="px-5 py-3 font-bold text-[#0a1a3c]">
                  {c.name}
                  {!c.is_active && (
                    <span className="ml-1.5 text-[9px] bg-red-100 text-red-600 font-bold px-1 py-0.5 rounded">{t('inactive')}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-[#6b7a8a]">{c.contact_name ?? '—'}</td>
                <td className="px-5 py-3 text-[#6b7a8a]">{c.email ?? '—'}</td>
                <td className="px-5 py-3 text-[#6b7a8a]">{c.phone ?? '—'}</td>
                <td className="px-5 py-3 text-[#6b7a8a]">
                  {(c.container_clients as any)?.[0]?.count ?? 0}
                </td>
                <td className="px-5 py-3">
                  <a href={`/clientes/${c.id}`} className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">
                    Ver →
                  </a>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#b0bac3]">
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
