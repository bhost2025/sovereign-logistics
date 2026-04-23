import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const ACTION_SYMBOL: Record<string, string> = {
  create:            '◎',
  update:            '◈',
  delete:            '▲',
  restore:           '↩',
  login:             '→',
  logout:            '←',
  export:            '◱',
  backup:            '◆',
  cleanup:           '⚠',
  permission_change: '⚙',
  test_email:        '✉',
}

const ACTION_COLOR: Record<string, string> = {
  create:            '#1A7A8A',
  update:            '#4A6FA5',
  delete:            '#C05A00',
  restore:           '#1A7A8A',
  login:             '#8a9aaa',
  logout:            '#8a9aaa',
  export:            '#B8860B',
  backup:            '#4A6FA5',
  cleanup:           '#C05A00',
  permission_change: '#B8860B',
  test_email:        '#4A6FA5',
}

const PAGE_SIZE = 50

export default async function SettingsLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    user?: string
    entity?: string
    action?: string
    page?: string
  }>
}) {
  const [params, profile, t, locale] = await Promise.all([
    searchParams,
    getUserProfile(),
    getTranslations('settings'),
    getLocale(),
  ])

  if (!['super_admin', 'director'].includes(profile.role)) redirect('/tablero')

  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'
  const page = parseInt(params.page ?? '1', 10)
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  let query = (supabase as any)
    .from('system_logs')
    .select('*', { count: 'exact' })
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (params.user)   query = query.ilike('user_name', `%${params.user}%`)
  if (params.entity) query = query.eq('entity_type', params.entity)
  if (params.action) query = query.eq('action', params.action)

  const { data: logs, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Unique users and entities for filter dropdowns
  const { data: usersUniq } = await (supabase as any)
    .from('system_logs')
    .select('user_name')
    .eq('company_id', profile.company_id)
    .not('user_name', 'is', null)
    .order('user_name')

  const uniqueUsers = Array.from(new Set<string>((usersUniq ?? []).map((r: any) => r.user_name as string)))

  const ENTITY_TYPES = ['container','client','user','invoice','document','agency','port','role_permission','email_config','system']
  const ALL_ACTIONS  = ['create','update','delete','restore','login','logout','export','backup','cleanup','permission_change','test_email']

  const ACTION_LABEL: Record<string, string> = {
    create:            t('actionCreate'),
    update:            t('actionUpdate'),
    delete:            t('actionDelete'),
    restore:           t('actionRestore'),
    login:             t('actionLogin'),
    logout:            t('actionLogout'),
    export:            t('actionExport'),
    backup:            t('actionBackup'),
    cleanup:           t('actionCleanup'),
    permission_change: t('actionPermissionChange'),
    test_email:        t('actionTestEmail'),
  }

  return (
    <div className="p-8 max-w-[1100px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('logsTitle')}</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">{t('logsSubtitle')}</p>
        </div>
        <a
          href="/settings/logs/export"
          className="flex items-center gap-2 text-xs font-bold text-[#4A6FA5] border border-[#4A6FA5] px-4 py-2 rounded-lg hover:bg-[#eef2f8] transition-colors"
        >
          ◱ {t('logExport')}
        </a>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <select
          name="user"
          defaultValue={params.user ?? ''}
          className="text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] bg-white text-[#0a1a3c]"
        >
          <option value="">{t('logFilterUser')}: {t('logFilterAll')}</option>
          {uniqueUsers.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <select
          name="entity"
          defaultValue={params.entity ?? ''}
          className="text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] bg-white text-[#0a1a3c]"
        >
          <option value="">{t('logFilterEntity')}: {t('logFilterAll')}</option>
          {ENTITY_TYPES.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        <select
          name="action"
          defaultValue={params.action ?? ''}
          className="text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] bg-white text-[#0a1a3c]"
        >
          <option value="">{t('logFilterAction')}: {t('logFilterAll')}</option>
          {ALL_ACTIONS.map(a => (
            <option key={a} value={a}>{ACTION_LABEL[a] ?? a}</option>
          ))}
        </select>

        <button
          type="submit"
          className="text-xs font-bold bg-[#0a1a3c] text-white px-4 py-2 rounded-lg hover:bg-[#142a5c] transition-colors"
        >
          ▶ Filtrar
        </button>

        {(params.user || params.entity || params.action) && (
          <a
            href="/settings/logs"
            className="text-xs font-bold text-[#C05A00] px-4 py-2 rounded-lg border border-[#C05A00] hover:bg-[#fef4ed] transition-colors"
          >
            ✕ Limpiar
          </a>
        )}
      </form>

      {/* Log table */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden mb-4">
        {(!logs || logs.length === 0) ? (
          <div className="px-6 py-12 text-center text-[11px] text-[#8a9aaa]">
            {t('logNoRecords')}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#f0f2f5]">
                {[t('logTimestamp'), t('logUser'), t('logAction'), t('logEntity'), t('logDetails')].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(logs as any[]).map((log, i) => {
                const actionColor = ACTION_COLOR[log.action] ?? '#8a9aaa'
                const actionSymbol = ACTION_SYMBOL[log.action] ?? '◎'
                const ts = new Date(log.created_at)

                return (
                  <tr key={log.id} className={`border-b border-[#f7fafc] ${i % 2 === 1 ? 'bg-[#fafbfc]' : ''}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-[11px] font-semibold text-[#181c1e]">
                        {ts.toLocaleDateString(jsLocale, { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="text-[10px] text-[#8a9aaa]">
                        {ts.toLocaleTimeString(jsLocale, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-[#181c1e]">
                        {log.user_name ?? '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ color: actionColor, background: actionColor + '18' }}
                      >
                        {actionSymbol} {ACTION_LABEL[log.action] ?? log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {log.entity_type && (
                        <div className="text-[10px] text-[#6b7a8a] font-medium">{log.entity_type}</div>
                      )}
                      {log.entity_label && (
                        <div className="font-mono text-[10px] text-[#0a1a3c] font-bold">{log.entity_label}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 max-w-[280px]">
                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <details className="cursor-pointer">
                          <summary className="text-[10px] text-[#4A6FA5] font-bold hover:text-[#0a1a3c]">
                            {Object.keys(log.changes).length} {t('logChanges')}
                          </summary>
                          <div className="mt-2 space-y-1">
                            {Object.entries(log.changes as Record<string, { before: unknown; after: unknown }>).map(([field, { before, after }]) => (
                              <div key={field} className="text-[10px]">
                                <span className="font-bold text-[#556479]">{field}:</span>{' '}
                                <span className="text-[#C05A00]">{String(before ?? '—')}</span>
                                {' → '}
                                <span className="text-[#1A7A8A]">{String(after ?? '—')}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-center">
          {page > 1 && (
            <a
              href={`/settings/logs?page=${page - 1}${params.user ? `&user=${params.user}` : ''}${params.entity ? `&entity=${params.entity}` : ''}${params.action ? `&action=${params.action}` : ''}`}
              className="text-xs font-bold text-[#4A6FA5] px-3 py-1.5 rounded-lg border border-[#4A6FA5] hover:bg-[#eef2f8]"
            >
              ← Anterior
            </a>
          )}
          <span className="text-[11px] text-[#8a9aaa]">
            {page} / {totalPages} · {count} registros
          </span>
          {page < totalPages && (
            <a
              href={`/settings/logs?page=${page + 1}${params.user ? `&user=${params.user}` : ''}${params.entity ? `&entity=${params.entity}` : ''}${params.action ? `&action=${params.action}` : ''}`}
              className="text-xs font-bold text-[#4A6FA5] px-3 py-1.5 rounded-lg border border-[#4A6FA5] hover:bg-[#eef2f8]"
            >
              Siguiente →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
