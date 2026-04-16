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
