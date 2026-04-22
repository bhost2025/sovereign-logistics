import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { writeLog } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const profile = await getUserProfile()
    if (profile.role !== 'super_admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const supabase = await createClient()
    const cid = profile.company_id

    // Fetch all company data in parallel
    const [
      containersRes, clientsRes, usersRes, invoicesRes,
      agenciesRes, portsRes, notifRes, rpRes,
    ] = await Promise.all([
      (supabase as any).from('containers').select('*').eq('company_id', cid),
      (supabase as any).from('clients').select('*').eq('company_id', cid),
      (supabase as any).from('users').select('id,full_name,email,role,is_active,created_at').eq('company_id', cid),
      (supabase as any).from('invoices').select('*'),
      (supabase as any).from('agencies').select('*').eq('company_id', cid),
      (supabase as any).from('ports').select('*').eq('company_id', cid),
      (supabase as any).from('notification_settings').select('*').eq('company_id', cid),
      (supabase as any).from('role_permissions').select('*').eq('company_id', cid),
    ])

    const containers = containersRes.data ?? []
    const clients    = clientsRes.data    ?? []
    const invoices   = invoicesRes.data   ?? []

    const backup = {
      version:      '1.0',
      company_id:   cid,
      generated_at: new Date().toISOString(),
      generated_by: profile.full_name,
      counts: {
        containers: containers.length,
        clients:    clients.length,
        users:      usersRes.data?.length ?? 0,
        invoices:   invoices.length,
        agencies:   agenciesRes.data?.length ?? 0,
        ports:      portsRes.data?.length ?? 0,
      },
      data: {
        containers,
        clients,
        users:                 usersRes.data    ?? [],
        invoices,
        agencies:              agenciesRes.data  ?? [],
        ports:                 portsRes.data     ?? [],
        notification_settings: notifRes.data     ?? [],
        role_permissions:      rpRes.data        ?? [],
      },
    }

    const json = JSON.stringify(backup, null, 2)
    const sizeKb = Math.round(Buffer.byteLength(json, 'utf8') / 1024)

    // Register backup in backups table
    await (supabase as any).from('backups').insert({
      company_id:       cid,
      triggered_by:     profile.id,
      triggered_by_name: profile.full_name,
      status:           'done',
      file_size_kb:     sizeKb,
      entity_counts:    backup.counts,
    })

    await writeLog({
      action:       'backup',
      entity_type:  'system',
      entity_label: `${sizeKb} KB · ${containers.length} containers · ${clients.length} clients`,
    })

    const filename = `backup-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(json, {
      headers: {
        'Content-Type':        'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[backup] Error:', err)
    return new NextResponse('Error generating backup', { status: 500 })
  }
}
