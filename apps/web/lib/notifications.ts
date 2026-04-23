import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'

export type NotificationEvent =
  | 'container_detained'
  | 'missing_docs'
  | 'eta_soon'
  | 'not_updated'

interface NotificationPayload {
  containerId:     string
  containerNumber: string
  status?:         string
  companyId:       string
  daysLeft?:       number
  daysSince?:      number
}

const EVENT_SUBJECT: Record<NotificationEvent, (p: NotificationPayload) => string> = {
  container_detained: (p) => `▲ Contenedor detenido en aduana: ${p.containerNumber}`,
  missing_docs:       (p) => `◱ Documentos faltantes: ${p.containerNumber}`,
  eta_soon:           (p) => `◎ ETA en ${p.daysLeft} días: ${p.containerNumber}`,
  not_updated:        (p) => `◈ Sin actualizar hace ${p.daysSince} días: ${p.containerNumber}`,
}

const EVENT_PUSH_BODY: Record<NotificationEvent, (p: NotificationPayload) => string> = {
  container_detained: (p) => `${p.containerNumber} fue detenido en aduana. Acción requerida.`,
  missing_docs:       (p) => `${p.containerNumber} tiene documentos pendientes de subir.`,
  eta_soon:           (p) => `${p.containerNumber} llega en ${p.daysLeft} días. Verifica los documentos.`,
  not_updated:        (p) => `${p.containerNumber} no ha sido actualizado en ${p.daysSince} días.`,
}

const EVENT_BODY: Record<NotificationEvent, (p: NotificationPayload) => string> = {
  container_detained: (p) => `
    <p>El contenedor <strong>${p.containerNumber}</strong> ha sido marcado como <strong>Detenido en Aduana</strong>.</p>
    <p>Se requiere acción inmediata. Accede al sistema para ver los detalles.</p>
  `,
  missing_docs: (p) => `
    <p>El contenedor <strong>${p.containerNumber}</strong> tiene documentos requeridos pendientes de subir.</p>
  `,
  eta_soon: (p) => `
    <p>El contenedor <strong>${p.containerNumber}</strong> llega en <strong>${p.daysLeft} días</strong>.</p>
    <p>Verifica que todos los documentos estén en orden para el trámite aduanal.</p>
  `,
  not_updated: (p) => `
    <p>El contenedor <strong>${p.containerNumber}</strong> no ha sido actualizado en <strong>${p.daysSince} días</strong>.</p>
    <p>Por favor verifica el estado actual con tu agente.</p>
  `,
}

function buildEmailHtml(event: NotificationEvent, payload: NotificationPayload, fromName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:system-ui,sans-serif;background:#f7fafc;margin:0;padding:32px">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 20px rgba(0,0,0,0.08)">
        <div style="background:#0a1a3c;padding:24px 28px">
          <div style="color:#F1F5F9;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">
            ${fromName}
          </div>
        </div>
        <div style="padding:28px">
          <h2 style="color:#0a1a3c;font-size:16px;margin:0 0 16px">${EVENT_SUBJECT[event](payload)}</h2>
          <div style="color:#556479;font-size:14px;line-height:1.6">
            ${EVENT_BODY[event](payload)}
          </div>
          <div style="margin-top:24px">
            <a
              href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.sovereignlogistics.mx'}/contenedores/${payload.containerId}"
              style="display:inline-block;background:#0a1a3c;color:#fff;font-size:12px;font-weight:700;padding:10px 20px;border-radius:8px;text-decoration:none"
            >
              Ver contenedor →
            </a>
          </div>
        </div>
        <div style="background:#f7fafc;padding:16px 28px;border-top:1px solid #e8ebee">
          <p style="color:#b0bac3;font-size:10px;margin:0">
            Sovereign Logistics · Notificación automática del sistema
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Send Expo push notifications to all device tokens matching the given user IDs.
 * Uses the Expo Push API directly (no SDK needed server-side).
 * Returns the number of pushes successfully queued.
 */
async function dispatchPush(
  event: NotificationEvent,
  payload: NotificationPayload,
  userIds: string[],
): Promise<number> {
  if (userIds.length === 0) return 0

  const admin = createAdminClient()

  // Get all active tokens for these users
  const { data: tokenRows } = await (admin as any)
    .from('device_tokens')
    .select('token')
    .in('user_id', userIds)

  const tokens: string[] = (tokenRows ?? [])
    .map((r: any) => r.token)
    .filter((t: string) => t.startsWith('ExponentPushToken['))

  if (tokens.length === 0) return 0

  const messages = tokens.map(to => ({
    to,
    title: 'Sovereign Logistics',
    body:  EVENT_PUSH_BODY[event](payload),
    data:  { containerId: payload.containerId, event },
    sound: 'default',
  }))

  // Expo Push API accepts up to 100 messages per request
  const CHUNK = 100
  let sent = 0
  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK)
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body:    JSON.stringify(chunk),
    })
    if (res.ok) sent += chunk.length
  }

  return sent
}

/**
 * Write a row to notification_log. Never throws.
 */
async function writeNotificationLog(params: {
  companyId:       string
  event:           NotificationEvent
  containerId:     string
  containerNumber: string
  channels:        string[]
  recipientsCount: number
  status:          'sent' | 'failed' | 'partial'
  error?:          string
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await (admin as any).from('notification_log').insert({
      company_id:       params.companyId,
      event_type:       params.event,
      container_id:     params.containerId,
      container_number: params.containerNumber,
      channels:         params.channels,
      recipients_count: params.recipientsCount,
      status:           params.status,
      error:            params.error ?? null,
    })
  } catch (err) {
    console.error('[notifications] writeNotificationLog failed:', err)
  }
}

/**
 * Dispatch email + push notification for a container event.
 * Reads notification_settings for enabled/push_enabled/notify_roles.
 * Reads email_config for SMTP. Reads device_tokens for push.
 * Writes a row to notification_log after each dispatch.
 * Never throws — failures must not break the main operation.
 */
export async function dispatchNotification(
  event: NotificationEvent,
  payload: NotificationPayload,
): Promise<void> {
  try {
    const supabase = await createClient()
    const { companyId } = payload

    // 1. Check if this event is enabled
    const { data: setting } = await (supabase as any)
      .from('notification_settings')
      .select('enabled, push_enabled, notify_roles, days_threshold')
      .eq('company_id', companyId)
      .eq('event_type', event)
      .single()

    if (!setting?.enabled) return

    const notifyRoles: string[] = setting.notify_roles ?? []
    if (notifyRoles.length === 0) return

    // 2. Load target users (need both emails and IDs)
    const { data: users } = await (supabase as any)
      .from('users')
      .select('id, email')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .in('role', notifyRoles)

    const targetUsers: { id: string; email: string }[] = users ?? []
    if (targetUsers.length === 0) return

    const userIds    = targetUsers.map(u => u.id)
    const emails     = targetUsers.map(u => u.email).filter(Boolean)

    const channels: string[] = []
    let emailSent  = false
    let emailError: string | undefined

    // 3. Email dispatch
    const { data: cfg } = await (supabase as any)
      .from('email_config')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (cfg?.smtp_host && cfg?.smtp_user && cfg?.smtp_pass && cfg?.is_verified && emails.length > 0) {
      try {
        const transporter = nodemailer.createTransport({
          host:   cfg.smtp_host,
          port:   cfg.smtp_port ?? 587,
          secure: cfg.encryption === 'ssl',
          auth:   { user: cfg.smtp_user, pass: cfg.smtp_pass },
          ...(cfg.encryption === 'tls' ? { requireTLS: true } : {}),
        })
        const fromName  = cfg.from_name  ?? 'Sovereign Logistics'
        const fromEmail = cfg.from_email ?? cfg.smtp_user
        await transporter.sendMail({
          from:    `"${fromName}" <${fromEmail}>`,
          to:      emails.join(', '),
          subject: EVENT_SUBJECT[event](payload),
          html:    buildEmailHtml(event, payload, fromName),
        })
        channels.push('email')
        emailSent = true
        console.log(`[notifications] Email sent for ${event} to ${emails.length} recipients`)
      } catch (err: any) {
        emailError = err?.message ?? String(err)
        console.error(`[notifications] Email failed for ${event}:`, err)
      }
    }

    // 4. Push dispatch (if push_enabled)
    let pushCount = 0
    if (setting.push_enabled) {
      try {
        pushCount = await dispatchPush(event, payload, userIds)
        if (pushCount > 0) channels.push('push')
        console.log(`[notifications] Push sent for ${event} to ${pushCount} devices`)
      } catch (err) {
        console.error(`[notifications] Push failed for ${event}:`, err)
      }
    }

    // 5. Log result
    const totalRecipients = (emailSent ? emails.length : 0) + pushCount
    const status = totalRecipients > 0
      ? (emailError ? 'partial' : 'sent')
      : 'failed'

    await writeNotificationLog({
      companyId,
      event,
      containerId:     payload.containerId,
      containerNumber: payload.containerNumber,
      channels,
      recipientsCount: totalRecipients,
      status,
      error: emailError,
    })
  } catch (err) {
    console.error(`[notifications] dispatchNotification failed for ${event}:`, err)
  }
}

/**
 * Check and dispatch eta_soon / not_updated notifications.
 * Intended to be called from a cron job or scheduled task.
 */
export async function dispatchScheduledNotifications(companyId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { data: containers } = await (supabase as any)
      .from('containers')
      .select('id, container_number, eta_date, updated_at, current_status')
      .eq('company_id', companyId)
      .neq('current_status', 'entregado')
      .is('deleted_at', null)

    if (!containers?.length) return

    const { data: etaSetting } = await (supabase as any)
      .from('notification_settings')
      .select('enabled, days_threshold')
      .eq('company_id', companyId)
      .eq('event_type', 'eta_soon')
      .single()

    const { data: staleSetting } = await (supabase as any)
      .from('notification_settings')
      .select('enabled, days_threshold')
      .eq('company_id', companyId)
      .eq('event_type', 'not_updated')
      .single()

    const now = Date.now()

    for (const c of containers) {
      if (etaSetting?.enabled && c.eta_date) {
        const threshold = etaSetting.days_threshold ?? 3
        const daysLeft = Math.ceil((new Date(c.eta_date).getTime() - now) / 86400000)
        if (daysLeft >= 0 && daysLeft <= threshold) {
          await dispatchNotification('eta_soon', {
            containerId:     c.id,
            containerNumber: c.container_number,
            companyId,
            daysLeft,
          })
        }
      }

      if (staleSetting?.enabled && c.updated_at) {
        const threshold = staleSetting.days_threshold ?? 5
        const daysSince = Math.floor((now - new Date(c.updated_at).getTime()) / 86400000)
        if (daysSince >= threshold) {
          await dispatchNotification('not_updated', {
            containerId:     c.id,
            containerNumber: c.container_number,
            companyId,
            daysSince,
          })
        }
      }
    }
  } catch (err) {
    console.error('[notifications] Scheduled dispatch failed:', err)
  }
}
