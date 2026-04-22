import { getContainerById } from '@/lib/containers'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { updateContainer } from '../../actions'
import { can } from '@/lib/auth/can'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'

export const dynamic = 'force-dynamic'

export default async function EditarContenedorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ id }, sp, t, allowed] = await Promise.all([
    params,
    searchParams,
    getTranslations('containers'),
    can('edit_containers'),
  ])

  if (!allowed) redirect('/403')

  const [container, profile] = await Promise.all([
    getContainerById(id).catch(() => null),
    getUserProfile(),
  ])
  if (!container) notFound()

  // Load ports from DB for dropdown
  const supabase = await createClient()
  const { data: ports } = await supabase
    .from('ports')
    .select('name, country, type')
    .eq('company_id', profile.company_id)
    .eq('active', true)
    .order('country')
    .order('name') as any

  const PUERTOS_CHINA_DEFAULT  = ['Shanghai', 'Shenzhen', 'Guangzhou', 'Ningbo', 'Tianjin', 'Qingdao', 'Dalian']
  const PUERTOS_MEXICO_DEFAULT = ['Manzanillo', 'Lázaro Cárdenas', 'Veracruz', 'Altamira']

  const chinaPorts  = ports?.filter((p: any) => p.country === 'China').map((p: any) => p.name) ?? PUERTOS_CHINA_DEFAULT
  const mexicoPorts = ports?.filter((p: any) => p.country === 'Mexico').map((p: any) => p.name) ?? PUERTOS_MEXICO_DEFAULT

  const updateAction = updateContainer.bind(null, id)

  const inputCls = "w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors"

  return (
    <div className="p-8 max-w-[680px]">
      <div className="mb-8">
        <a
          href={`/contenedores/${id}`}
          className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase"
        >
          ← {container.container_number}
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">
          {t('editTitle')}
        </h1>
        <p className="text-xs text-[#8a9aaa] mt-0.5 font-mono">{container.container_number}</p>
      </div>

      {sp.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ {t('errorEdit')}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
        <form action={updateAction} className="space-y-6">

          {/* BL */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('bl')}
            </label>
            <input
              name="bl_number"
              defaultValue={container.bl_number ?? ''}
              placeholder="BL-2026-001"
              className={inputCls}
            />
          </div>

          {/* Ports */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('originPort')} *
              </label>
              <select name="origin_port" required defaultValue={container.origin_port} className={inputCls}>
                <option value="">{t('selectPort')}</option>
                {chinaPorts.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('destPort')} *
              </label>
              <select name="destination_port" required defaultValue={container.destination_port} className={inputCls}>
                {mexicoPorts.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('departure')}
              </label>
              <input
                name="departure_date"
                type="date"
                defaultValue={container.departure_date ?? ''}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('eta')}
              </label>
              <input
                name="eta_date"
                type="date"
                defaultValue={container.eta_date ?? ''}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                {t('arrival')}
              </label>
              <input
                name="arrival_date"
                type="date"
                defaultValue={container.arrival_date ?? ''}
                className={inputCls}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              {t('notes')}
            </label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={container.notes ?? ''}
              placeholder={t('notesPlaceholder')}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#0a1a3c] text-white font-bold text-sm px-6 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
            >
              {t('editBtn')}
            </button>
            <a
              href={`/contenedores/${id}`}
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
