import { getUserProfile } from '@/lib/auth/get-user-role'
import { signOut } from '@/app/(auth)/login/actions'
import { NextIntlClientProvider } from 'next-intl'
import { setLocaleAction } from './admin/actions-locale'
import { WorldClock } from '@/components/world-clock'
import { cookies } from 'next/headers'
import type { Locale } from '@/lib/i18n'

const LANG_OPTIONS = [
  { value: 'es', label: 'Español', flag: 'ES' },
  { value: 'en', label: 'English', flag: 'EN' },
  { value: 'zh', label: '中文',    flag: '中文' },
]

async function getLocaleMessages(locale: Locale) {
  const loaders: Record<Locale, () => Promise<{ default: any }>> = {
    es: () => import('../../messages/es.json'),
    en: () => import('../../messages/en.json'),
    zh: () => import('../../messages/zh.json'),
  }
  return (await loaders[locale]()).default
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile     = await getUserProfile()
  const cookieStore = await cookies()

  // Determine locale: cookie first, then user profile, then default
  const cookieVal  = cookieStore.get('locale')?.value
  const profileLang = (profile as any).language ?? 'es'
  const locale = (['es','en','zh'].includes(cookieVal ?? '') ? cookieVal : profileLang) as Locale

  const messages = await getLocaleMessages(locale)
  const nav = (messages as any).nav

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-[240px] shrink-0 bg-white/70 backdrop-blur-[30px] shadow-[2px_0_40px_rgba(24,28,30,0.04)] flex flex-col py-7">
          {/* World Clock */}
          <WorldClock />

          {/* Logo */}
          <div className="px-6 pb-5 flex items-center gap-3">
            <div className="w-[34px] h-[34px] bg-[#0a1a3c] rounded-md flex items-center justify-center text-base font-bold text-white">S</div>
            <div>
              <div className="text-[13px] font-extrabold text-[#0a1a3c] tracking-tight leading-tight">Sovereign Logistics</div>
              <div className="text-[10px] font-medium text-[#8a9aaa] tracking-wider">CHINA · MÉXICO OPS</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 space-y-0.5">
            {profile.role !== 'operator' && (
              <a href="/dashboard" className="nav-item">◈ {nav.dashboard}</a>
            )}
            {profile.role !== 'director' && (
              <a href="/tablero" className="nav-item">⬡ {nav.tablero}</a>
            )}
            <a href="/contenedores" className="nav-item">◱ {nav.contenedores}</a>
            <a href="/clientes" className="nav-item">◎ {nav.clientes}</a>
            {profile.role === 'super_admin' && (
              <a href="/settings" className="nav-item">⚙ {nav.settings ?? nav.admin}</a>
            )}
          </nav>

          {/* User + language switcher */}
          <div className="px-6 pt-4 border-t border-[#c5c6cf]/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#0a1a3c] flex items-center justify-center text-white text-[11px] font-bold">
                {profile.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-[#181c1e]">{profile.full_name}</div>
                <div className="text-[10px] text-[#8a9aaa] capitalize">{profile.role.replace('_', ' ')}</div>
              </div>
            </div>

            {/* Language switcher */}
            <div className="flex gap-1 mb-2">
              {LANG_OPTIONS.map(opt => (
                <form key={opt.value} action={setLocaleAction}>
                  <input type="hidden" name="user_id" value={profile.id} />
                  <input type="hidden" name="locale"  value={opt.value} />
                  <input type="hidden" name="return_to" value="" />
                  <button
                    type="submit"
                    title={opt.label}
                    className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                      locale === opt.value
                        ? 'bg-[#0a1a3c] text-white'
                        : 'bg-[#f0f2f5] text-[#8a9aaa] hover:bg-[#e0e3e8]'
                    }`}
                  >
                    {opt.flag}
                  </button>
                </form>
              ))}
            </div>

            <form action={signOut}>
              <button className="text-[10px] font-semibold text-[#8a9aaa] hover:text-[#181c1e]">
                {nav.signOut}
              </button>
            </form>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </NextIntlClientProvider>
  )
}
