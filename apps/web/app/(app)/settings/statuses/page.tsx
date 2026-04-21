import { STATUS_CONFIG } from '@/components/status-badge'

const STATUS_META: Record<string, { type: string; canSet: string[] }> = {
  en_puerto_origen:     { type: 'activo',    canSet: ['operator', 'super_admin'] },
  zarpo:                { type: 'activo',    canSet: ['operator', 'super_admin'] },
  en_transito_maritimo: { type: 'activo',    canSet: ['operator', 'super_admin'] },
  eta_puerto_destino:   { type: 'activo',    canSet: ['operator', 'super_admin'] },
  en_aduana:            { type: 'activo',    canSet: ['operator', 'super_admin'] },
  liberado_aduana:      { type: 'activo',    canSet: ['operator', 'super_admin'] },
  detenido_aduana:      { type: 'alerta',    canSet: ['operator', 'super_admin'] },
  transito_terrestre:   { type: 'activo',    canSet: ['operator', 'super_admin'] },
  entregado:            { type: 'final',     canSet: ['operator', 'super_admin'] },
}

const TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  activo: { label: 'Activo',  color: '#4A6FA5', bg: '#eef2f8' },
  alerta: { label: 'Alerta',  color: '#C05A00', bg: '#fef4ed' },
  final:  { label: 'Final',   color: '#1A7A8A', bg: '#edf6f7' },
}

export default function SettingsStatusesPage() {
  const statuses = Object.entries(STATUS_CONFIG)

  return (
    <div className="p-8 max-w-[800px]">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">Estados de Contenedor</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5">
          {statuses.length} estados · Ciclo de vida completo China → México
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f0f2f5]">
              {['Estado', 'Slug', 'Símbolo', 'Color', 'Tipo', 'Puede asignar'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statuses.map(([slug, cfg], i) => {
              const meta = STATUS_META[slug]
              const typeBadge = TYPE_BADGE[meta?.type ?? 'activo']
              return (
                <tr key={slug} className={`border-b border-[#f7fafc] ${i % 2 === 0 ? '' : 'bg-[#fafbfc]'}`}>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 pl-0 pr-2.5 py-0.5 rounded text-[11px] font-bold"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      <span className="w-[3px] self-stretch rounded-l" style={{ background: cfg.color }} />
                      {cfg.symbol} {cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-[10px] text-[#6b7a8a]">{slug}</td>
                  <td className="px-5 py-3 text-base">{cfg.symbol}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ background: cfg.color }} />
                      <span className="font-mono text-[10px] text-[#6b7a8a]">{cfg.color}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded"
                      style={{ color: typeBadge.color, background: typeBadge.bg }}
                    >
                      {typeBadge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[10px] text-[#8a9aaa]">
                    {meta?.canSet.join(', ') ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-[#b0bac3] mt-4">
        ◎ Agregar o renombrar estados requiere una migración de base de datos. Disponible en próxima versión.
      </p>
    </div>
  )
}
