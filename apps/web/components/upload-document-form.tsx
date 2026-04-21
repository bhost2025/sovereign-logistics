'use client'
import { useState, useRef } from 'react'
import { uploadDocument } from '@/app/(app)/contenedores/[id]/documents/actions'
import { DOCUMENT_CATEGORIES } from '@/lib/documents-config'

export function UploadDocumentForm({ containerId }: { containerId: string }) {
  const [open, setOpen]       = useState(false)
  const [pending, setPending] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    await uploadDocument(formData)
    setPending(false)
    setOpen(false)
    setFileName(null)
    formRef.current?.reset()
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#f7fafc] transition-colors"
      >
        <span className="text-xs font-bold text-[#0a1a3c]">+ Subir Documento</span>
        <span className="text-[#8a9aaa] text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <form
          ref={formRef}
          action={handleSubmit}
          className="px-5 pb-5 border-t border-[#f0f2f5] pt-4 space-y-4"
        >
          <input type="hidden" name="container_id" value={containerId} />

          {/* Category select */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-1.5">
              Categoría
            </label>
            <select
              name="category"
              required
              className="w-full text-xs font-semibold text-[#181c1e] bg-[#f7fafc] border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5]"
            >
              <option value="">Seleccionar categoría</option>
              {DOCUMENT_CATEGORIES.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label}{cat.required ? ' *' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* File input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-1.5">
              Archivo
            </label>
            <label className="flex items-center gap-3 w-full cursor-pointer bg-[#f7fafc] border border-dashed border-[#c5c6cf] rounded-lg px-4 py-3 hover:border-[#4A6FA5] transition-colors">
              <span className="text-[#4A6FA5] text-lg">↑</span>
              <span className="text-xs font-semibold text-[#6b7a8a]">
                {fileName ?? 'Seleccionar archivo o arrastrar aquí'}
              </span>
              <input
                type="file"
                name="file"
                required
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                onChange={e => setFileName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
            <p className="text-[9px] text-[#b0bac3] mt-1">PDF, Word, Excel, JPG, PNG</p>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-1.5">
              Comentarios <span className="font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              name="comments"
              rows={2}
              placeholder="Notas sobre este documento..."
              className="w-full text-xs text-[#181c1e] bg-[#f7fafc] border border-[#e8ebee] rounded-lg px-3 py-2 focus:outline-none focus:border-[#4A6FA5] resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="bg-[#0a1a3c] text-white text-xs font-bold px-5 py-2 rounded-md hover:bg-[#142a5c] transition-colors disabled:opacity-50"
            >
              {pending ? 'Subiendo...' : 'Subir Documento'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setFileName(null) }}
              className="text-xs font-semibold text-[#8a9aaa] hover:text-[#181c1e] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
