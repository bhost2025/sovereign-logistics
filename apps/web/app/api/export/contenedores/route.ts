import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function toCSV(rows: (string | number | null)[][]): string {
  return rows
    .map(row =>
      row.map(cell => {
        const v = cell === null || cell === undefined ? '' : String(cell)
        return `"${v.replace(/"/g, '""')}"`
      }).join(',')
    )
    .join('\n')
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('containers')
    .select(`
      container_number, bl_number, origin_port, destination_port,
      current_status, departure_date, eta_date, arrival_date,
      notes, updated_at, created_at,
      container_clients(clients(name))
    `)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = [
    'Número', 'BL', 'Puerto Origen', 'Puerto Destino',
    'Estado', 'Salida', 'ETA', 'Llegada',
    'Cliente(s)', 'Tipo', 'Notas', 'Última actualización', 'Creado'
  ]

  const rows = (data ?? []).map(c => {
    const clients = (c.container_clients as any[]) ?? []
    const clientNames = clients.map((cc: any) => cc.clients?.name).filter(Boolean).join(' | ')
    const type = clients.length > 1 ? 'LCL' : 'FCL'
    return [
      c.container_number,
      c.bl_number,
      c.origin_port,
      c.destination_port,
      c.current_status,
      c.departure_date,
      c.eta_date,
      c.arrival_date,
      clientNames,
      type,
      c.notes,
      c.updated_at,
      c.created_at,
    ]
  })

  const csv = toCSV([headers, ...rows])
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="contenedores-${date}.csv"`,
    },
  })
}
