import { getContainersByStatus } from '@/lib/containers'
import { ContainersSearchTable } from '@/components/containers-search-table'
import { getTranslations } from 'next-intl/server'
import { can } from '@/lib/auth/can'

export default async function ContenedoresPage() {
  const [containers, t, canArchive] = await Promise.all([
    getContainersByStatus(),
    getTranslations('containers'),
    can('delete_containers'),
  ])

  return (
    <div className="p-8 max-w-[1000px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight">{t('title')}</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">{containers.length} {t('records')}</p>
        </div>
        <div className="flex items-center gap-2">
          {canArchive && (
            <a
              href="/contenedores/archivados"
              className="text-xs font-bold text-[#556479] bg-[#f0f2f5] hover:bg-[#e0e3e8] px-3 py-2 rounded-md transition-colors"
            >
              {t('archivedLink')}
            </a>
          )}
          <a
            href="/api/export/contenedores"
            className="text-xs font-bold text-[#556479] bg-[#f0f2f5] hover:bg-[#e0e3e8] px-3 py-2 rounded-md transition-colors"
          >
            {t('exportCsv')}
          </a>
          <a
            href="/contenedores/nuevo"
            className="bg-[#0a1a3c] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#142a5c] transition-colors"
          >
            {t('new')}
          </a>
        </div>
      </div>

      <ContainersSearchTable containers={containers as any} />
    </div>
  )
}
