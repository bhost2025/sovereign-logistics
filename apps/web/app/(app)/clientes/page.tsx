import { getClients } from '@/lib/clients'
import { ClientsSearchTable } from '@/components/clients-search-table'
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
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">{clients.length} {t('records')}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/clientes"
            className="text-xs font-bold text-[#556479] bg-[#f0f2f5] hover:bg-[#e0e3e8] px-3 py-2 rounded-md transition-colors"
          >
            {t('exportCsv')}
          </a>
          <a
            href="/clientes/nuevo"
            className="bg-[#0a1a3c] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#142a5c] transition-colors"
          >
            {t('new')}
          </a>
        </div>
      </div>

      <ClientsSearchTable clients={clients as any} />
    </div>
  )
}
