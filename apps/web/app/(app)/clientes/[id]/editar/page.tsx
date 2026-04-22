import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { can } from '@/lib/auth/can'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { updateClientAction } from '../../actions'

export const dynamic = 'force-dynamic'

export default async function EditarClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ id }, sp, t, allowed] = await Promise.all([
    params,
    searchParams,
    getTranslations('clients'),
    can('edit_clients'),
  ])

  if (!allowed) redirect('/403')

  const profile = await getUserProfile()
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('company_id', profile.company_id)
    .single()

  if (!client) notFound()

  const updateAction = updateClientAction.bind(null, id)

  const inputCls = "w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
  const labelCls = "text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5"

  return (
    <div className="p-8 max-w-[560px]">
      <div className="mb-8">
        <a
          href={`/clientes/${id}`}
          className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase"
        >
          ← {client.name}
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">{t('editTitle')}</h1>
      </div>

      {sp.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ {t('errorSave')}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
        <form action={updateAction} className="space-y-5">
          <div>
            <label className={labelCls}>{t('companyName')} *</label>
            <input
              name="name"
              required
              defaultValue={client.name}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>{t('contactName')}</label>
            <input
              name="contact_name"
              defaultValue={client.contact_name ?? ''}
              placeholder={t('contactName')}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('email')}</label>
              <input
                name="email"
                type="email"
                defaultValue={client.email ?? ''}
                placeholder="contacto@empresa.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>{t('phone')}</label>
              <input
                name="phone"
                defaultValue={client.phone ?? ''}
                placeholder="+52 55 0000 0000"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#0a1a3c] text-white font-bold text-sm px-6 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
            >
              {t('editBtn')}
            </button>
            <a
              href={`/clientes/${id}`}
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
