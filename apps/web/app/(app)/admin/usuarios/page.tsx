import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { redirect } from 'next/navigation'

const ROLE_LABEL: Record<string, string> = {
  super_admin:   'Super Admin',
  operator:      'Operador',
  director:      'Director',
  client_viewer: 'Cliente',
}

const ROLE_COLOR: Record<string, string> = {
  super_admin:   'bg-purple-100 text-purple-700',
  operator:      'bg-sky-100 text-sky-700',
  director:      'bg-emerald-100 text-emerald-700',
  client_viewer: 'bg-amber-100 text-amber-700',
}

export default async function UsuariosPage() {
  const profile = await getUserProfile()
  if (profile.role !== 'super_admin') redirect('/tablero')

  const supabase = await createClient()
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, created_at')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: true })

  return (
    <div className="p-8 max-w-[900px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold text-[#8a9aaa] tracking-widest uppercase">Admin</p>
          <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-1">Usuarios</h1>
          <p className="text-[11px] text-[#8a9aaa] mt-0.5">{users?.length ?? 0} cuentas registradas</p>
        </div>
        <a
          href="/admin/usuarios/nuevo"
          className="bg-[#0a1a3c] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#142a5c] transition-colors"
        >
          + Nuevo Usuario
        </a>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f0f2f5]">
              {['Nombre', 'Email', 'Rol', 'Estado', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users?.map(u => (
              <tr key={u.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                <td className="px-5 py-3 font-bold text-[#0a1a3c]">
                  {u.full_name}
                  {u.id === profile.id && (
                    <span className="ml-1.5 text-[9px] bg-[#f0f2f5] text-[#8a9aaa] font-bold px-1.5 py-0.5 rounded">Tú</span>
                  )}
                </td>
                <td className="px-5 py-3 text-[#6b7a8a]">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${ROLE_COLOR[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {u.is_active
                    ? <span className="text-[9px] font-bold text-emerald-600">Activo</span>
                    : <span className="text-[9px] font-bold text-red-500">Inactivo</span>
                  }
                </td>
                <td className="px-5 py-3">
                  <a
                    href={`/admin/usuarios/${u.id}`}
                    className="text-[10px] font-bold text-[#4A6FA5] hover:text-[#0a1a3c]"
                  >
                    Editar →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
