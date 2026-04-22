'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { addProduct, deleteProduct } from '@/app/(app)/contenedores/[id]/products/actions'

type Client = {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
}

type ContainerClient = {
  share_pct: number | null
  clients: Client | null
}

type Product = {
  id: string
  client_id: string
  sku: string | null
  description: string
  quantity: number
  unit: string | null
  declared_value: number | null
  currency: string
  invoice_id: string | null
}

type Invoice = {
  id: string
  invoice_number: string
  declared_value: number | null
  currency: string
  clients: { name: string } | null
}

type Props = {
  containerId: string
  clients: ContainerClient[]
  products: Product[]
  invoices: Invoice[]
  isLcl: boolean
}

const UNITS = ['cartons', 'pallets', 'pieces', 'kg', 'pcs', 'sets']

export function LclClientPanel({ containerId, clients, products, invoices, isLcl }: Props) {
  const [openClientId, setOpenClientId] = useState<string | null>(null)
  const [addingProduct, setAddingProduct] = useState(false)
  const [pending, setPending] = useState(false)
  const t  = useTranslations('cargo')
  const tc = useTranslations('containers')
  const ti = useTranslations('invoices')
  const locale = useLocale()
  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'

  const activeClient     = clients.find(cc => cc.clients?.id === openClientId)
  const clientProducts   = products.filter(p => p.client_id === openClientId)
  const clientInvoices   = invoices.filter(inv =>
    clientProducts.some(p => p.invoice_id === inv.id) || inv.clients?.name === activeClient?.clients?.name
  )
  const clientDeclaredTotal = clientProducts.reduce((sum, p) => sum + (p.declared_value ?? 0), 0)

  async function handleAddProduct(formData: FormData) {
    setPending(true)
    await addProduct(formData)
    setPending(false)
    setAddingProduct(false)
  }

  return (
    <div className="relative">
      {/* Client list */}
      <div className="space-y-2">
        {clients.map((cc) => {
          const c = cc.clients
          if (!c) return null
          const clientProds = products.filter(p => p.client_id === c.id)
          const isOpen = openClientId === c.id

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setOpenClientId(isOpen ? null : c.id)}
              className={`w-full text-left flex items-start justify-between gap-2 p-3 rounded-lg transition-colors ${
                isOpen ? 'bg-[#eef2f8] ring-1 ring-[#4A6FA5]/30' : 'hover:bg-[#f7fafc]'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#181c1e] truncate">{c.name}</div>
                {c.contact_name && <div className="text-[10px] text-[#8a9aaa]">{c.contact_name}</div>}
                {c.email        && <div className="text-[10px] text-[#8a9aaa]">{c.email}</div>}
                {clientProds.length > 0 && (
                  <div className="text-[9px] text-[#4A6FA5] font-bold mt-1">
                    {clientProds.length} {t('products').toLowerCase()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cc.share_pct != null && (
                  <span className="text-[10px] font-bold bg-[#f0f2f5] text-[#556479] px-2 py-0.5 rounded">
                    {cc.share_pct}%
                  </span>
                )}
                <span className="text-[#8a9aaa] text-[10px]">{isOpen ? '▲' : '▶'}</span>
              </div>
            </button>
          )
        })}

        {clients.length === 0 && (
          <p className="text-[11px] text-[#b0bac3] py-2">{tc('noClients')}</p>
        )}
      </div>

      {/* Inline expanded panel */}
      {openClientId && activeClient?.clients && (
        <div className="mt-3 bg-[#f7fafc] rounded-xl border border-[#e8ebee] p-4 space-y-4">

          {/* Client header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-extrabold text-[#0a1a3c]">{activeClient.clients.name}</div>
              {activeClient.clients.email && (
                <div className="text-[10px] text-[#8a9aaa]">{activeClient.clients.email}</div>
              )}
              {activeClient.clients.phone && (
                <div className="text-[10px] text-[#8a9aaa]">{activeClient.clients.phone}</div>
              )}
            </div>
            {activeClient.share_pct != null && (
              <span className="text-xs font-bold bg-[#eef2f8] text-[#4A6FA5] px-2.5 py-1 rounded">
                {activeClient.share_pct}{t('share')}
              </span>
            )}
          </div>

          {/* Declared total */}
          {clientDeclaredTotal > 0 && (
            <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{t('declaredTotal')}</span>
              <span className="text-sm font-extrabold text-[#0a1a3c]">
                USD {clientDeclaredTotal.toLocaleString(jsLocale, { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Products list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                {t('products')} ({clientProducts.length})
              </span>
              <button
                type="button"
                onClick={() => setAddingProduct(a => !a)}
                className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c] transition-colors"
              >
                {addingProduct ? t('cancel') : t('addProduct')}
              </button>
            </div>

            {/* Add product form */}
            {addingProduct && (
              <form action={handleAddProduct} className="bg-white rounded-lg p-3 mb-3 space-y-2.5 border border-[#e8ebee]">
                <input type="hidden" name="container_id" value={containerId} />
                <input type="hidden" name="client_id" value={openClientId} />

                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      name="description"
                      required
                      placeholder={t('descriptionPlaceholder')}
                      className="w-full text-xs text-[#181c1e] bg-[#f7fafc] border border-[#e8ebee] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#4A6FA5]"
                    />
                  </div>
                  <input
                    type="text"
                    name="sku"
                    placeholder={t('skuOptional')}
                    className="text-xs text-[#181c1e] bg-[#f7fafc] border border-[#e8ebee] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#4A6FA5]"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      name="quantity"
                      defaultValue="1"
                      min="0"
                      step="any"
                      placeholder={t('quantity')}
                      className="w-20 text-xs text-[#181c1e] bg-[#f7fafc] border border-[#e8ebee] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#4A6FA5]"
                    />
                    <select
                      name="unit"
                      className="flex-1 text-xs text-[#181c1e] bg-[#f7fafc] border border-[#e8ebee] rounded px-2 py-1.5 focus:outline-none focus:border-[#4A6FA5]"
                    >
                      <option value="">{t('unit')}</option>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      name="declared_value"
                      min="0"
                      step="any"
                      placeholder={t('declaredValueLabel')}
                      className="flex-1 text-xs text-[#181c1e] bg-[#f7fafc] border border-[#e8ebee] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#4A6FA5]"
                    />
                    <select
                      name="currency"
                      defaultValue="USD"
                      className="w-16 text-xs text-[#181c1e] bg-[#f7fafc] border border-[#e8ebee] rounded px-1 py-1.5 focus:outline-none focus:border-[#4A6FA5]"
                    >
                      <option value="USD">USD</option>
                      <option value="MXN">MXN</option>
                      <option value="CNY">CNY</option>
                    </select>
                  </div>
                  {invoices.length > 0 && (
                    <select
                      name="invoice_id"
                      className="col-span-2 text-xs text-[#181c1e] bg-[#f7fafc] border border-[#e8ebee] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#4A6FA5]"
                    >
                      <option value="">{t('invoiceOptional')}</option>
                      {invoices.map(inv => (
                        <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>
                      ))}
                    </select>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="bg-[#0a1a3c] text-white text-[10px] font-bold px-4 py-1.5 rounded hover:bg-[#142a5c] transition-colors disabled:opacity-50"
                >
                  {pending ? t('saving') : t('saveProduct')}
                </button>
              </form>
            )}

            {/* Products table */}
            {clientProducts.length > 0 ? (
              <div className="bg-white rounded-lg overflow-hidden border border-[#e8ebee]">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-[#f0f2f5]">
                      {[t('products'), 'SKU', t('quantity'), t('value'), ''].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clientProducts.map(p => {
                      const delAction = deleteProduct.bind(null, p.id, containerId)
                      return (
                        <tr key={p.id} className="border-b border-[#f7fafc] last:border-0">
                          <td className="px-3 py-2 font-semibold text-[#181c1e]">{p.description}</td>
                          <td className="px-3 py-2 font-mono text-[#8a9aaa]">{p.sku ?? '—'}</td>
                          <td className="px-3 py-2 text-[#6b7a8a]">{p.quantity} {p.unit ?? ''}</td>
                          <td className="px-3 py-2 font-bold text-[#556479]">
                            {p.declared_value
                              ? `${p.currency} ${Number(p.declared_value).toLocaleString()}`
                              : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <form action={delAction}>
                              <button type="submit" className="text-[9px] font-bold text-[#b0bac3] hover:text-[#C05A00] transition-colors">✕</button>
                            </form>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] text-[#b0bac3] py-2 text-center bg-white rounded-lg border border-[#e8ebee] px-3">
                {t('noProducts')}
              </p>
            )}
          </div>

          {/* Linked invoices */}
          {clientInvoices.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-2">
                {t('linkedInvoices')} ({clientInvoices.length})
              </div>
              <div className="space-y-1.5">
                {clientInvoices.map(inv => (
                  <div key={inv.id} className="bg-white rounded-lg px-3 py-2 flex items-center justify-between border border-[#e8ebee]">
                    <span className="text-xs font-bold text-[#0a1a3c]">{inv.invoice_number}</span>
                    {inv.declared_value && (
                      <span className="text-[10px] font-bold text-[#556479]">
                        {inv.currency} {Number(inv.declared_value).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link to client profile */}
          <a
            href={`/clientes/${openClientId}`}
            className="block text-center text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c] transition-colors py-1"
          >
            {t('viewProfile')}
          </a>
        </div>
      )}
    </div>
  )
}
