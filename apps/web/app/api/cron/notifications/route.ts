import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { dispatchScheduledNotifications } from '@/lib/notifications'

/**
 * GET /api/cron/notifications
 * Called by Vercel Cron (or any scheduler).
 * Add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/notifications", "schedule": "0 8 * * *" }] }
 *
 * Guard: Authorization: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createAdminClient()

  // Get all active companies
  const { data: companies, error } = await (supabase as any)
    .from('companies')
    .select('id')

  if (error) {
    console.error('[cron/notifications] Failed to load companies:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  const results: { companyId: string; status: string }[] = []

  for (const company of companies ?? []) {
    try {
      await dispatchScheduledNotifications(company.id)
      results.push({ companyId: company.id, status: 'ok' })
    } catch (err) {
      console.error(`[cron/notifications] Failed for company ${company.id}:`, err)
      results.push({ companyId: company.id, status: 'error' })
    }
  }

  return NextResponse.json({
    dispatched: results.length,
    results,
    timestamp: new Date().toISOString(),
  })
}
