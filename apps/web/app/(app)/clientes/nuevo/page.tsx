import { getTranslations } from 'next-intl/server'
import { createClientAction } from '../actions'

export default async function NuevoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations('clients'),
  ])

  return (
    <div className="p-8 max-w-[640px]">
      <div className="mb-8">
        <a href="/clientes" className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase">
          ← {t('title')}
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">{t('newClientTitle')}</h1>
      </div>

      {params.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ {t('errorSave')}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
        <form action={createClientAction} className="space-y-6">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('companyName')} *
            </label>
            <input
              name="name"
              required
              placeholder="Ej. Importaciones García S.A."
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('contactName')}
            </label>
            <input
              name="contact_name"
              placeholder="Ej. Juan García"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('email')}
              </label>
              <input
                name="email"
                type="email"
                placeholder="contacto@empresa.com"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('phone')}
              </label>
              <input
                name="phone"
                placeholder="+52 477 000 0000"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#0a1a3c] text-white font-bold text-sm px-6 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
            >
              {t('registerClient')}
            </button>
            <a
              href="/clientes"
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
