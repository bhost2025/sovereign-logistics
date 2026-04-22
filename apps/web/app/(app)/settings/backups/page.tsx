import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SettingsBackupsPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>
}) {
  const [params, profile, t, locale] = await Promise.all([
    searchParams,
    getUserProfile(),
    getTranslations('settings'),
    getLocale(),
  ])

  if (profile.role !== 'super_admin') redirect('/tablero')

  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'

  const supabase = await createClient()
  const { data: backups } = await (supabase as any)
    .from('backups')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .limit(20)

  const lastBackup = (backups as any[])?.[0]

  return (
    <div className="p-8 max-w-[860px]">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('backupsTitle')}</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">{t('backupsSubtitle')}</p>
        </div>
        <a
          href="/api/backup"
          className="flex items-center gap-2 bg-[#0a1a3c] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-[#142a5c] transition-colors"
        >
          {t('createBackup')}
        </a>
      </div>

      {/* Last backup info */}
      <div className="bg-[#f0f4ff] border border-[#4A6FA5]/20 rounded-xl px-5 py-3 flex items-center justify-between mb-6">
        <span className="text-xs font-semibold text-[#4A6FA5]">
          {t('backupLastBackup')}{' '}
          {lastBackup
            ? new Date(lastBackup.created_at).toLocaleString(jsLocale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : t('backupNever')
          }
        </span>
        {lastBackup && (
          <span className="text-[10px] text-[#8a9aaa]">
            {lastBackup.file_size_kb ? `${lastBackup.file_size_kb} KB` : '—'}
          </span>
        )}
      </div>

      {/* Backups table */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        {(!backups || (backups as any[]).length === 0) ? (
          <div className="px-6 py-12 text-center text-[11px] text-[#8a9aaa]">
            {t('backupNoRecords')}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#f0f2f5]">
                {[t('backupDate'), t('backupBy'), t('backupSize'), t('backupContains'), ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(backups as any[]).map((bk, i) => {
                const counts: Record<string, number> = bk.entity_counts ?? {}
                const summary = Object.entries(counts)
                  .filter(([, v]) => v > 0)
                  .map(([k, v]) => `${v} ${k}`)
                  .join(' · ')

                return (
                  <tr key={bk.id} className={`border-b border-[#f7fafc] ${i % 2 === 1 ? 'bg-[#fafbfc]' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="text-[11px] font-semibold text-[#181c1e]">
                        {new Date(bk.created_at).toLocaleDateString(jsLocale, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-[#8a9aaa]">
                        {new Date(bk.created_at).toLocaleTimeString(jsLocale, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-[#556479]">{bk.triggered_by_name ?? '—'}</td>
                    <td className="px-5 py-3 text-[11px] font-mono text-[#8a9aaa]">
                      {bk.file_size_kb ? `${bk.file_size_kb} KB` : '—'}
                    </td>
                    <td className="px-5 py-3 text-[10px] text-[#6b7a8a]">{summary || '—'}</td>
                    <td className="px-5 py-3">
                      <a
                        href="/api/backup"
                        className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]"
                      >
                        ◱ {t('backupDownload')}
                      </a>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[10px] text-[#b0bac3] mt-4">◎ {t('backupExpiry')}</p>
    </div>
  )
}
