import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations } from 'next-intl/server'
import { updateUserAction, resetPasswordAction, deleteUserAction } from '../../actions'
import { notFound, redirect } from 'next/navigation'

export default async function EditarUsuarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; ok?: string }>
}) {
  const [{ id }, sp, profile, t] = await Promise.all([
    params,
    searchParams,
    getUserProfile(),
    getTranslations('admin'),
  ])

  if (profile.role !== 'super_admin') redirect('/tablero')

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (!user) notFound()

  const isSelf = user.id === profile.id

  const ERROR_MSG: Record<string, string> = {
    '1':      t('errorSave'),
    reset:    t('errorReset'),
    password: t('errorPassword'),
  }

  return (
    <div className="p-8 max-w-[560px] space-y-6">
      <div>
        <a href="/settings/users" className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase">
          {t('back')}
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">{t('editUser')}</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5">{user.email}</p>
      </div>

      {sp.error && (
        <div className="p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ {ERROR_MSG[sp.error] ?? t('errorSave')}
        </div>
      )}
      {sp.ok === 'reset' && (
        <div className="p-3 rounded-lg bg-[#e6f4ea] border-l-[3px] border-[#2D7A4F] text-[#2D7A4F] text-xs font-bold">
          ✓ {t('passwordUpdated')}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
        <form action={updateUserAction} className="space-y-6">
          <input type="hidden" name="user_id" value={user.id} />

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('fullName')} *
            </label>
            <input
              name="full_name"
              required
              defaultValue={user.full_name}
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('email')}
            </label>
            <p className="py-2 text-sm font-semibold text-[#8a9aaa]">{user.email}</p>
            <p className="text-[10px] text-[#b0bac3]">{t('emailNote')}</p>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('role')} *
            </label>
            <select
              name="role"
              required
              defaultValue={user.role}
              disabled={isSelf}
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors disabled:opacity-50"
            >
              <option value="operator">{t('roles.operator')}</option>
              <option value="director">{t('roles.director')}</option>
              <option value="client_viewer">{t('roles.client_viewer')}</option>
              <option value="super_admin">{t('roles.super_admin')}</option>
            </select>
            {isSelf && <p className="text-[10px] text-[#b0bac3] mt-1">{t('selfRoleNote')}</p>}
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-3">
              {t('status')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="is_active" value="true" defaultChecked={user.is_active} disabled={isSelf} className="accent-[#0a1a3c]" />
                <span className="text-xs font-semibold text-[#181c1e]">{t('active')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="is_active" value="false" defaultChecked={!user.is_active} disabled={isSelf} className="accent-[#0a1a3c]" />
                <span className="text-xs font-semibold text-[#181c1e]">{t('inactive')}</span>
              </label>
            </div>
            {isSelf && <p className="text-[10px] text-[#b0bac3] mt-1">{t('selfActiveNote')}</p>}
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('language')}
            </label>
            <select
              name="language"
              defaultValue={(user as any).language ?? 'es'}
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors"
            >
              <option value="es">🇲🇽 {t('languages.es')}</option>
              <option value="en">🇺🇸 {t('languages.en')}</option>
              <option value="zh">🇨🇳 {t('languages.zh')}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-[#0a1a3c] text-white font-bold text-sm px-6 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors">
              {t('saveChanges')}
            </button>
            <a href="/settings/users" className="text-sm font-semibold text-[#8a9aaa] px-4 py-2.5 hover:text-[#181c1e] transition-colors">
              {t('cancel')}
            </a>
          </div>
        </form>
      </div>

      {/* Reset password */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-5">{t('resetPassword')}</h2>
        <form action={resetPasswordAction} className="flex gap-3 items-end">
          <input type="hidden" name="user_id" value={user.id} />
          <div className="flex-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('newPassword')}
            </label>
            <input
              name="new_password"
              type="password"
              required
              minLength={8}
              placeholder={t('minChars')}
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
            />
          </div>
          <button type="submit" className="bg-[#4A6FA5] text-white font-bold text-xs px-5 py-2.5 rounded-md hover:bg-[#3a5a8a] transition-colors shrink-0">
            {t('update')}
          </button>
        </form>
      </div>

      {/* Delete user */}
      {!isSelf && (
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8 border border-red-100">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">{t('dangerZone')}</h2>
          <p className="text-xs text-[#6b7a8a] mb-4">{t('deleteUserNote')}</p>
          <form action={deleteUserAction}>
            <input type="hidden" name="user_id" value={user.id} />
            <button type="submit" className="bg-red-500 text-white font-bold text-xs px-5 py-2.5 rounded-md hover:bg-red-600 transition-colors">
              {t('deleteUserBtn')}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
