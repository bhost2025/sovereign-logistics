import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { createAgency, toggleAgency, deleteAgency } from './actions'

const AGENCY_TYPE: Record<string, { label: string; color: string; bg: string }> = {
  customs:           { label: 'Aduana',            color: '#B8860B', bg: '#fdf8ec' },
  freight_forwarder: { label: 'Freight Forwarder', color: '#4A6FA5', bg: '#eef2f8' },
  transport:         { label: 'Transporte',         color: '#1A7A8A', bg: '#edf6f7' },
}

export default async function SettingsAgenciesPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()
  const { data: agencies } = await supabase
    .from('agencies')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('type')
    .order('name') as any

  const active   = (agencies ?? []).filter((a: any) => a.active).length
  const inactive = (agencies ?? []).filter((a: any) => !a.active).length

  return (
    <div className="p-8 max-w-[900px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">Agencias y Proveedores</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">
            {active} activos · {inactive} inactivos
          </p>
        </div>
      </div>

      {/* New agency form */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-5 mb-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-4">+ Agregar Agencia</div>
        <form action={createAgency} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#556479] mb-1">Nombre *</label>
              <input
                name="name"
                required
                placeholder="Agencia Aduanal del Norte"
                className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#556479] mb-1">Tipo *</label>
              <select name="type" required className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c] bg-white">
                <option value="customs">Aduana</option>
                <option value="freight_forwarder">Freight Forwarder</option>
                <option value="transport">Transporte</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#556479] mb-1">Contacto</label>
              <input
                name="contact_name"
                placeholder="Nombre del contacto"
                className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#556479] mb-1">Email</label>
              <input
                name="contact_email"
                type="email"
                placeholder="contacto@agencia.com"
                className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#556479] mb-1">Teléfono</label>
              <input
                name="contact_phone"
                placeholder="+52 55 0000 0000"
                className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#556479] mb-1">Especialización</label>
              <input
                name="specialization"
                placeholder="Importación marítima, LCL..."
                className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#556479] mb-1">Notas</label>
              <input
                name="notes"
                placeholder="Notas adicionales..."
                className="w-full text-xs border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="bg-[#0a1a3c] text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-[#142a5c] transition-colors"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>

      {/* Agencies table */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f0f2f5]">
              {['Nombre', 'Tipo', 'Contacto', 'Email / Tel', 'Estado', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(agencies ?? []).map((agency: any, i: number) => {
              const typeBadge = AGENCY_TYPE[agency.type] ?? AGENCY_TYPE.customs
              return (
                <tr key={agency.id} className={`border-b border-[#f7fafc] ${i % 2 === 0 ? '' : 'bg-[#fafbfc]'} ${!agency.active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="font-bold text-[#0a1a3c]">{agency.name}</div>
                    {agency.specialization && (
                      <div className="text-[10px] text-[#8a9aaa] mt-0.5">{agency.specialization}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded"
                      style={{ color: typeBadge.color, background: typeBadge.bg }}
                    >
                      {typeBadge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[#556479]">{agency.contact_name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="text-[#556479]">{agency.contact_email ?? '—'}</div>
                    {agency.contact_phone && (
                      <div className="text-[10px] text-[#8a9aaa] mt-0.5">{agency.contact_phone}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {agency.active
                      ? <span className="text-[9px] font-bold text-[#1A7A8A]">◎ Activo</span>
                      : <span className="text-[9px] font-bold text-[#C05A00]">◎ Inactivo</span>
                    }
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <form action={toggleAgency.bind(null, agency.id, !agency.active)}>
                        <button type="submit" className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]">
                          {agency.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </form>
                      <form action={deleteAgency.bind(null, agency.id)}>
                        <button type="submit" className="text-[10px] font-bold text-[#C05A00] hover:text-[#0a1a3c]">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
            {(!agencies || agencies.length === 0) && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-[11px] text-[#8a9aaa]">
                  No hay agencias registradas. Agrega la primera arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
