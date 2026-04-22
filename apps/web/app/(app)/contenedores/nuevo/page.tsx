import { getTranslations } from 'next-intl/server'
import { createContainer } from '../actions'

const PUERTOS_CHINA  = ['Shanghai', 'Shenzhen', 'Guangzhou', 'Ningbo', 'Tianjin', 'Qingdao', 'Dalian']
const PUERTOS_MEXICO = ['Manzanillo', 'Lázaro Cárdenas', 'Veracruz', 'Altamira']

export default async function NuevoContenedorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [params, t] = await Promise.all([
    searchParams,
    getTranslations('containers'),
  ])

  return (
    <div className="p-8 max-w-[640px]">
      <div className="mb-8">
        <a href="/contenedores" className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase">
          ← {t('title')}
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">{t('newContainerTitle')}</h1>
      </div>

      {params.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ {t('errorDuplicate')}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
        <form action={createContainer} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('containerNumber')} *
              </label>
              <input
                name="container_number"
                required
                placeholder="MSCU1234567"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-mono font-bold text-[#0a1a3c] transition-colors uppercase placeholder:normal-case placeholder:font-normal placeholder:text-[#b0bac3]"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('bl')}
              </label>
              <input
                name="bl_number"
                placeholder="BL-2026-001"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('originPort')} *
              </label>
              <select
                name="origin_port"
                required
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors"
              >
                <option value="">{t('selectPort')}</option>
                {PUERTOS_CHINA.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('destPort')} *
              </label>
              <select
                name="destination_port"
                required
                defaultValue="Manzanillo"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors"
              >
                {PUERTOS_MEXICO.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('departure')}
              </label>
              <input
                name="departure_date"
                type="date"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('eta')}
              </label>
              <input
                name="eta_date"
                type="date"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('notes')}
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder={t('notesPlaceholder')}
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm text-[#181c1e] transition-colors resize-none placeholder:text-[#b0bac3]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#0a1a3c] text-white font-bold text-sm px-6 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
            >
              {t('registerContainer')}
            </button>
            <a
              href="/contenedores"
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
