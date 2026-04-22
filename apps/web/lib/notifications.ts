import { createClient } from '@/lib/supabase/server'
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
 * Dispatch an email notification for a container event.
 * Reads notification_settings to check if the event is enabled and which roles to notify.
 * Reads email_config for SMTP settings.
 * Reads users with the relevant roles to get their email addresses.
 * Never throws — notification failures must not break the main operation.
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
      .select('enabled, notify_roles, days_threshold')
      .eq('company_id', companyId)
      .eq('event_type', event)
      .single()

    if (!setting?.enabled) return

    const notifyRoles: string[] = setting.notify_roles ?? []
    if (notifyRoles.length === 0) return

    // 2. Get SMTP config
    const { data: cfg } = await (supabase as any)
      .from('email_config')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (!cfg?.smtp_host || !cfg?.smtp_user || !cfg?.smtp_pass || !cfg?.is_verified) {
      // Email not configured or not verified — skip silently
      return
    }

    // 3. Get recipient emails (users with the notified roles)
    const { data: users } = await (supabase as any)
      .from('users')
      .select('email, full_name')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .in('role', notifyRoles)

    const recipients: string[] = (users ?? [])
      .map((u: any) => u.email)
      .filter(Boolean)

    if (recipients.length === 0) return

    // 4. Build and send email
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
      to:      recipients.join(', '),
      subject: EVENT_SUBJECT[event](payload),
      html:    buildEmailHtml(event, payload, fromName),
    })

    console.log(`[notifications] Sent ${event} to ${recipients.length} recipients`)
  } catch (err) {
    // Never throw — email failures must not break container operations
    console.error(`[notifications] Failed to dispatch ${event}:`, err)
  }
}

/**
 * Check and dispatch eta_soon / not_updated notifications.
 * Intended to be called from a cron job or scheduled task.
 */
export async function dispatchScheduledNotifications(companyId: string): Promise<void> {
  try {
    const supabase = await createClient()

    // Fetch active containers
    const { data: containers } = await (supabase as any)
      .from('containers')
      .select('id, container_number, eta_date, updated_at, current_status')
      .eq('company_id', companyId)
      .neq('current_status', 'entregado')
      .is('deleted_at', null)

    if (!containers?.length) return

    // eta_soon setting
    const { data: etaSetting } = await (supabase as any)
      .from('notification_settings')
      .select('enabled, days_threshold')
      .eq('company_id', companyId)
      .eq('event_type', 'eta_soon')
      .single()

    // not_updated setting
    const { data: staleSetting } = await (supabase as any)
      .from('notification_settings')
      .select('enabled, days_threshold')
      .eq('company_id', companyId)
      .eq('event_type', 'not_updated')
      .single()

    const now = Date.now()

    for (const c of containers) {
      // ETA soon
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

      // Not updated
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
