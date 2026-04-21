import { createClient } from '@/lib/supabase/server'

export async function getContainersByStatus() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('containers')
    .select(`
      id, container_number, bl_number, origin_port, destination_port,
      current_status, departure_date, eta_date, arrival_date, updated_at,
      container_clients(
        client_id,
        clients(name)
      )
    `)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getContainerById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('containers')
    .select(`
      *,
      last_updater:last_updated_by(full_name),
      container_clients(
        share_pct,
        clients(id, name, contact_name, email, phone)
      ),
      container_products(
        id, client_id, sku, description, quantity, unit, declared_value, currency, invoice_id
      ),
      container_status_log(
        id, previous_status, new_status, notes, changed_at,
        users(full_name)
      ),
      invoices(
        id, invoice_number, description, declared_value, currency, file_url,
        clients(name)
      )
    `)
    .eq('id', id)
    .order('changed_at', { referencedTable: 'container_status_log', ascending: true })
    .single()

  if (error) throw error
  return data
}

export async function getContainersProximosEta(days = 30) {
  const supabase = await createClient()
  const from = new Date().toISOString().split('T')[0]
  const to   = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('containers')
    .select(`
      id, container_number, origin_port, destination_port, eta_date, current_status,
      container_clients(clients(name))
    `)
    .gte('eta_date', from)
    .lte('eta_date', to)
    .not('current_status', 'in', '("entregado")')
    .order('eta_date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getDirectorStats() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  const [containersRes, invoicesRes, clientsRes] = await Promise.all([
    supabase.from('containers').select('current_status, departure_date, arrival_date'),
    supabase.from('invoices').select('status, declared_value, currency, created_at'),
    supabase.from('clients').select('id, name, container_clients(count)').order('name'),
  ])

  const containers: any[] = containersRes.data ?? []
  const invoices: any[]   = invoicesRes.data ?? []
  const clients: any[]    = clientsRes.data ?? []

  // Resumen de facturas por status
  const invoiceStats = invoices.reduce((acc: any, inv: any) => {
    const status = inv.status ?? 'pendiente'
    if (!acc[status]) acc[status] = { count: 0, total: 0 }
    acc[status].count++
    acc[status].total += Number(inv.declared_value ?? 0)
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  // Top clientes por contenedores
  const topClients = clients
    .map((c: any) => ({ name: c.name, count: c.container_clients?.[0]?.count ?? 0 }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5)

  // Contenedores por mes (últimos 6 meses)
  const byMonth: Record<string, number> = {}
  containers.forEach((c: any) => {
    const date = c.departure_date ?? c.arrival_date
    if (!date) return
    const key = date.slice(0, 7) // YYYY-MM
    byMonth[key] = (byMonth[key] ?? 0) + 1
  })
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return d.toISOString().slice(0, 7)
  })
  const containersByMonth = last6.map(m => ({
    month: m,
    label: new Date(m + '-01').toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
    count: byMonth[m] ?? 0,
  }))

  return { invoiceStats, topClients, containersByMonth }
}

export async function getKpiSummary() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('containers')
    .select('current_status')

  if (error) throw error

  const counts = (data ?? []).reduce((acc, c) => {
    acc[c.current_status] = (acc[c.current_status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const activos = Object.entries(counts)
    .filter(([s]) => !['entregado', 'en_puerto_origen'].includes(s))
    .reduce((sum, [, n]) => sum + n, 0)

  return {
    total: data?.length ?? 0,
    activos,
    detenidos: counts['detenido_aduana'] ?? 0,
    entregados: counts['entregado'] ?? 0,
    en_aduana: (counts['en_aduana'] ?? 0) + (counts['detenido_aduana'] ?? 0),
    en_transito: counts['en_transito_maritimo'] ?? 0,
  }
}
