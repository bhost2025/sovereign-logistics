import { getTranslations } from 'next-intl/server'
import { getContainerById } from '@/lib/containers'
import { InvoiceForm } from './invoice-form'
import { notFound } from 'next/navigation'

export default async function NuevaFacturaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ id }, sp, t] = await Promise.all([
    params,
    searchParams,
    getTranslations('invoices'),
  ])

  const container = await getContainerById(id).catch(() => null)
  if (!container) notFound()

  const clients = (container.container_clients ?? [])
    .map((cc: any) => cc.clients)
    .filter(Boolean)
    .map((c: any) => ({ id: c.id, name: c.name }))

  return (
    <div className="p-8 max-w-[760px]">
      <div className="mb-8">
        <a
          href={`/contenedores/${id}`}
          className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase"
        >
          ← {container.container_number}
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">
          {t('pageTitle')}
        </h1>
        <p className="text-xs text-[#8a9aaa] mt-0.5">
          {t('pageSubtitle')}
        </p>
      </div>

      {sp.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ {t('errorSave')}
        </div>
      )}

      {clients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8 text-center">
          <p className="text-xs text-[#b0bac3]">{t('noClients')}</p>
          <a
            href={`/contenedores/${id}/agregar-cliente`}
            className="mt-4 inline-block text-xs font-bold text-[#4A6FA5]"
          >
            {t('addClientLink')}
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
          <InvoiceForm containerId={id} clients={clients} />
        </div>
      )}
    </div>
  )
}
