import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations } from 'next-intl/server'
import { createPort, togglePort, deletePort } from './actions'

const COUNTRY_FLAG: Record<string, string> = {
  China: '🇨🇳', Mexico: '🇲🇽', Other: '🌐',
}
const TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  origin:      { color: '#1A7A8A', bg: '#edf6f7' },
  destination: { color: '#4A6FA5', bg: '#eef2f8' },
  both:        { color: '#B8860B', bg: '#fdf8ec' },
}

export default async function SettingsPortsPage() {
  const [profile, t] = await Promise.all([
    getUserProfile(),
    getTranslations('settings'),
  ])
  const supabase = await createClient()
  const { data: ports } = await supabase
    .from('ports')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('country')
    .order('name') as any

  const active   = (ports ?? []).filter((p: any) => p.active)
  const inactive = (ports ?? []).filter((p: any) => !p.active)

  const TYPE_LABEL: Record<string, string> = {
    origin:      t('portTypeOrigin'),
    destination: t('portTypeDestination'),
    both:        t('portTypeBoth'),
  }

  return (
    <div className="p-8 max-w-[860px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('ports')}</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">
            {t('activeCount', { active: active.length, inactive: inactive.length })}
          </p>
        </div>
      </div>

      {/* New port form */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-5 mb-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-4">{t('newPort')}</div>
        <form action={createPort} className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-[#556479] mb-1">{t('portName')} *</label>
            <input
              name="name"
              required
              placeholder="Puerto de Shanghai"
              className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#556479] mb-1">{t('portCountry')} *</label>
            <select name="country" required className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c] bg-white">
              <option value="China">🇨🇳 China</option>
              <option value="Mexico">🇲🇽 México</option>
              <option value="Other">🌐 Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#556479] mb-1">{t('portCode')}</label>
            <input
              name="code"
              placeholder="SHA"
              maxLength={6}
              className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c] font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#556479] mb-1">{t('portType')} *</label>
            <select name="type" required className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c] bg-white">
              <option value="origin">{t('portTypeOrigin')}</option>
              <option value="destination">{t('portTypeDestination')}</option>
              <option value="both">{t('portTypeBoth')}</option>
            </select>
          </div>
          <div className="col-span-3 flex items-end">
            <button
              type="submit"
              className="bg-[#0a1a3c] text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-[#142a5c] transition-colors"
            >
              {t('add')}
            </button>
          </div>
        </form>
      </div>

      {/* Ports table */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f0f2f5]">
              {[t('portCol'), t('countryCol'), t('codeCol'), t('typeCol'), t('status'), ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(ports ?? []).map((port: any, i: number) => {
              const tBadge = TYPE_COLOR[port.type] ?? TYPE_COLOR.both
              return (
                <tr key={port.id} className={`border-b border-[#f7fafc] ${i % 2 === 0 ? '' : 'bg-[#fafbfc]'} ${!port.active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3 font-bold text-[#0a1a3c]">{port.name}</td>
                  <td className="px-5 py-3 text-[#556479]">{COUNTRY_FLAG[port.country] ?? '🌐'} {port.country}</td>
                  <td className="px-5 py-3 font-mono text-[10px] text-[#6b7a8a]">{port.code ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded"
                      style={{ color: tBadge.color, background: tBadge.bg }}
                    >
                      {TYPE_LABEL[port.type] ?? port.type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {port.active
                      ? <span className="text-[9px] font-bold text-[#1A7A8A]">◎ {t('active')}</span>
                      : <span className="text-[9px] font-bold text-[#C05A00]">◎ {t('inactive')}</span>
                    }
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <form action={togglePort.bind(null, port.id, !port.active)}>
                        <button type="submit" className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">
                          {port.active ? t('deactivate') : t('activate')}
                        </button>
                      </form>
                      <form action={deletePort.bind(null, port.id)}>
                        <button type="submit" className="text-[10px] font-bold text-[#C05A00] hover:text-[#0a1a3c]">
                          {t('delete')}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
            {(!ports || ports.length === 0) && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[11px] text-[#8a9aaa]">
                  {t('noPorts')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
