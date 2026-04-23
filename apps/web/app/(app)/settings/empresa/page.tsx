import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { updateCompanyAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function SettingsEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const [sp, profile, t] = await Promise.all([
    searchParams,
    getUserProfile(),
    getTranslations('settings'),
  ])

  if (profile.role !== 'super_admin') redirect('/tablero')

  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, slug, logo_url, created_at')
    .eq('id', profile.company_id)
    .single()

  const ERROR_MSG: Record<string, string> = {
    name_required: t('companyNameRequired'),
    save_failed:   t('errorSave'),
  }

  return (
    <div className="p-8 max-w-[600px]">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('companyTitle')}</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5">{t('companySubtitle')}</p>
      </div>

      {sp.saved && (
        <div className="mb-6 p-3 rounded-lg bg-[#edf6f7] border-l-[3px] border-[#1A7A8A] text-[#1A7A8A] text-xs font-bold">
          ✓ {t('saved')}
        </div>
      )}
      {sp.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ {ERROR_MSG[sp.error] ?? t('errorSave')}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden mb-6">
        <div className="h-[2px] bg-[#4A6FA5]" />
        <form action={updateCompanyAction} className="p-6 space-y-5">

          {/* Nombre */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-1.5">
              {t('companyName')}
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={company?.name ?? ''}
              className="w-full text-sm border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
            />
          </div>

          {/* Slug — solo lectura */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-1.5">
              {t('companySlug')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={company?.slug ?? ''}
                readOnly
                className="w-full text-sm border border-[#e8ebee] rounded-lg px-3 py-2 bg-[#f7fafc] text-[#8a9aaa] font-mono cursor-not-allowed"
              />
              <span className="text-[9px] text-[#b0bac3] shrink-0">{t('companySlugNote')}</span>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-1.5">
              {t('companyLogo')}
            </label>
            <input
              name="logo_url"
              type="url"
              defaultValue={company?.logo_url ?? ''}
              placeholder="https://..."
              className="w-full text-sm border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
            />
            <p className="text-[10px] text-[#b0bac3] mt-1">{t('companyLogoNote')}</p>
            {company?.logo_url && (
              <img
                src={company.logo_url}
                alt="Logo"
                className="mt-3 h-12 object-contain rounded border border-[#e8ebee] p-1"
              />
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="text-xs font-bold bg-[#0a1a3c] text-white px-5 py-2 rounded-lg hover:bg-[#142a5c] transition-colors"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>

      {/* Info de solo lectura */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-3">
          {t('companyInfo')}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#8a9aaa]">ID</span>
            <span className="font-mono text-[10px] text-[#556479]">{company?.id}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#8a9aaa]">{t('companyCreated')}</span>
            <span className="text-[#556479]">
              {company?.created_at
                ? new Date(company.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
