import { getUserProfile } from '@/lib/auth/get-user-role'
import { signOut } from '@/app/(auth)/login/actions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 bg-white/70 backdrop-blur-[30px] shadow-[2px_0_40px_rgba(24,28,30,0.04)] flex flex-col py-7">
        {/* Logo */}
        <div className="px-6 pb-8 flex items-center gap-3">
          <div className="w-[34px] h-[34px] bg-[#0a1a3c] rounded-md flex items-center justify-center text-base font-bold text-white">S</div>
          <div>
            <div className="text-[13px] font-extrabold text-[#0a1a3c] tracking-tight leading-tight">Sovereign Logistics</div>
            <div className="text-[10px] font-medium text-[#8a9aaa] tracking-wider">CHINA · MÉXICO OPS</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {profile.role !== 'operator' && (
            <a href="/dashboard" className="nav-item">◈ Dashboard</a>
          )}
          {profile.role !== 'director' && (
            <a href="/tablero" className="nav-item">⬡ Tablero</a>
          )}
          {profile.role !== 'director' && (
            <a href="/contenedores" className="nav-item">◱ Contenedores</a>
          )}
          {profile.role !== 'director' && (
            <a href="/clientes" className="nav-item">◎ Clientes</a>
          )}
          {profile.role === 'super_admin' && (
            <a href="/admin" className="nav-item">⚙ Admin</a>
          )}
        </nav>

        {/* User */}
        <div className="px-6 pt-4 border-t border-[#c5c6cf]/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0a1a3c] flex items-center justify-center text-white text-[11px] font-bold">
              {profile.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-[#181c1e]">{profile.full_name}</div>
              <div className="text-[10px] text-[#8a9aaa] capitalize">{profile.role.replace('_', ' ')}</div>
            </div>
          </div>
          <form action={signOut} className="mt-3">
            <button className="text-[10px] font-semibold text-[#8a9aaa] hover:text-[#181c1e]">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
