import { getTranslations } from 'next-intl/server'

const PERMISSION_KEYS = [
  { key: 'viewContainers',   director: true,  operator: true,  operatorCn: true,  admin: true  },
  { key: 'editContainers',   director: false, operator: true,  operatorCn: true,  admin: true  },
  { key: 'createContainers', director: false, operator: true,  operatorCn: false, admin: true  },
  { key: 'uploadDocs',       director: false, operator: true,  operatorCn: true,  admin: true  },
  { key: 'approveDocs',      director: true,  operator: false, operatorCn: false, admin: true  },
  { key: 'createAlerts',     director: false, operator: true,  operatorCn: true,  admin: true  },
  { key: 'resolveAlerts',    director: true,  operator: true,  operatorCn: false, admin: true  },
  { key: 'exportData',       director: true,  operator: false, operatorCn: false, admin: true  },
  { key: 'manageClients',    director: true,  operator: true,  operatorCn: false, admin: true  },
  { key: 'manageSettings',   director: false, operator: false, operatorCn: false, admin: true  },
]

const ROLE_COLORS = [
  { key: 'director',   color: '#B8860B', bg: '#fdf8ec' },
  { key: 'operator',   color: '#4A6FA5', bg: '#eef2f8' },
  { key: 'operatorCn', color: '#1A7A8A', bg: '#edf6f7' },
  { key: 'admin',      color: '#0a1a3c', bg: '#f0f2f5' },
]

function Cell({ granted }: { granted: boolean }) {
  return (
    <td className="px-5 py-3 text-center">
      {granted
        ? <span className="text-[#1A7A8A] text-sm font-bold">✓</span>
        : <span className="text-[#d0d5db] text-sm">—</span>
      }
    </td>
  )
}

export default async function SettingsRolesPage() {
  const [t] = await Promise.all([
    getTranslations('settings'),
  ])

  const ROLES = [
    { key: 'director',   label: t('permMatrix.director'),   color: '#B8860B', bg: '#fdf8ec' },
    { key: 'operator',   label: t('permMatrix.operator'),   color: '#4A6FA5', bg: '#eef2f8' },
    { key: 'operatorCn', label: t('permMatrix.operatorCn'), color: '#1A7A8A', bg: '#edf6f7' },
    { key: 'admin',      label: t('permMatrix.admin'),      color: '#0a1a3c', bg: '#f0f2f5' },
  ]

  return (
    <div className="p-8 max-w-[860px]">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('roles')}</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5">{t('rolesSubtitle')}</p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {ROLES.map(r => (
          <div key={r.key} className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
            <div className="h-[3px]" style={{ background: r.color }} />
            <div className="p-4">
              <div className="text-xs font-extrabold" style={{ color: r.color }}>{r.label}</div>
              <div className="text-[9px] text-[#8a9aaa] mt-0.5 capitalize">{r.key}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Permission matrix */}
      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f0f2f5]">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] w-[280px]">
                {t('permMatrix.permission')}
              </th>
              {ROLES.map(r => (
                <th key={r.key} className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: r.color }}>
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_KEYS.map((p, i) => (
              <tr key={p.key} className={`border-b border-[#f7fafc] ${i % 2 === 0 ? '' : 'bg-[#fafbfc]'}`}>
                <td className="px-5 py-3 font-semibold text-[#181c1e]">{t(`permMatrix.${p.key}` as any)}</td>
                <Cell granted={p.director} />
                <Cell granted={p.operator} />
                <Cell granted={p.operatorCn} />
                <Cell granted={p.admin} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-[#b0bac3] mt-4">◎ {t('noteRoles')}</p>
    </div>
  )
}
