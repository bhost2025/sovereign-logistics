import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type Locale = 'es' | 'en' | 'zh'
export const LOCALES: Locale[] = ['es', 'en', 'zh']
export const DEFAULT_LOCALE: Locale = 'es'

export function isValidLocale(l: string): l is Locale {
  return LOCALES.includes(l as Locale)
}

export default getRequestConfig(async () => {
  let locale: Locale = DEFAULT_LOCALE

  // 1. Try cookie (set when user clicks language switcher)
  const cookieStore = await cookies()
  const cookieVal = cookieStore.get('locale')?.value
  if (cookieVal && isValidLocale(cookieVal)) {
    locale = cookieVal
  } else {
    // 2. Fall back to user profile language
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('language')
          .eq('id', user.id)
          .single()
        const lang = (profile as any)?.language
        if (lang && isValidLocale(lang)) locale = lang
      }
    } catch {}
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
