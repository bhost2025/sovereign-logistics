import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations, getLocale } from 'next-intl/server'

const ROLE_COLOR: Record<string, string> = {
  super_admin:   'bg-[#eef2f8] text-[#4A6FA5]',
  operator:      'bg-[#edf6f7] text-[#1A7A8A]',
  director:      'bg-[#fdf8ec] text-[#B8860B]',
  client_viewer: 'bg-[#f0f2f5] text-[#556479]',
}

export default async function SettingsUsersPage() {
  const [profile, t, ta, locale] = await Promise.all([
    getUserProfile(),
    getTranslations('settings'),
    getTranslations('admin'),
    getLocale(),
  ])
  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, created_at')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: true })

  const ROLE_LABEL: Record<string, string> = {
    super_admin:   ta('roles.super_admin'),
    operator:      ta('roles.operator'),
    director:      ta('roles.director'),
    client_viewer: ta('roles.client_viewer'),
  }

  return (
    <div className="p-8 max-w-[860px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('users')}</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">
            {t('usersCount', { count: users?.length ?? 0 })} · {t('usersDesc')}
          </p>
        </div>
        <a href="/admin/usuarios/nuevo" className="bg-[#0a1a3c] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#142a5c] transition-colors">
          {t('newUser')}
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f0f2f5]">
              {[t('name'), t('email'), t('role'), t('status'), t('registered'), ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users?.map(u => (
              <tr key={u.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                <td className="px-5 py-3 font-bold text-[#0a1a3c]">
                  {u.full_name}
                  {u.id === profile.id && (
                    <span className="ml-1.5 text-[9px] bg-[#f0f2f5] text-[#8a9aaa] font-bold px-1.5 py-0.5 rounded">{t('you')}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-[#6b7a8a]">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${ROLE_COLOR[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {u.is_active
                    ? <span className="text-[9px] font-bold text-[#1A7A8A]">◎ {t('active')}</span>
                    : <span className="text-[9px] font-bold text-[#C05A00]">◎ {t('inactive')}</span>
                  }
                </td>
                <td className="px-5 py-3 text-[#8a9aaa]">
                  {new Date(u.created_at).toLocaleDateString(jsLocale, { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3">
                  <a href={`/admin/usuarios/${u.id}`} className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">
                    {t('edit')} →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
