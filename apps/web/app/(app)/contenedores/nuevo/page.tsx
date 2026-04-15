import { createContainer } from '../actions'

const PUERTOS_CHINA = ['Shanghai', 'Shenzhen', 'Guangzhou', 'Ningbo', 'Tianjin', 'Qingdao', 'Dalian']
const PUERTOS_MEXICO = ['Manzanillo', 'Lázaro Cárdenas', 'Veracruz', 'Altamira']

export default async function NuevoContenedorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="p-8 max-w-[640px]">
      <div className="mb-8">
        <a href="/contenedores" className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase">
          ← Contenedores
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">Nuevo Contenedor</h1>
      </div>

      {params.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ Error al guardar. Verifica que el número de contenedor no exista ya.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
        <form action={createContainer} className="space-y-6">
          {/* Número y BL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                Número de Contenedor *
              </label>
              <input
                name="container_number"
                required
                placeholder="MSCU1234567"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-mono font-bold text-[#0a1a3c] transition-colors uppercase placeholder:normal-case placeholder:font-normal placeholder:text-[#b0bac3]"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                Bill of Lading
              </label>
              <input
                name="bl_number"
                placeholder="BL-2026-001"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
              />
            </div>
          </div>

          {/* Puertos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                Puerto Origen *
              </label>
              <select
                name="origin_port"
                required
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors"
              >
                <option value="">Seleccionar…</option>
                {PUERTOS_CHINA.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                Puerto Destino *
              </label>
              <select
                name="destination_port"
                required
                defaultValue="Manzanillo"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors"
              >
                {PUERTOS_MEXICO.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                Fecha de Salida
              </label>
              <input
                name="departure_date"
                type="date"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                ETA
              </label>
              <input
                name="eta_date"
                type="date"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              Notas
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Observaciones del contenedor…"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm text-[#181c1e] transition-colors resize-none placeholder:text-[#b0bac3]"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#0a1a3c] text-white font-bold text-sm px-6 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
            >
              Registrar Contenedor
            </button>
            <a
              href="/contenedores"
              className="text-sm font-semibold text-[#8a9aaa] px-4 py-2.5 hover:text-[#181c1e] transition-colors"
            >
              Cancelar
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}
