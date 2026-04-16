import { createUserAction } from '../../actions'

const ERROR_MSG: Record<string, string> = {
  auth:    'El email ya está registrado o hubo un problema al crear la cuenta.',
  profile: 'La cuenta se creó pero no se pudo guardar el perfil. Contacta soporte.',
}

export default async function NuevoUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams

  return (
    <div className="p-8 max-w-[560px]">
      <div className="mb-8">
        <a href="/admin/usuarios" className="text-[10px] font-bold text-[#8a9aaa] hover:text-[#181c1e] tracking-widest uppercase">
          ← Usuarios
        </a>
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight mt-2">Nuevo Usuario</h1>
      </div>

      {sp.error && (
        <div className="mb-6 p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] text-[#C05A00] text-xs font-bold">
          ▲ {ERROR_MSG[sp.error] ?? 'Error al guardar. Verifica los datos.'}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] p-8">
        <form action={createUserAction} className="space-y-6">

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              Nombre completo *
            </label>
            <input
              name="full_name"
              required
              placeholder="Ej. Carlos Mendoza"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              Email *
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="usuario@empresa.com"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
            />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              Contraseña inicial *
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-semibold text-[#181c1e] transition-colors placeholder:font-normal placeholder:text-[#b0bac3]"
            />
            <p className="text-[10px] text-[#b0bac3] mt-1">El usuario puede cambiarla después de su primer acceso.</p>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              Rol *
            </label>
            <select
              name="role"
              required
              defaultValue="operator"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors"
            >
              <option value="operator">Operador — Gestiona contenedores, clientes y facturas</option>
              <option value="director">Director — Solo lectura, reportes y métricas</option>
              <option value="client_viewer">Cliente — Ve únicamente sus propios envíos</option>
              <option value="super_admin">Super Admin — Acceso total al sistema</option>
            </select>
          </div>

          <div className="bg-[#f7fafc] rounded-lg p-4 text-[11px] text-[#6b7a8a] space-y-1">
            <p className="font-bold text-[#0a1a3c] text-[10px] uppercase tracking-widest mb-2">Permisos por rol</p>
            <p><strong>Operador:</strong> Crea y edita contenedores, clientes, facturas. Cambia estados.</p>
            <p><strong>Director:</strong> Ve todo el sistema. No puede crear ni modificar.</p>
            <p><strong>Cliente:</strong> Acceso solo a sus propios contenedores e historial de facturas.</p>
            <p><strong>Super Admin:</strong> Todo lo anterior + gestión de usuarios.</p>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1.5">
              Idioma de la interfaz *
            </label>
            <select
              name="language"
              required
              defaultValue="es"
              className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none py-2 text-sm font-bold text-[#0a1a3c] transition-colors"
            >
              <option value="es">🇲🇽 Español</option>
              <option value="en">🇺🇸 English</option>
              <option value="zh">🇨🇳 中文</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="bg-[#0a1a3c] text-white font-bold text-sm px-6 py-2.5 rounded-md hover:bg-[#142a5c] transition-colors"
            >
              Crear Usuario
            </button>
            <a
              href="/admin/usuarios"
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
