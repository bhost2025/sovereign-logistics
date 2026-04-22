'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { StatusBadge } from '@/components/status-badge'
import type { ContainerStatus } from '@/components/status-badge'

type ContainerRow = {
  id: string
  container_number: string
  bl_number: string | null
  origin_port: string
  destination_port: string
  eta_date: string | null
  current_status: string
  container_clients: Array<{
    clients: { name: string } | null
  }> | null
}

export function ContainersSearchTable({ containers }: { containers: ContainerRow[] }) {
  const [query, setQuery] = useState('')
  const t  = useTranslations('containers')
  const ts = useTranslations('status')
  const locale = useLocale()
  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'

  const filtered = query.trim() === ''
    ? containers
    : containers.filter(c => {
        const q = query.toLowerCase()
        const clientName = c.container_clients?.[0]?.clients?.name?.toLowerCase() ?? ''
        return (
          c.container_number.toLowerCase().includes(q) ||
          (c.bl_number?.toLowerCase().includes(q) ?? false) ||
          c.origin_port.toLowerCase().includes(q) ||
          c.destination_port.toLowerCase().includes(q) ||
          clientName.includes(q)
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
            {[t('container'), t('bl'), t('client'), t('route'), t('eta'), t('status'), ''].map(h => (
              <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(c => {
            const client = c.container_clients?.[0]?.clients?.name ?? '—'
            const isLcl  = (c.container_clients?.length ?? 0) > 1
            return (
              <tr key={c.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                <td className="px-5 py-3 font-mono font-bold text-[#0a1a3c] text-[11px]">{c.container_number}</td>
                <td className="px-5 py-3 text-[#6b7a8a]">{c.bl_number ?? '—'}</td>
                <td className="px-5 py-3 text-[#181c1e]">
                  {client}
                  {isLcl && <span className="ml-1.5 text-[9px] bg-sky-100 text-sky-700 font-bold px-1 py-0.5 rounded">LCL</span>}
                </td>
                <td className="px-5 py-3 text-[#6b7a8a]">{c.origin_port} → {c.destination_port}</td>
                <td className="px-5 py-3 text-[#6b7a8a]">
                  {c.eta_date
                    ? new Date(c.eta_date).toLocaleDateString(jsLocale, { day: '2-digit', month: 'short' })
                    : '—'}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={c.current_status as ContainerStatus} label={ts(c.current_status as any)} />
                </td>
                <td className="px-5 py-3">
                  <a href={`/contenedores/${c.id}`} className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">{t('view')}</a>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-[#b0bac3]">
                {query ? `—` : t('empty')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
