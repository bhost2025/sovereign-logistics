import { getTranslations } from 'next-intl/server'
import { createUserAction } from '../../actions'

export default async function NuevoUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [sp, t] = await Promise.all([
    searchParams,
    getTranslations('admin'),
  ])

  const ERROR_MSG: Record<string, string> = {
    auth:    t('errorAuth'),
    profile: t('errorProfile'),
  }

  return (
    <div className="p-8 max-w-[560px]">
      <div className="mb-8">
        <a href="/settings/users" className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase">
          {t('back')}
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">{t('newUser')}</h1>
      </div>

      {sp.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ {ERROR_MSG[sp.error] ?? t('errorSave')}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
        <form action={createUserAction} className="space-y-6">

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('fullName')} *
            </label>
            <input
              name="full_name"
              required
              placeholder="Ej. Carlos Mendoza"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('email')} *
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="usuario@empresa.com"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('initialPassword')} *
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder={t('minChars')}
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
            />
            <p className="text-[10px] text-[#b0bac3] mt-1">{t('passwordNote')}</p>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('role')} *
            </label>
            <select
              name="role"
              required
              defaultValue="operator"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors"
            >
              <option value="operator">{t('roleOperatorDesc')}</option>
              <option value="director">{t('roleDirectorDesc')}</option>
              <option value="client_viewer">{t('roleClientDesc')}</option>
              <option value="super_admin">{t('roleAdminDesc')}</option>
            </select>
          </div>

          <div className="bg-[#f7fafc] rounded-lg p-4 text-[11px] text-[#6b7a8a] space-y-1">
            <p className="font-bold text-[#0a1a3c] text-[10px] uppercase tracking-widest mb-2">{t('permissionsTitle')}</p>
            <p><strong>{t('roles.operator')}:</strong> {t('permOperator')}</p>
            <p><strong>{t('roles.director')}:</strong> {t('permDirector')}</p>
            <p><strong>{t('roles.client_viewer')}:</strong> {t('permClient')}</p>
            <p><strong>{t('roles.super_admin')}:</strong> {t('permAdmin')}</p>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('language')} *
            </label>
            <select
              name="language"
              required
              defaultValue="es"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors"
            >
              <option value="es">🇲🇽 {t('languages.es')}</option>
              <option value="en">🇺🇸 {t('languages.en')}</option>
              <option value="zh">🇨🇳 {t('languages.zh')}</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#0a1a3c] text-white font-bold text-sm px-6 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
            >
              {t('createUser')}
            </button>
            <a
              href="/settings/users"
              className="text-sm font-semibold text-[#8a9aaa] px-4 py-2.5 hover:text-[#181c1e] transition-colors"
            >
              {t('cancel')}
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
