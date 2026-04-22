import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function GET() {
  const profile = await getUserProfile()
  if (!['super_admin', 'director'].includes(profile.role)) {
    redirect('/tablero')
  }

  const supabase = await createClient()
  const { data: logs } = await (supabase as any)
    .from('system_logs')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (!logs) return new NextResponse('No data', { status: 500 })

  const headers = ['timestamp', 'user', 'action', 'entity_type', 'entity_label', 'changes']
  const csvRows = [
    headers.join(','),
    ...(logs as any[]).map(log => [
      `"${log.created_at}"`,
      `"${log.user_name ?? ''}"`,
      `"${log.action}"`,
      `"${log.entity_type ?? ''}"`,
      `"${log.entity_label ?? ''}"`,
      `"${log.changes ? JSON.stringify(log.changes).replace(/"/g, "'") : ''}"`,
    ].join(',')),
  ]

  const csv = csvRows.join('\n')
  const filename = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
