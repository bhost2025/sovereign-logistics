const PERMISSIONS = [
  { key: 'view_containers',   label: 'Ver contenedores',        director: true,  operator: true,  operatorCn: true,  admin: true  },
  { key: 'edit_containers',   label: 'Editar contenedores',     director: false, operator: true,  operatorCn: true,  admin: true  },
  { key: 'create_containers', label: 'Crear contenedores',      director: false, operator: true,  operatorCn: false, admin: true  },
  { key: 'upload_docs',       label: 'Subir documentos',        director: false, operator: true,  operatorCn: true,  admin: true  },
  { key: 'approve_docs',      label: 'Aprobar documentos',      director: true,  operator: false, operatorCn: false, admin: true  },
  { key: 'create_alerts',     label: 'Crear alertas',           director: false, operator: true,  operatorCn: true,  admin: true  },
  { key: 'resolve_alerts',    label: 'Resolver alertas',        director: true,  operator: true,  operatorCn: false, admin: true  },
  { key: 'export_data',       label: 'Exportar datos',          director: true,  operator: false, operatorCn: false, admin: true  },
  { key: 'manage_clients',    label: 'Gestionar clientes',      director: true,  operator: true,  operatorCn: false, admin: true  },
  { key: 'manage_settings',   label: 'Gestionar configuración', director: false, operator: false, operatorCn: false, admin: true  },
]

const ROLES = [
  { key: 'director',    label: 'Director',       color: '#B8860B', bg: '#fdf8ec' },
  { key: 'operator',    label: 'Operador MX',    color: '#4A6FA5', bg: '#eef2f8' },
  { key: 'operatorCn',  label: 'Operador China', color: '#1A7A8A', bg: '#edf6f7' },
  { key: 'admin',       label: 'Super Admin',    color: '#0a1a3c', bg: '#f0f2f5' },
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

export default function SettingsRolesPage() {
  return (
    <div className="p-8 max-w-[860px]">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">Roles y Permisos</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5">
          Matriz de permisos por rol · La seguridad real se aplica vía RLS en Supabase
        </p>
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
                Permiso
              </th>
              {ROLES.map(r => (
                <th key={r.key} className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: r.color }}>
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((p, i) => (
              <tr key={p.key} className={`border-b border-[#f7fafc] ${i % 2 === 0 ? '' : 'bg-[#fafbfc]'}`}>
                <td className="px-5 py-3 font-semibold text-[#181c1e]">{p.label}</td>
                <Cell granted={p.director} />
                <Cell granted={p.operator} />
                <Cell granted={p.operatorCn} />
                <Cell granted={p.admin} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-[#b0bac3] mt-4">
        ◎ La edición granular de permisos por usuario estará disponible en una próxima versión.
        Las políticas actuales se definen en el esquema RLS de Supabase.
      </p>
    </div>
  )
}
