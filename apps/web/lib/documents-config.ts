// Pure constants — safe to import from both server and client components

export const DOCUMENT_CATEGORIES = [
  { slug: 'factura_comercial',   label: 'Facturas Comerciales',       required: true  },
  { slug: 'factura_contenedor',  label: 'Factura General Contenedor',  required: true  },
  { slug: 'packing_list',        label: 'Packing List',               required: true  },
  { slug: 'ficha_tecnica',       label: 'Fichas Técnicas',            required: false },
  { slug: 'recibo_mercancia',    label: 'Recibos Pago Mercancía',     required: true  },
  { slug: 'recibo_flete',        label: 'Recibos Pago Flete',         required: true  },
  { slug: 'documento_aduanal',   label: 'Documentos Aduanales',       required: true  },
  { slug: 'certificado_origen',  label: 'Certificados de Origen',     required: false },
  { slug: 'permiso',             label: 'Permisos',                   required: false },
  { slug: 'foto_mercancia',      label: 'Fotos Mercancía / Carga',    required: false },
] as const

export type DocStatus = 'uploaded' | 'pending_review' | 'approved' | 'rejected'

export const DOC_STATUS_CONFIG: Record<DocStatus, {
  label: string
  symbol: string
  color: string
  bg: string
}> = {
  uploaded:       { label: 'Subido',             symbol: '◎', color: '#4A6FA5', bg: '#eef2f8' },
  pending_review: { label: 'Pendiente revisión',  symbol: '◆', color: '#B8860B', bg: '#fdf8ec' },
  approved:       { label: 'Aprobado',            symbol: '✓', color: '#1A7A8A', bg: '#edf6f7' },
  rejected:       { label: 'Rechazado',           symbol: '▲', color: '#C05A00', bg: '#fef4ed' },
}
