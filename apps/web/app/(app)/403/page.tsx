export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7fafc] gap-4">
      <span className="text-5xl text-[#C05A00]">▲</span>
      <h1 className="text-2xl font-extrabold text-[#0a1a3c]">Sin permiso</h1>
      <p className="text-xs text-[#8a9aaa] max-w-xs text-center">
        Tu rol no tiene acceso a esta acción. Contacta al administrador si crees que esto es un error.
      </p>
      <a
        href="/tablero"
        className="mt-4 text-xs font-bold text-white bg-[#0a1a3c] px-5 py-2.5 rounded-lg hover:bg-[#142a5c] transition-colors"
      >
        ← Volver al tablero
      </a>
    </div>
  )
}
