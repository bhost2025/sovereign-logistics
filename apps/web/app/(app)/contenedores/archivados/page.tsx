import { createAdminClient } from '@/lib/supabase/admin'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations, getLocale } from 'next-intl/server'
import { can } from '@/lib/auth/can'
import { redirect } from 'next/navigation'
import { restoreContainer } from '../actions'
import { StatusBadge } from '@/components/status-badge'

export const dynamic = 'force-dynamic'

export default async function ArchivadosPage() {
  const [profile, t, locale, canRestore] = await Promise.all([
    getUserProfile(),
    getTranslations('containers'),
    getLocale(),
    can('delete_containers'),
  ])

  if (!canRestore) redirect('/403')

  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'

  // Admin client bypasses RLS to query deleted rows
  const supabase = createAdminClient()
  const { data: containers } = await (supabase as any)
    .from('containers')
    .select(`
      id, container_number, bl_number, origin_port, destination_port,
      current_status, deleted_at,
      container_clients(clients(name))
    `)
    .eq('company_id', profile.company_id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  return (
    <div className="p-8 max-w-[860px]">
      <div className="mb-8">
        <a
          href="/contenedores"
          className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase"
        >
          ← {t('title')}
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">
          {t('archivedTitle')}
        </h1>
        <p className="text-xs text-[#8a9aaa] mt-0.5">
          {t('archivedDesc')}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f0f2f5]">
              {[t('container'), t('client'), t('route'), t('status'), t('archivedAt'), ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(containers ?? []).map((c: any) => {
              const clients = c.container_clients ?? []
              const clientName = clients[0]?.clients?.name ?? '—'
              const isLcl = clients.length > 1
              return (
                <tr key={c.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors opacity-75">
                  <td className="px-5 py-3 font-mono font-bold text-[#0a1a3c] text-[11px]">
                    {c.container_number}
                    {c.bl_number && <div className="text-[10px] text-[#8a9aaa] font-normal">{c.bl_number}</div>}
                  </td>
                  <td className="px-5 py-3 text-[#556479]">
                    {clientName}
                    {isLcl && <span className="ml-1 text-[9px] bg-sky-100 text-sky-700 font-bold px-1 py-0.5 rounded">LCL</span>}
                  </td>
                  <td className="px-5 py-3 text-[#8a9aaa]">{c.origin_port} → {c.destination_port}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.current_status} /></td>
                  <td className="px-5 py-3 text-[#8a9aaa]">
                    {new Date(c.deleted_at).toLocaleDateString(jsLocale, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3">
                    <form action={restoreContainer.bind(null, c.id)}>
                      <button
                        type="submit"
                        className="text-[10px] font-bold text-[#1A7A8A] hover:text-[#0a1a3c] transition-colors"
                      >
                        ◎ {t('restoreBtn')}
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
            {(!containers || containers.length === 0) && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[11px] text-[#b0bac3]">
                  ✓ {t('noArchived')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
