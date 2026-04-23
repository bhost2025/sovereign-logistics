import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations, getLocale } from 'next-intl/server'
import { updateNotificationSetting } from './actions'

export const dynamic = 'force-dynamic'

const EVENT_ICONS: Record<string, { icon: string; hasThreshold: boolean }> = {
  container_detained: { icon: '◆', hasThreshold: false },
  missing_docs:       { icon: '◱', hasThreshold: false },
  eta_soon:           { icon: '◎', hasThreshold: true  },
  not_updated:        { icon: '◈', hasThreshold: true  },
}

export default async function SettingsNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const sp = await searchParams
  const view = sp.view === 'log' ? 'log' : 'settings'

  const [profile, t, locale] = await Promise.all([
    getUserProfile(),
    getTranslations('settings'),
    getLocale(),
  ])
  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at') as any

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s: any) => [s.event_type, s])
  )

  // Load notification log when on log view
  const { data: logRows } = view === 'log'
    ? await (supabase as any)
        .from('notification_log')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('sent_at', { ascending: false })
        .limit(100)
    : { data: [] }

  const ROLE_OPTIONS = [
    { value: 'director',    label: t('permMatrix.director') },
    { value: 'operator',    label: t('permMatrix.operator') },
    { value: 'super_admin', label: t('permMatrix.admin') },
  ]

  const STATUS_STYLE: Record<string, string> = {
    sent:    'bg-[#edf6f7] text-[#1A7A8A]',
    partial: 'bg-[#fdf8ec] text-[#B8860B]',
    failed:  'bg-[#fef4ed] text-[#C05A00]',
  }

  return (
    <div className="p-8 max-w-[760px]">
      {/* Header + tab switcher */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('notifications')}</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">{t('notificationsDesc')}</p>
        </div>
        <div className="flex gap-1 mt-1">
          <a
            href="/settings/notifications"
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${view === 'settings' ? 'bg-[#0a1a3c] text-white' : 'bg-[#f0f2f5] text-[#8a9aaa] hover:text-[#0a1a3c]'}`}
          >
            {t('notifConfig')}
          </a>
          <a
            href="/settings/notifications?view=log"
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${view === 'log' ? 'bg-[#0a1a3c] text-white' : 'bg-[#f0f2f5] text-[#8a9aaa] hover:text-[#0a1a3c]'}`}
          >
            {t('notifLog')}
          </a>
        </div>
      </div>

      {/* ── Settings view ── */}
      {view === 'settings' && (
        <div className="space-y-4">
          {Object.entries(EVENT_ICONS).map(([eventType, meta]) => {
            const setting = settingsMap[eventType]
            if (!setting) return (
              <div key={eventType} className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-5">
                <div className="text-[11px] text-[#8a9aaa]">{t(`events.${eventType}` as any)} — {t('notConfigured')}</div>
              </div>
            )

            const channelsBadges = []
            if (setting.enabled)      channelsBadges.push({ label: '✉ Email', color: '#1A7A8A', bg: '#edf6f7' })
            if (setting.push_enabled) channelsBadges.push({ label: '◎ Push',  color: '#4A6FA5', bg: '#eef2f8' })

            return (
              <div key={eventType} className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
                <div className="h-[2px] bg-[#4A6FA5]" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] text-[#4A6FA5]">{meta.icon}</span>
                        <span className="text-sm font-extrabold text-[#0a1a3c]">{t(`events.${eventType}` as any)}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {channelsBadges.map(b => (
                          <span key={b.label} className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: b.color, background: b.bg }}>{b.label}</span>
                        ))}
                        {channelsBadges.length === 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f0f2f5] text-[#8a9aaa]">{t('inactive')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <form action={updateNotificationSetting.bind(null, eventType)} className="space-y-4">
                    {/* Email enabled */}
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-bold text-[#556479] w-36 shrink-0">✉ {t('notifEnabled')}</label>
                      <select
                        name="enabled"
                        defaultValue={setting.enabled ? 'true' : 'false'}
                        className="text-xs border border-[#e8ebee] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c] bg-white"
                      >
                        <option value="true">{t('yes')}</option>
                        <option value="false">{t('no')}</option>
                      </select>
                    </div>

                    {/* Push enabled */}
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-bold text-[#556479] w-36 shrink-0">◎ {t('notifPush')}</label>
                      <select
                        name="push_enabled"
                        defaultValue={setting.push_enabled ? 'true' : 'false'}
                        className="text-xs border border-[#e8ebee] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c] bg-white"
                      >
                        <option value="true">{t('yes')}</option>
                        <option value="false">{t('no')}</option>
                      </select>
                    </div>

                    {/* Threshold */}
                    {meta.hasThreshold && (
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] font-bold text-[#556479] w-36 shrink-0">{t('notifThreshold')}</label>
                        <input
                          name="days_threshold"
                          type="number"
                          min={1}
                          max={90}
                          defaultValue={setting.days_threshold ?? 5}
                          className="w-20 text-xs border border-[#e8ebee] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
                        />
                        <span className="text-[10px] text-[#8a9aaa]">{t('daysWithout')}</span>
                      </div>
                    )}
                    {!meta.hasThreshold && <input type="hidden" name="days_threshold" value="" />}

                    {/* Notify roles */}
                    <div className="flex items-start gap-3">
                      <label className="text-[10px] font-bold text-[#556479] w-36 shrink-0 mt-0.5">{t('notifRoles')}</label>
                      <div className="flex flex-wrap gap-3">
                        {ROLE_OPTIONS.map(role => (
                          <label key={role.value} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              name="notify_roles"
                              value={role.value}
                              defaultChecked={(setting.notify_roles ?? []).includes(role.value)}
                              className="rounded"
                            />
                            <span className="text-[11px] text-[#0a1a3c] font-semibold">{role.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        className="text-[10px] font-bold bg-[#0a1a3c] text-white px-4 py-1.5 rounded-lg hover:bg-[#142a5c] transition-colors"
                      >
                        {t('save')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )
          })}
          <p className="text-[10px] text-[#b0bac3] mt-2">◎ {t('noteMigration')}</p>
        </div>
      )}

      {/* ── Log view ── */}
      {view === 'log' && (
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#f0f2f5]">
                {[t('notifEvent'), t('container'), t('notifChannels'), t('notifRecipients'), t('notifStatus'), t('notifDate')].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(logRows ?? []).map((row: any) => (
                <tr key={row.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#0a1a3c]">
                    {EVENT_ICONS[row.event_type]?.icon ?? '◎'} {t(`events.${row.event_type}` as any)}
                  </td>
                  <td className="px-4 py-3 font-mono text-[#6b7a8a] text-[11px]">
                    {row.container_number ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(row.channels ?? []).map((ch: string) => (
                        <span key={ch} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#eef2f8] text-[#4A6FA5]">
                          {ch}
                        </span>
                      ))}
                      {(row.channels ?? []).length === 0 && <span className="text-[#b0bac3]">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#556479]">{row.recipients_count}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${STATUS_STYLE[row.status] ?? ''}`}>
                      {row.status}
                    </span>
                    {row.error && (
                      <div className="text-[9px] text-[#C05A00] mt-0.5 max-w-[160px] truncate" title={row.error}>
                        {row.error}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#8a9aaa]">
                    {new Date(row.sent_at).toLocaleDateString(jsLocale, { day: '2-digit', month: 'short', year: 'numeric' })}
                    <div className="text-[9px] text-[#b0bac3]">
                      {new Date(row.sent_at).toLocaleTimeString(jsLocale, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              ))}
              {(!logRows || logRows.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[11px] text-[#b0bac3]">
                    ◎ {t('notifLogEmpty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
