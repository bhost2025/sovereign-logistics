import { getContainerById } from '@/lib/containers'
import { getClients } from '@/lib/clients'
import { addClientToContainer } from '../../actions'
import { notFound } from 'next/navigation'

export default async function AgregarClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const [container, allClients] = await Promise.all([
    getContainerById(id).catch(() => null),
    getClients(),
  ])
  if (!container) notFound()

  // Clients already linked
  const linkedIds = new Set(container.container_clients?.map((cc: any) => cc.clients?.id).filter(Boolean))
  const available = allClients.filter(c => !linkedIds.has(c.id))

  return (
    <div className="p-8 max-w-[540px]">
      <div className="mb-8">
        <a
          href={`/contenedores/${id}`}
          className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase"
        >
          ← {container.container_number}
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">
          Agregar Cliente
        </h1>
        <p className="text-xs text-[#8a9aaa] mt-0.5">
          Vincula un cliente a este contenedor LCL
        </p>
      </div>

      {sp.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ Error al guardar. Verifica los datos e intenta de nuevo.
        </div>
      )}

      {available.length === 0 ? (
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8 text-center">
          <p className="text-xs text-[#b0bac3]">Todos los clientes ya están vinculados a este contenedor.</p>
          <a href={`/contenedores/${id}`} className="mt-4 inline-block text-xs font-bold text-[#4A6FA5]">
            ← Volver al contenedor
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
          <form action={addClientToContainer} className="space-y-6">
            <input type="hidden" name="container_id" value={id} />

            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                Cliente *
              </label>
              <select
                name="client_id"
                required
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors"
              >
                <option value="">— Selecciona un cliente —</option>
                {available.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.contact_name ? ` · ${c.contact_name}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
                % Participación en el contenedor
              </label>
              <input
                name="share_pct"
                type="number"
                min="1"
                max="100"
                placeholder="Ej. 40"
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
              />
              <p className="text-[10px] text-[#b0bac3] mt-1">Opcional. Indica qué porcentaje del contenedor ocupa este cliente.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-[#0a1a3c] text-white font-bold text-sm px-6 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
              >
                Agregar Cliente
              </button>
              <a
                href={`/contenedores/${id}`}
                className="text-sm font-semibold text-[#8a9aaa] px-4 py-2.5 hover:text-[#181c1e] transition-colors"
              >
                Cancelar
              </a>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
