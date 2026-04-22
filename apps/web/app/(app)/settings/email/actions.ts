'use server'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { writeLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import nodemailer from 'nodemailer'

export async function saveEmailConfig(formData: FormData) {
  const profile = await getUserProfile()
  if (profile.role !== 'super_admin') redirect('/403')

  const smtp_host   = (formData.get('smtp_host')   as string)?.trim() || null
  const smtp_port   = parseInt(formData.get('smtp_port') as string, 10) || 587
  const smtp_user   = (formData.get('smtp_user')   as string)?.trim() || null
  const smtp_pass   = (formData.get('smtp_pass')   as string)?.trim() || null
  const encryption  = (formData.get('encryption')  as string) || 'tls'
  const from_name   = (formData.get('from_name')   as string)?.trim() || null
  const from_email  = (formData.get('from_email')  as string)?.trim() || null

  const supabase = await createClient()

  const update: Record<string, unknown> = {
    smtp_host, smtp_port, smtp_user, encryption,
    from_name, from_email, is_verified: false,
    updated_at: new Date().toISOString(),
  }
  // Only update password if a new one was provided
  if (smtp_pass) update.smtp_pass = smtp_pass

  await (supabase as any)
    .from('email_config')
    .upsert({ ...update, company_id: profile.company_id }, { onConflict: 'company_id' })

  await writeLog({
    action:       'update',
    entity_type:  'email_config',
    entity_label: smtp_host ?? 'SMTP config',
  })

  revalidatePath('/settings/email')
}

export async function sendTestEmail(): Promise<{ ok: boolean; message: string }> {
  const profile = await getUserProfile()
  if (profile.role !== 'super_admin') return { ok: false, message: 'Forbidden' }

  const supabase = await createClient()
  const { data: cfg } = await (supabase as any)
    .from('email_config')
    .select('*')
    .eq('company_id', profile.company_id)
    .single()

  if (!cfg?.smtp_host || !cfg?.smtp_user || !cfg?.smtp_pass) {
    return { ok: false, message: 'SMTP not configured. Fill in all fields first.' }
  }

  try {
    const transporter = nodemailer.createTransport({
      host:   cfg.smtp_host,
      port:   cfg.smtp_port,
      secure: cfg.encryption === 'ssl',
      auth:   { user: cfg.smtp_user, pass: cfg.smtp_pass },
      ...(cfg.encryption === 'tls' ? { requireTLS: true } : {}),
    })

    await transporter.verify()

    await transporter.sendMail({
      from:    `"${cfg.from_name ?? 'Sovereign Logistics'}" <${cfg.from_email ?? cfg.smtp_user}>`,
      to:      profile.email,
      subject: '✓ Test email — Sovereign Logistics',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#0a1a3c;margin-bottom:8px">✓ Email configuration works</h2>
          <p style="color:#556479;font-size:14px">
            This is a test email from your Sovereign Logistics system.<br/>
            SMTP server: <strong>${cfg.smtp_host}:${cfg.smtp_port}</strong>
          </p>
        </div>
      `,
    })

    // Mark as verified
    await (supabase as any)
      .from('email_config')
      .update({ is_verified: true, last_test_at: new Date().toISOString() })
      .eq('company_id', profile.company_id)

    await writeLog({ action: 'test_email', entity_type: 'email_config', entity_label: cfg.smtp_host })

    revalidatePath('/settings/email')
    return { ok: true, message: profile.email }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, message }
  }
}
