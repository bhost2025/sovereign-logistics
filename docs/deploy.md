# Guía de Despliegue — Sovereign Logistics

## 1. Supabase — Correr Migrations en Producción

Ve a **Supabase Dashboard → SQL Editor → New Query** y ejecuta los archivos en este orden:

```
supabase/migrations/20260414000001_enums.sql
supabase/migrations/20260414000002_tables.sql
supabase/migrations/20260414000003_indexes.sql
supabase/migrations/20260414000004_rls.sql
supabase/migrations/20260415000001_invoice_items.sql
supabase/migrations/20260416000001_user_language.sql
supabase/migrations/20260421000001_container_documents.sql
supabase/migrations/20260421000002_container_products.sql
supabase/migrations/20260421000003_settings_tables.sql
supabase/migrations/20260422000001_sprint4_admin.sql
supabase/migrations/20260422000002_sprint7_push_notifications.sql
```

**NO ejecutar** `20260414000005_seed.sql` en producción (es solo datos demo).

---

## 2. Crear la empresa y el primer administrador

Después de correr las migrations, ejecuta este SQL reemplazando los valores:

```sql
-- 1. Crear la empresa
INSERT INTO public.companies (name, slug)
VALUES ('Nombre Real de la Empresa', 'slug-empresa')   -- slug: solo letras, números y guiones
RETURNING id;
-- Copia el UUID que devuelve, lo necesitas en el paso 3.

-- 2. Crear el usuario en Supabase Auth
-- Ve a: Authentication → Users → Invite User
-- Ingresa el email del primer administrador.
-- El usuario recibirá un correo para establecer su contraseña.
-- Una vez que el usuario confirme, copia su UUID de la columna "User UID".

-- 3. Crear el perfil del usuario (sustituye los UUIDs reales)
INSERT INTO public.users (id, company_id, full_name, email, role)
VALUES (
  'UUID-DEL-USUARIO-AUTH',          -- de Authentication → Users
  'UUID-DE-LA-EMPRESA',             -- del paso 1
  'Nombre Completo',
  'email@empresa.com',
  'super_admin'
);

-- 4. Inicializar permisos para la empresa (ya lo hace el migration, pero por si acaso)
-- La migration 20260422000001 tiene el DO $$ LOOP que seed los permisos para todas las empresas.
-- Si se creó la empresa después de correr la migration, ejecuta esto:
DO $$
DECLARE cid uuid := 'UUID-DE-LA-EMPRESA';
BEGIN
  INSERT INTO public.role_permissions (company_id, role, permission, granted) VALUES
    (cid,'super_admin','view_containers',true),(cid,'super_admin','create_containers',true),
    (cid,'super_admin','edit_containers',true),(cid,'super_admin','delete_containers',true),
    (cid,'super_admin','view_clients',true),(cid,'super_admin','create_clients',true),
    (cid,'super_admin','edit_clients',true),(cid,'super_admin','delete_clients',true),
    (cid,'super_admin','upload_documents',true),(cid,'super_admin','approve_documents',true),
    (cid,'super_admin','delete_documents',true),(cid,'super_admin','view_invoices',true),
    (cid,'super_admin','create_invoices',true),(cid,'super_admin','delete_invoices',true),
    (cid,'super_admin','create_alerts',true),(cid,'super_admin','resolve_alerts',true),
    (cid,'super_admin','export_data',true),(cid,'super_admin','manage_clients',true),
    (cid,'super_admin','manage_settings',true),(cid,'super_admin','manage_users',true),
    (cid,'super_admin','manage_roles',true),(cid,'super_admin','manage_ports',true),
    (cid,'super_admin','manage_agencies',true),(cid,'super_admin','manage_notifications',true),
    (cid,'super_admin','manage_email',true),(cid,'super_admin','view_logs',true),
    (cid,'super_admin','run_backup',true),(cid,'super_admin','run_cleanup',true)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notification_settings (company_id, event_type, enabled, notify_roles, days_threshold) VALUES
    (cid,'container_detained',true,ARRAY['director','super_admin'],NULL),
    (cid,'missing_docs',true,ARRAY['operator','super_admin'],NULL),
    (cid,'eta_soon',true,ARRAY['operator','director','super_admin'],3),
    (cid,'not_updated',true,ARRAY['director','super_admin'],5)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.email_config (company_id) VALUES (cid) ON CONFLICT DO NOTHING;
END $$;
```

---

## 3. Vercel — Variables de Entorno

En **Vercel → Project → Settings → Environment Variables**, agrega:

| Variable | Valor | Entorno |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_...` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://tudominio.com` | Production |
| `CRON_SECRET` | secreto aleatorio (32+ chars) | Production |

**Generar CRON_SECRET:** abre una terminal y ejecuta:
```bash
openssl rand -base64 32
```

Las claves de Supabase están en: **Supabase Dashboard → Project Settings → API**.

---

## 4. Vercel — Configurar Cron Job

El cron ya está declarado en `apps/web/vercel.json`:
```json
{ "path": "/api/cron/notifications", "schedule": "0 8 * * *" }
```
Vercel lo ejecutará automáticamente a las 08:00 UTC cada día.
Para que el cron funcione necesita el plan **Pro** de Vercel (el Hobby no soporta crons).

---

## 5. Storage — Bucket para Documentos

En **Supabase Dashboard → Storage → New Bucket**:
- Nombre: `container-docs`
- Public: **Sí** (los documentos se sirven con URL pública; el acceso se controla en la capa de app)

No se requiere configurar Storage Policies adicionales — la app usa el service role para uploads y URLs públicas para descarga. Si se prefiere bucket privado, cambiar `getPublicUrl` por `createSignedUrl` en `documents/actions.ts`.

---

## 6. App Móvil — Primer Build

```bash
cd apps/mobile

# 1. Instalar dependencias de notificaciones (solo primera vez)
npx expo install expo-notifications expo-device

# 2. Crear cuenta en expo.dev y linkear proyecto
npx eas login
npx eas build:configure   # crea eas.json, anota el projectId

# 3. Actualizar app.json con el projectId de EAS
#    (ver sección "extra.eas.projectId" en app.json)

# 4. Build para prueba interna (APK Android)
npx eas build --platform android --profile preview

# 5. O correr en modo desarrollo
npx expo start
```

El archivo `.env.local` de la app móvil ya tiene las credenciales correctas de Supabase.

---

## 7. Checklist final pre-launch

- [ ] Migrations corridas en producción
- [ ] Empresa y primer admin creados
- [ ] Variables de entorno en Vercel
- [ ] Bucket `documents` creado en Supabase Storage con política
- [ ] Dominio configurado en Vercel
- [ ] CRON_SECRET configurado
- [ ] Email SMTP configurado desde `/settings/email` (dentro de la app)
- [ ] Permisos de roles revisados desde `/settings/roles`
- [ ] Notificaciones configuradas desde `/settings/notifications`
- [ ] App móvil con EAS projectId actualizado
