import { createClient } from '@/lib/supabase/server'

export async function getClients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select(`
      id, name, contact_name, email, phone, is_active, created_at,
      container_clients(count)
    `)
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getClientById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      container_clients(
        container_id,
        share_pct,
        containers(
          id, container_number, bl_number, origin_port, destination_port,
          current_status, eta_date, arrival_date, created_at
        )
      ),
      invoices(
        id, invoice_number, status, declared_value, currency, created_at,
        containers(container_number),
        invoice_items(id, description, quantity, unit, unit_price, total)
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getClientCargoSnapshot(clientId: string) {
  const supabase = await createClient()

  // All container_clients for this client with full container + products data
  const { data, error } = await (supabase as any)
    .from('container_clients')
    .select(`
      share_pct,
      containers(
        id, container_number, origin_port, destination_port,
        current_status, eta_date, arrival_date, updated_at
      )
    `)
    .eq('client_id', clientId)

  if (error) return { inTransit: [], inCustoms: [], delivered: [], totalValue: 0, containers: [] }

  const rows: any[] = data ?? []
  const all = rows.map((r: any) => r.containers).filter(Boolean)

  const TRANSIT_STATUSES  = ['zarpo', 'en_transito_maritimo', 'eta_puerto_destino', 'en_puerto_origen']
  const CUSTOMS_STATUSES  = ['en_aduana', 'liberado_aduana', 'detenido_aduana', 'transito_terrestre']
  const DELIVERED_STATUS  = 'entregado'

  const inTransit = all.filter((c: any) => TRANSIT_STATUSES.includes(c.current_status))
  const inCustoms = all.filter((c: any) => CUSTOMS_STATUSES.includes(c.current_status))
  const delivered = all.filter((c: any) => c.current_status === DELIVERED_STATUS)

  // Declared value from invoices for this client
  const { data: invData } = await supabase
    .from('invoices')
    .select('declared_value, currency')
    .eq('client_id', clientId)

  const totalValue = (invData ?? []).reduce((sum: number, inv: any) => sum + Number(inv.declared_value ?? 0), 0)

  return { inTransit, inCustoms, delivered, totalValue, all }
}

export async function createClientRecord(formData: {
  name: string
  contact_name?: string
  email?: string
  phone?: string
  company_id: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert(formData)
    .select()
    .single()

  if (error) throw error
  return data
}
