import { signIn } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f7fafc]">
      <div className="w-full max-w-sm px-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 bg-[#0a1a3c] rounded-md flex items-center justify-center text-white text-lg font-bold">
            S
          </div>
          <span className="text-[#0a1a3c] font-extrabold text-lg tracking-tight">
            Sovereign Logistics
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-[0_2px_40px_rgba(24,28,30,0.08)] p-8">
          <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight mb-1">
            Iniciar sesión
          </h1>
          <p className="text-xs font-medium text-[#8a9aaa] mb-6">
            Ingresa con tus credenciales de operación
          </p>

          <form action={signIn} className="flex flex-col gap-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none px-0 py-2 text-sm font-semibold text-[#181c1e] transition-colors"
                placeholder="operador@empresa.com"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa] block mb-1">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none px-0 py-2 text-sm font-semibold text-[#181c1e] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full bg-[#0a1a3c] text-white font-bold text-sm py-3 rounded-md hover:bg-[#142a5c] transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
