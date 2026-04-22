import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'

export type AuditAction =
  | 'create' | 'update' | 'delete' | 'restore'
  | 'login'  | 'logout'
  | 'export' | 'backup' | 'cleanup'
  | 'permission_change' | 'test_email'

export type AuditEntityType =
  | 'container' | 'client' | 'user' | 'invoice' | 'document'
  | 'agency'    | 'port'   | 'role_permission' | 'email_config' | 'system'

interface WriteLogParams {
  action:        AuditAction
  entity_type?:  AuditEntityType
  entity_id?:    string
  entity_label?: string
  changes?:      Record<string, { before: unknown; after: unknown }>
}

export async function writeLog(params: WriteLogParams): Promise<void> {
  try {
    const [supabase, profile] = await Promise.all([
      createClient(),
      getUserProfile(),
    ])

    await supabase.from('system_logs').insert({
      company_id:   profile.company_id,
      user_id:      profile.id,
      user_name:    profile.full_name,
      action:       params.action,
      entity_type:  params.entity_type ?? null,
      entity_id:    params.entity_id   ?? null,
      entity_label: params.entity_label ?? null,
      changes:      params.changes      ?? null,
    } as any)
  } catch {
    // Audit logging must never crash the main operation
    console.error('[audit] writeLog failed — continuing without log')
  }
}

/**
 * Computes a diff between two objects, returning only changed fields.
 * Used to populate the `changes` param in writeLog.
 */
export function diffObjects(
  before: Record<string, unknown>,
  after:  Record<string, unknown>,
  ignore: string[] = ['updated_at', 'created_at', 'last_updated_by'],
): Record<string, { before: unknown; after: unknown }> {
  const result: Record<string, { before: unknown; after: unknown }> = {}

  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const key of keys) {
    if (ignore.includes(key)) continue
    if (before[key] !== after[key]) {
      result[key] = { before: before[key], after: after[key] }
    }
  }

  return result
}
