import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { updateNotificationSetting } from './actions'

const EVENT_META: Record<string, { label: string; description: string; hasThreshold: boolean; icon: string }> = {
  container_detained: {
    label:        'Contenedor Detenido',
    description:  'Alerta cuando un contenedor entra en estado "Detenido en Aduana"',
    hasThreshold: false,
    icon:         '◆',
  },
  missing_docs: {
    label:        'Documentos Faltantes',
    description:  'Alerta cuando faltan documentos requeridos antes del zarpe o despacho',
    hasThreshold: false,
    icon:         '◱',
  },
  eta_soon: {
    label:        'ETA Próximo',
    description:  'Recordatorio cuando el ETA a puerto destino está dentro del umbral de días',
    hasThreshold: true,
    icon:         '◎',
  },
  not_updated: {
    label:        'Sin Actualización',
    description:  'Alerta cuando un contenedor activo no tiene actualizaciones de estado',
    hasThreshold: true,
    icon:         '◈',
  },
}

const ROLE_OPTIONS = [
  { value: 'director',    label: 'Director' },
  { value: 'operator',    label: 'Operador MX' },
  { value: 'super_admin', label: 'Super Admin' },
]

export default async function SettingsNotificationsPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at') as any

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s: any) => [s.event_type, s])
  )

  return (
    <div className="p-8 max-w-[720px]">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">Notificaciones</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5">
          Configura qué eventos generan alertas y quiénes las reciben
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(EVENT_META).map(([eventType, meta]) => {
          const setting = settingsMap[eventType]
          if (!setting) return (
            <div key={eventType} className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-5">
              <div className="text-[11px] text-[#8a9aaa]">{meta.label} — sin configurar (ejecuta la migración)</div>
            </div>
          )

          return (
            <div key={eventType} className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
              {/* Header strip */}
              <div className="h-[2px] bg-[#4A6FA5]" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-[#4A6FA5]">{meta.icon}</span>
                      <span className="text-sm font-extrabold text-[#0a1a3c]">{meta.label}</span>
                    </div>
                    <p className="text-[10px] text-[#8a9aaa]">{meta.description}</p>
                  </div>
                  {/* Enabled toggle (visual, form drives it) */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded mt-1 shrink-0 ${setting.enabled ? 'bg-[#edf6f7] text-[#1A7A8A]' : 'bg-[#f0f2f5] text-[#8a9aaa]'}`}>
                    {setting.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <form action={updateNotificationSetting.bind(null, eventType)} className="space-y-4">
                  {/* Enabled toggle */}
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] font-bold text-[#556479] w-28 shrink-0">Habilitado</label>
                    <select
                      name="enabled"
                      defaultValue={setting.enabled ? 'true' : 'false'}
                      className="text-xs border border-[#e8ebee] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c] bg-white"
                    >
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  {/* Threshold */}
                  {meta.hasThreshold && (
                    <div className="flex items-center gap-3">
                      <label className="text-[10px] font-bold text-[#556479] w-28 shrink-0">Días umbral</label>
                      <input
                        name="days_threshold"
                        type="number"
                        min={1}
                        max={90}
                        defaultValue={setting.days_threshold ?? 5}
                        className="w-20 text-xs border border-[#e8ebee] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4A6FA5] text-[#0a1a3c]"
                      />
                      <span className="text-[10px] text-[#8a9aaa]">días sin actualización</span>
                    </div>
                  )}
                  {!meta.hasThreshold && (
                    <input type="hidden" name="days_threshold" value="" />
                  )}

                  {/* Notify roles */}
                  <div className="flex items-start gap-3">
                    <label className="text-[10px] font-bold text-[#556479] w-28 shrink-0 mt-0.5">Notificar a</label>
                    <div className="flex flex-wrap gap-3">
                      {ROLE_OPTIONS.map(role => (
                        <label key={role.value} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            name="notify_roles"
                            value={role.value}
                            defaultChecked={(setting.notify_roles ?? []).includes(role.value)}
                            className="rounded"
                          />
                          <span className="text-[11px] text-[#0a1a3c] font-semibold">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="text-[10px] font-bold bg-[#0a1a3c] text-white px-4 py-1.5 rounded-lg hover:bg-[#142a5c] transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-[#b0bac3] mt-6">
        ◎ El envío real de notificaciones (email / push) estará disponible en una próxima versión.
        Por ahora, estos ajustes configuran las alertas visibles en el tablero.
      </p>
    </div>
  )
}
