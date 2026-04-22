import { getUserProfile } from '@/lib/auth/get-user-role'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const [profile, t] = await Promise.all([
    getUserProfile(),
    getTranslations('settings'),
  ])
  if (profile.role !== 'super_admin') redirect('/tablero')

  const SUB_NAV = [
    { href: '/settings/users',         label: t('users'),         icon: '◎', group: 'main' },
    { href: '/settings/roles',         label: t('roles'),         icon: '◈', group: 'main' },
    { href: '/settings/statuses',      label: t('statuses'),      icon: '◆', group: 'main' },
    { href: '/settings/ports',         label: t('ports'),         icon: '◱', group: 'main' },
    { href: '/settings/agencies',      label: t('agencies'),      icon: '▶', group: 'main' },
    { href: '/settings/notifications', label: t('notifications'), icon: '◎', group: 'main' },
    { href: '/settings/email',         label: t('email'),         icon: '✉', group: 'system' },
    { href: '/settings/logs',          label: t('logs'),          icon: '◈', group: 'system' },
    { href: '/settings/backups',       label: t('backups'),       icon: '◆', group: 'system' },
    { href: '/settings/cleanup',       label: t('cleanup'),       icon: '▲', group: 'danger' },
  ]

  const mainNav   = SUB_NAV.filter(i => i.group === 'main')
  const systemNav = SUB_NAV.filter(i => i.group === 'system')
  const dangerNav = SUB_NAV.filter(i => i.group === 'danger')

  return (
    <div className="flex min-h-screen">
      {/* Settings sub-sidebar */}
      <aside className="w-[200px] shrink-0 border-r border-[#e8ebee] bg-[#fafbfc] flex flex-col py-6">
        <div className="px-5 mb-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">⚙ {t('title')}</div>
        </div>
        <nav className="px-2 space-y-0.5">
          {mainNav.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#556479] hover:bg-[#f0f2f5] hover:text-[#0a1a3c] transition-colors"
            >
              <span className="text-[10px]">{item.icon}</span>
              {item.label}
            </a>
          ))}

          <div className="pt-3 pb-1 px-3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#c5c6cf]">Sistema</div>
          </div>

          {systemNav.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#556479] hover:bg-[#f0f2f5] hover:text-[#0a1a3c] transition-colors"
            >
              <span className="text-[10px]">{item.icon}</span>
              {item.label}
            </a>
          ))}

          <div className="pt-3 pb-1 px-3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#c5c6cf]">Danger</div>
          </div>

          {dangerNav.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#C05A00] hover:bg-[#fef4ed] transition-colors"
            >
              <span className="text-[10px]">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
