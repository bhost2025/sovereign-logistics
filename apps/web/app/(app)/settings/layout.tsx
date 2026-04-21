import { getUserProfile } from '@/lib/auth/get-user-role'
import { redirect } from 'next/navigation'

const SUB_NAV = [
  { href: '/settings/users',         label: 'Usuarios',            icon: '◎' },
  { href: '/settings/roles',         label: 'Roles y Permisos',    icon: '◈' },
  { href: '/settings/statuses',      label: 'Estados',             icon: '◆' },
  { href: '/settings/ports',         label: 'Puertos',             icon: '◱' },
  { href: '/settings/agencies',      label: 'Agencias',            icon: '▶' },
  { href: '/settings/notifications', label: 'Notificaciones',      icon: '◎' },
]

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile()
  if (profile.role !== 'super_admin') redirect('/tablero')

  return (
    <div className="flex min-h-screen">
      {/* Settings sub-sidebar */}
      <aside className="w-[200px] shrink-0 border-r border-[#e8ebee] bg-[#fafbfc] flex flex-col py-6">
        <div className="px-5 mb-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">⚙ Configuración</div>
        </div>
        <nav className="px-2 space-y-0.5">
          {SUB_NAV.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#556479] hover:bg-[#f0f2f5] hover:text-[#0a1a3c] transition-colors"
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
