import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { EmailForm } from './email-form'

export const dynamic = 'force-dynamic'

export default async function SettingsEmailPage() {
  const [profile, t, locale] = await Promise.all([
    getUserProfile(),
    getTranslations('settings'),
    getLocale(),
  ])
  if (profile.role !== 'super_admin') redirect('/tablero')

  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'

  const supabase = await createClient()
  const { data: cfg } = await (supabase as any)
    .from('email_config')
    .select('*')
    .eq('company_id', profile.company_id)
    .single()

  const labels = {
    save:                t('save'),
    saving:              t('saving'),
    smtpHost:            t('smtpHost'),
    smtpPort:            t('smtpPort'),
    smtpUser:            t('smtpUser'),
    smtpPass:            t('smtpPass'),
    smtpPassPlaceholder: t('smtpPassPlaceholder'),
    encryption:          t('encryption'),
    fromName:            t('fromName'),
    fromEmail:           t('fromEmail'),
    testEmail:           t('testEmail'),
    testEmailSent:       t('testEmailSent', { email: '{email}' }),
    testEmailError:      t('testEmailError', { error: '{error}' }),
    emailVerified:       t('emailVerified'),
    emailNotVerified:    t('emailNotVerified'),
    lastTest:            t('lastTest'),
    saveEmail:           t('saveEmail'),
    emailNote:           t('emailNote'),
  }

  return (
    <div className="p-8 max-w-[700px]">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('emailTitle')}</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5">{t('emailSubtitle')}</p>
      </div>

      <EmailForm
        config={cfg ?? {
          smtp_host: null, smtp_port: 587, smtp_user: null,
          encryption: 'tls', from_name: null, from_email: null,
          is_verified: false, last_test_at: null,
        }}
        labels={labels}
        jsLocale={jsLocale}
      />
    </div>
  )
}
