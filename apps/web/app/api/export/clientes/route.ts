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
    .from('clients')
    .select(`
      name, contact_name, email, phone, is_active, created_at,
      container_clients(count),
      invoices(declared_value, currency)
    `)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const headers = [
    'Empresa', 'Contacto', 'Email', 'Teléfono',
    'Activo', 'Total Contenedores', 'Valor Declarado Total (USD)', 'Registrado'
  ]

  const rows = (data ?? []).map(c => {
    const containerCount = (c.container_clients as any[])?.[0]?.count ?? 0
    const totalValue = ((c.invoices as any[]) ?? [])
      .reduce((sum: number, inv: any) => sum + Number(inv.declared_value ?? 0), 0)
    return [
      c.name,
      c.contact_name,
      c.email,
      c.phone,
      c.is_active ? 'Sí' : 'No',
      containerCount,
      totalValue,
      c.created_at,
    ]
  })

  const csv = toCSV([headers, ...rows])
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clientes-${date}.csv"`,
    },
  })
}
