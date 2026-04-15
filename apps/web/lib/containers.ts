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
      container_clients(
        share_pct,
        clients(id, name, contact_name, email, phone)
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
