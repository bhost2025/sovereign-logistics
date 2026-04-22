import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations } from 'next-intl/server'
import { updateNotificationSetting } from './actions'

const EVENT_ICONS: Record<string, { icon: string; hasThreshold: boolean }> = {
  container_detained: { icon: '◆', hasThreshold: false },
  missing_docs:       { icon: '◱', hasThreshold: false },
  eta_soon:           { icon: '◎', hasThreshold: true  },
  not_updated:        { icon: '◈', hasThreshold: true  },
}

export default async function SettingsNotificationsPage() {
  const [profile, t] = await Promise.all([
    getUserProfile(),
    getTranslations('settings'),
  ])
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at') as any

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s: any) => [s.event_type, s])
  )

  const ROLE_OPTIONS = [
    { value: 'director',    label: t('permMatrix.director') },
    { value: 'operator',    label: t('permMatrix.operator') },
    { value: 'super_admin', label: t('permMatrix.admin') },
  ]

  return (
    <div className="p-8 max-w-[720px]">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('notifications')}</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5">{t('notificationsDesc')}</p>
      </div>

      <div className="space-y-4">
        {Object.entries(EVENT_ICONS).map(([eventType, meta]) => {
          const setting = settingsMap[eventType]
          if (!setting) return (
            <div key={eventType} className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-5">
              <div className="text-[11px] text-[#8a9aaa]">{t(`events.${eventType}` as any)} — sin configurar</div>
            </div>
          )

          return (
            <div key={eventType} className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
              <div className="h-[2px] bg-[#4A6FA5]" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-[#4A6FA5]">{meta.icon}</span>
                      <span className="text-sm font-extrabold text-[#0a1a3c]">{t(`events.${eventType}` as any)}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded mt-1 shrink-0 ${setting.enabled ? 'bg-[#edf6f7] text-[#1A7A8A]' : 'bg-[#f0f2f5] text-[#8a9aaa]'}`}>
                    {setting.enabled ? t('active') : t('inactive')}
                  </span>
                </div>

                <form action={updateNotificationSetting.bind(null, eventType)} className="space-y-4">
                  {/* Enabled */}
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] font-bold text-[#556479] w-32 shrink-0">{t('notifEnabled')}</label>
                    <select
                      name="enabled"
                      defaultValue={setting.enabled ? 'true' : 'false'}
                      className="text-xs border border-[#e8ebee] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c] bg-white"
                    >
                      <option value="true">{t('yes')}</option>
                      <option value="false">{t('no')}</option>
                    </select>
                  </div>

                  {/* Threshold */}
                  {meta.hasThreshold && (
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-bold text-[#556479] w-32 shrink-0">{t('notifThreshold')}</label>
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
                  {!meta.hasThreshold && (
                    <input type="hidden" name="days_threshold" value="" />
                  )}

                  {/* Notify roles */}
                  <div className="flex items-start gap-3">
                    <label className="text-[10px] font-bold text-[#556479] w-32 shrink-0 mt-0.5">{t('notifRoles')}</label>
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
      </div>

      <p className="text-[10px] text-[#b0bac3] mt-6">◎ {t('noteMigration')}</p>
    </div>
  )
}
