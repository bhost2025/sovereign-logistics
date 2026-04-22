'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveRolePermissions } from './actions'

interface Role {
  key: string
  color: string
  bg: string
}

interface PermGroup {
  group: string
  keys: string[]
}

interface Props {
  roles: Role[]
  activeRole: string
  permMap: Record<string, Record<string, boolean>>
  permissionGroups: PermGroup[]
  permLabels: Record<string, string>
  roleLabels: Record<string, string>
  saved: boolean
  labels: {
    save: string
    saving: string
    permSaved: string
    noteRoles: string
    permission: string
  }
}

export function RolesEditor({
  roles, activeRole, permMap, permissionGroups, permLabels, roleLabels, labels,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [currentRole, setCurrentRole] = useState(activeRole)
  const [localPerms, setLocalPerms] = useState<Record<string, Record<string, boolean>>>(permMap)
  const [flash, setFlash] = useState(false)

  const activeRoleData = roles.find(r => r.key === currentRole)!
  const currentPerms = localPerms[currentRole] ?? {}

  function toggle(permission: string) {
    if (currentRole === 'super_admin') return // super_admin always full access
    setLocalPerms(prev => ({
      ...prev,
      [currentRole]: { ...prev[currentRole], [permission]: !prev[currentRole]?.[permission] },
    }))
  }

  function handleSave() {
    startTransition(async () => {
      await saveRolePermissions(currentRole, localPerms[currentRole] ?? {})
      setFlash(true)
      setTimeout(() => setFlash(false), 2500)
    })
  }

  return (
    <>
      {/* Role tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {roles.map(r => (
          <button
            key={r.key}
            onClick={() => {
              setCurrentRole(r.key)
              router.replace(`/settings/roles?role=${r.key}`, { scroll: false })
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border"
            style={
              currentRole === r.key
                ? { background: r.bg, borderColor: r.color, color: r.color }
                : { background: '#fff', borderColor: '#e8ebee', color: '#556479' }
            }
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: r.color }}
            />
            {roleLabels[r.key] ?? r.key}
          </button>
        ))}
      </div>

      {/* Permission table */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden mb-4">
        {permissionGroups.map(({ group, keys }) => (
          <div key={group}>
            <div
              className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b border-[#f0f2f5]"
              style={{ background: activeRoleData.bg, color: activeRoleData.color }}
            >
              {group}
            </div>
            {keys.map((perm, i) => {
              const granted = currentPerms[perm] ?? false
              const isLocked = currentRole === 'super_admin'

              return (
                <button
                  key={perm}
                  onClick={() => toggle(perm)}
                  disabled={isLocked}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors border-b border-[#f7fafc] last:border-0
                    ${isLocked ? 'cursor-default' : 'hover:bg-[#f7fafc] cursor-pointer'}
                    ${i % 2 === 1 ? 'bg-[#fafbfc]' : ''}`}
                >
                  <span className="text-xs text-[#181c1e] font-medium">
                    {permLabels[perm] ?? perm}
                  </span>
                  <span
                    className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all
                      ${granted
                        ? 'text-white'
                        : 'bg-[#f0f2f5] text-[#c5c6cf]'
                      }`}
                    style={granted ? { background: activeRoleData.color } : {}}
                  >
                    {granted ? '✓' : '—'}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#b0bac3]">◎ {labels.noteRoles}</p>
        <div className="flex items-center gap-3">
          {flash && (
            <span className="text-[11px] font-bold text-[#1A7A8A]">
              ✓ {labels.permSaved}
            </span>
          )}
          {currentRole !== 'super_admin' && (
            <button
              onClick={handleSave}
              disabled={pending}
              className="bg-[#0a1a3c] text-white text-xs font-bold px-5 py-2 rounded-lg hover:bg-[#142a5c] transition-colors disabled:opacity-60"
            >
              {pending ? labels.saving : labels.save}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
