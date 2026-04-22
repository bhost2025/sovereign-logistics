import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth/get-user-role'
import { getTranslations } from 'next-intl/server'
import { RolesEditor } from './roles-editor'

export const dynamic = 'force-dynamic'

export const ROLES = [
  { key: 'director',    color: '#B8860B', bg: '#fdf8ec' },
  { key: 'operator',    color: '#4A6FA5', bg: '#eef2f8' },
  { key: 'operator_cn', color: '#1A7A8A', bg: '#edf6f7' },
  { key: 'super_admin', color: '#0a1a3c', bg: '#f0f2f5' },
]

export const PERMISSION_GROUPS: { group: string; keys: string[] }[] = [
  { group: 'Contenedores', keys: ['view_containers','create_containers','edit_containers','delete_containers'] },
  { group: 'Clientes',     keys: ['view_clients','create_clients','edit_clients','delete_clients'] },
  { group: 'Documentos',   keys: ['upload_documents','approve_documents','delete_documents'] },
  { group: 'Facturas',     keys: ['view_invoices','create_invoices','delete_invoices'] },
  { group: 'Operaciones',  keys: ['create_alerts','resolve_alerts','export_data'] },
  { group: 'Configuración',keys: ['manage_clients','manage_settings','manage_users','manage_roles','manage_ports','manage_agencies','manage_notifications','manage_email'] },
  { group: 'Sistema',      keys: ['view_logs','run_backup','run_cleanup'] },
]

function permKey(db: string): string {
  return db.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
}

export default async function SettingsRolesPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; saved?: string }>
}) {
  const [params, profile, t] = await Promise.all([
    searchParams,
    getUserProfile(),
    getTranslations('settings'),
  ])

  const activeRole = params.role ?? 'director'

  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('role_permissions')
    .select('role, permission, granted')
    .eq('company_id', profile.company_id) as any

  const permMap: Record<string, Record<string, boolean>> = {}
  for (const r of ROLES) permMap[r.key] = {}
  for (const row of rows ?? []) {
    if (!permMap[row.role]) permMap[row.role] = {}
    permMap[row.role][row.permission] = row.granted
  }

  const ROLE_LABELS: Record<string, string> = {
    director:    t('permMatrix.director'),
    operator:    t('permMatrix.operator'),
    operator_cn: t('permMatrix.operatorCn'),
    super_admin: t('permMatrix.admin'),
  }

  const allPermKeys = PERMISSION_GROUPS.flatMap(g => g.keys)
  const permLabels = Object.fromEntries(
    allPermKeys.map(k => [k, t(`permMatrix.${permKey(k)}` as any)])
  )

  return (
    <div className="p-8 max-w-[760px]">
      <div className="mb-8">
        <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight">{t('roles')}</h1>
        <p className="text-[11px] text-[#8a9aaa] mt-0.5">{t('rolesEditSubtitle')}</p>
      </div>

      <RolesEditor
        roles={ROLES}
        activeRole={activeRole}
        permMap={permMap}
        permissionGroups={PERMISSION_GROUPS}
        permLabels={permLabels}
        roleLabels={ROLE_LABELS}
        saved={params.saved === '1'}
        labels={{
          save:      t('save'),
          saving:    t('saving'),
          permSaved: t('permSaved'),
          noteRoles: t('noteRoles'),
          permission: t('permMatrix.permission'),
        }}
      />
    </div>
  )
}
