import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import { can } from '@/lib/auth/can'
import { createClient } from '@/lib/supabase/server'
import { InvoiceEditForm } from './invoice-edit-form'

export const dynamic = 'force-dynamic'

export default async function EditarFacturaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; invoiceId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const [{ id, invoiceId }, sp, t, allowed] = await Promise.all([
    params,
    searchParams,
    getTranslations('invoices'),
    can('create_invoices'),
  ])

  if (!allowed) redirect('/403')

  const supabase = await createClient() as any

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, invoice_items(*), clients(id, name)')
    .eq('id', invoiceId)
    .single()

  if (!invoice) notFound()

  return (
    <div className="p-8 max-w-[760px]">
      <div className="mb-8">
        <a
          href={`/contenedores/${id}`}
          className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase"
        >
          ← {t('backToContainer')}
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">
          {t('editTitle')}
        </h1>
        <p className="text-xs text-[#8a9aaa] mt-0.5">{invoice.invoice_number}</p>
      </div>

      {sp.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ {t('errorSave')}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
        <InvoiceEditForm
          containerId={id}
          invoiceId={invoiceId}
          invoice={invoice}
          items={invoice.invoice_items ?? []}
        />
      </div>
    </div>
  )
}
