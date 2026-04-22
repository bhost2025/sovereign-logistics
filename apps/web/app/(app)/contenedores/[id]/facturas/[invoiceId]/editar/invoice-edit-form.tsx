'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { updateInvoiceAction } from '../../../../actions'

type Item = { description: string; quantity: string; unit: string; unit_price: string }

const EMPTY_ITEM: Item = { description: '', quantity: '1', unit: '', unit_price: '0' }

function toItem(raw: any): Item {
  return {
    description: raw.description ?? '',
    quantity:    String(raw.quantity ?? 1),
    unit:        raw.unit ?? '',
    unit_price:  String(raw.unit_price ?? 0),
  }
}

export function InvoiceEditForm({
  containerId,
  invoiceId,
  invoice,
  items: initialItems,
}: {
  containerId: string
  invoiceId:   string
  invoice:     any
  items:       any[]
}) {
  const t      = useTranslations('invoices')
  const locale = useLocale()
  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'

  const [items, setItems] = useState<Item[]>(
    initialItems.length > 0 ? initialItems.map(toItem) : [{ ...EMPTY_ITEM }]
  )

  function addItem()                               { setItems(p => [...p, { ...EMPTY_ITEM }]) }
  function removeItem(i: number)                   { setItems(p => p.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, f: keyof Item, v: string) {
    setItems(p => p.map((item, idx) => idx === i ? { ...item, [f]: v } : item))
  }

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
  }, 0)

  const action = updateInvoiceAction.bind(null, invoiceId, containerId)

  const inputCls = "w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="items_count" value={items.length} />

      {/* Header fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
            {t('invoiceNumberLabel')} *
          </label>
          <input
            name="invoice_number"
            required
            defaultValue={invoice.invoice_number}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
            {t('currency')}
          </label>
          <select name="currency" defaultValue={invoice.currency ?? 'USD'} className={inputCls}>
            <option value="USD">USD</option>
            <option value="MXN">MXN</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
            {t('generalDesc')}
          </label>
          <input
            name="description"
            defaultValue={invoice.description ?? ''}
            placeholder="Ej. Electrónica de consumo"
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
            {t('statusLabel')}
          </label>
          <select name="status" defaultValue={invoice.status ?? 'pendiente'} className={inputCls}>
            <option value="pendiente">{t('pendiente')}</option>
            <option value="pagada">{t('pagada')}</option>
            <option value="cancelada">{t('cancelada')}</option>
          </select>
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa]">
            {t('merchandise')}
          </span>
          <button
            type="button"
            onClick={addItem}
            className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c] transition-colors"
          >
            {t('addLine')}
          </button>
        </div>

        <div className="rounded-xl border border-[#f0f2f5] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f7fafc] border-b border-[#f0f2f5]">
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa]">{t('descriptionCol')}</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] w-20">{t('qtyCol')}</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] w-20">{t('unitCol')}</th>
                <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] w-28">{t('unitPriceCol')}</th>
                <th className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] w-24">{t('totalCol')}</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
                return (
                  <tr key={i} className="border-b border-[#f7fafc]">
                    <td className="px-2 py-1.5">
                      <input
                        name={`items[${i}][description]`}
                        value={item.description}
                        onChange={e => updateItem(i, 'description', e.target.value)}
                        placeholder={t('productDesc')}
                        required
                        className="w-full bg-transparent outline-none text-[#181c1e] placeholder:text-[#c5c6cf]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        name={`items[${i}][quantity]`}
                        value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', e.target.value)}
                        type="number" min="0" step="0.01"
                        className="w-full bg-transparent outline-none text-[#181c1e] text-right"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        name={`items[${i}][unit]`}
                        value={item.unit}
                        onChange={e => updateItem(i, 'unit', e.target.value)}
                        placeholder="pcs / kg"
                        className="w-full bg-transparent outline-none text-[#6b7a8a] placeholder:text-[#c5c6cf]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        name={`items[${i}][unit_price]`}
                        value={item.unit_price}
                        onChange={e => updateItem(i, 'unit_price', e.target.value)}
                        type="number" min="0" step="0.01"
                        className="w-full bg-transparent outline-none text-[#181c1e] text-right"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right font-bold text-[#0a1a3c]">
                      {lineTotal.toLocaleString(jsLocale, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-1.5">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(i)}
                          className="text-[#b0bac3] hover:text-red-500 font-bold text-sm leading-none"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#f7fafc]">
                <td colSpan={4} className="px-3 py-2 text-right text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                  {t('calculatedTotal')}
                </td>
                <td className="px-3 py-2 text-right font-extrabold text-[#0a1a3c]">
                  {total.toLocaleString(jsLocale, { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-3">
          <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
            {t('declaredValueCustoms')}
          </label>
          <input
            name="declared_value"
            type="number" min="0" step="0.01"
            defaultValue={invoice.declared_value ?? total.toFixed(2)}
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="bg-[#0a1a3c] text-white font-bold text-sm px-6 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
        >
          {t('saveInvoice')}
        </button>
        <a
          href={`/contenedores/${containerId}`}
          className="text-sm font-semibold text-[#8a9aaa] px-4 py-2.5 hover:text-[#181c1e] transition-colors"
        >
          {t('cancel')}
        </a>
      </div>
    </form>
  )
}
