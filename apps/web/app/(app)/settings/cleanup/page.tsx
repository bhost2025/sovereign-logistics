import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { runSystemCleanup } from './actions'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function SettingsCleanupPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; error?: string }>
}) {
  const [params, profile, t] = await Promise.all([
    searchParams,
    getUserProfile(),
    getTranslations('settings'),
  ])

  if (profile.role !== 'super_admin') redirect('/tablero')

  const supabase = await createClient()
  const [contRes, clientRes, invRes] = await Promise.all([
    (supabase as any).from('containers').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id),
    (supabase as any).from('clients').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id),
    (supabase as any).from('invoices').select('id', { count: 'exact', head: true })
      .in('container_id',
        (supabase as any).from('containers').select('id').eq('company_id', profile.company_id)
      ),
  ])

  const counts = {
    containers: contRes.count ?? 0,
    clients:    clientRes.count ?? 0,
    invoices:   invRes.count ?? 0,
  }

  const confirmWord = t('cleanupConfirmWord')

  return (
    <div className="p-8 max-w-[680px]">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('cleanupTitle')}</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5">{t('cleanupSubtitle')}</p>
      </div>

      {/* Success banner */}
      {params.done === '1' && (
        <div className="mb-6 bg-[#edf6f7] border border-[#1A7A8A]/20 rounded-xl px-5 py-4 text-sm font-bold text-[#1A7A8A]">
          ✓ {t('cleanupSuccess')}
        </div>
      )}

      {/* Error banners */}
      {params.error === 'word' && (
        <div className="mb-6 bg-[#fef4ed] border border-[#C05A00]/20 rounded-xl px-5 py-4 text-sm font-bold text-[#C05A00]">
          ✕ Palabra de confirmación incorrecta.
        </div>
      )}

      {/* Backup first link */}
      <div className="bg-[#f0f4ff] border border-[#4A6FA5]/20 rounded-xl px-5 py-3 flex items-center justify-between mb-6">
        <span className="text-xs font-semibold text-[#4A6FA5]">◆ Recomendamos crear un respaldo antes de limpiar</span>
        <a href="/settings/backups" className="text-xs font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">
          {t('cleanupBackupFirst')}
        </a>
      </div>

      {/* Danger zone card */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        <div className="h-[4px] bg-[#C05A00]" />
        <div className="p-6">
          {/* Warning header */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#C05A00] text-base">▲</span>
            <span className="text-xs font-extrabold text-[#C05A00] uppercase tracking-widest">{t('cleanupWarning')}</span>
          </div>

          <p className="text-xs text-[#556479] mb-5 leading-relaxed">{t('cleanupDesc')}</p>

          {/* What gets deleted vs kept */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#fef4ed] rounded-lg p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#C05A00] mb-2">{t('cleanupWillDelete')}</div>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-xs text-[#C05A00]">
                  <span className="shrink-0 mt-0.5">✕</span>
                  {t('cleanupItemContainers')}
                  <span className="ml-auto font-bold">{counts.containers}</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-[#C05A00]">
                  <span className="shrink-0 mt-0.5">✕</span>
                  {t('cleanupItemClients')}
                  <span className="ml-auto font-bold">{counts.clients}</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-[#C05A00]">
                  <span className="shrink-0 mt-0.5">✕</span>
                  {t('cleanupItemInvoices')}
                  <span className="ml-auto font-bold">{counts.invoices}</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#edf6f7] rounded-lg p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#1A7A8A] mb-2">{t('cleanupWillKeep')}</div>
              <ul className="space-y-1.5">
                {[t('cleanupKeepUsers'), t('cleanupKeepCatalog'), t('cleanupKeepConfig'), t('cleanupKeepLogs')].map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs text-[#1A7A8A]">
                    <span className="shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Confirmation form */}
          <form action={runSystemCleanup} className="space-y-4">
            {/* Step 1: type confirm word */}
            <div>
              <label className="block text-[11px] font-bold text-[#181c1e] mb-1.5">
                {t('cleanupStep1Label')}{' '}
                <code className="bg-[#f7fafc] border border-[#e8ebee] px-1.5 py-0.5 rounded text-[#C05A00] font-mono">
                  {confirmWord}
                </code>{' '}
                {t('cleanupStep1Confirm')}
              </label>
              <input
                name="confirm_word"
                required
                autoComplete="off"
                className="w-full text-xs border-2 border-[#e8ebee] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#C05A00] text-[#0a1a3c] font-mono"
                placeholder={confirmWord}
              />
            </div>

            {/* Step 2: checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="i_understand"
                required
                className="mt-0.5 h-4 w-4 rounded border-[#e8ebee] accent-[#C05A00]"
              />
              <span className="text-xs text-[#556479] font-semibold">{t('cleanupStep2')}</span>
            </label>

            <button
              type="submit"
              className="w-full bg-[#C05A00] text-white text-xs font-extrabold py-3 rounded-lg hover:bg-[#a04800] transition-colors uppercase tracking-wide"
            >
              ▲ {t('cleanupBtn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
