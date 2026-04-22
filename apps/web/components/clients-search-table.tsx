'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type ClientRow = {
  id: string
  name: string
  is_active: boolean
  contact_name: string | null
  email: string | null
  phone: string | null
  container_clients: Array<{ count: number }> | null
}

export function ClientsSearchTable({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState('')
  const t = useTranslations('clients')

  const filtered = query.trim() === ''
    ? clients
    : clients.filter(c => {
        const q = query.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          (c.contact_name?.toLowerCase().includes(q) ?? false) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.phone?.toLowerCase().includes(q) ?? false)
        )
      })

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
      {/* Search bar */}
      <div className="px-5 py-3 border-b border-[#f0f2f5]">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="🔍"
          className="w-full text-xs text-[#181c1e] bg-[#f7fafc] border border-[#e8ebee] rounded-md px-3 py-1.5 outline-none focus:border-[#4A6FA5] transition-colors placeholder:text-[#b0bac3]"
        />
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#f0f2f5]">
            {[t('title'), t('contact'), t('email'), t('phone'), t('containers'), ''].map(h => (
              <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(c => (
            <tr key={c.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
              <td className="px-5 py-3 font-bold text-[#0a1a3c]">
                {c.name}
                {!c.is_active && (
                  <span className="ml-1.5 text-[9px] bg-red-100 text-red-600 font-bold px-1 py-0.5 rounded">{t('inactive')}</span>
                )}
              </td>
              <td className="px-5 py-3 text-[#6b7a8a]">{c.contact_name ?? '—'}</td>
              <td className="px-5 py-3 text-[#6b7a8a]">{c.email ?? '—'}</td>
              <td className="px-5 py-3 text-[#6b7a8a]">{c.phone ?? '—'}</td>
              <td className="px-5 py-3 text-[#6b7a8a]">
                {(c.container_clients as any)?.[0]?.count ?? 0}
              </td>
              <td className="px-5 py-3">
                <a href={`/clientes/${c.id}`} className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">
                  {t('view')}
                </a>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-[#b0bac3]">
                {query ? `—` : t('empty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
