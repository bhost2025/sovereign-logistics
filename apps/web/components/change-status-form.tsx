'use client'
import { useState, useTransition } from 'react'
import { updateContainerStatus } from '@/app/(app)/contenedores/actions'
import { STATUS_CONFIG, type ContainerStatus } from './status-badge'

const ALL_STATUSES: ContainerStatus[] = [
  'en_puerto_origen', 'zarpo', 'en_transito_maritimo', 'eta_puerto_destino',
  'en_aduana', 'liberado_aduana', 'detenido_aduana', 'transito_terrestre', 'entregado',
]

export function ChangeStatusForm({
  containerId,
  currentStatus,
}: {
  containerId: string
  currentStatus: ContainerStatus
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ContainerStatus>(currentStatus)
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    if (selected === currentStatus) { setOpen(false); return }
    startTransition(() => {
      updateContainerStatus(containerId, selected, notes)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full text-xs font-bold bg-[#0a1a3c] text-white py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
      >
        Cambiar Estado
      </button>
    )
  }

  return (
    <div className="mt-4 bg-[#f7fafc] rounded-xl p-4 space-y-3 border border-[#e8ebee]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">Nuevo Estado</p>
      <div className="space-y-1.5">
        {ALL_STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s]
          const isCurrent = s === currentStatus
          const isSelected = s === selected
          return (
            <button
              key={s}
              onClick={() => setSelected(s)}
              disabled={isCurrent}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors text-xs font-semibold disabled:opacity-40"
              style={{
                background: isSelected ? cfg.color + '15' : 'transparent',
                color: isSelected ? cfg.color : '#6b7a8a',
                borderLeft: isSelected ? `3px solid ${cfg.color}` : '3px solid transparent',
              }}
            >
              <span style={{ color: cfg.color }}>{cfg.symbol}</span>
              {cfg.label}
              {isCurrent && <span className="ml-auto text-[9px] font-bold text-[#b0bac3]">Actual</span>}
            </button>
          )
        })}
      </div>

      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Notas del cambio (opcional)…"
        rows={2}
        className="w-full text-xs bg-white border border-[#e8ebee] rounded-md px-3 py-2 resize-none text-[#181c1e] placeholder:text-[#b0bac3] focus:border-[#0a1a3c] outline-none"
      />

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={pending || selected === currentStatus}
          className="flex-1 text-xs font-bold bg-[#0a1a3c] text-white py-2 rounded-md hover:bg-[#142a5c] transition-colors disabled:opacity-40"
        >
          {pending ? 'Guardando…' : 'Confirmar cambio'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-[#8a9aaa] px-3 hover:text-[#181c1e]"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
