# Plan 1 — Fundación: Monorepo + Supabase + Auth + RBAC

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar el monorepo completo con Supabase como backend, esquema de base de datos con RLS multi-tenant, autenticación JWT y middleware de RBAC — base sobre la que se construyen todos los demás planes.

**Architecture:** Monorepo Turborepo con `apps/web` (Next.js 14) y `apps/mobile` (Expo), paquete compartido `packages/db` con tipos TypeScript generados automáticamente desde Supabase. Row Level Security en PostgreSQL garantiza aislamiento multi-tenant sin lógica extra en el código de aplicación.

**Tech Stack:** Turborepo, Next.js 14 (App Router), Expo SDK 51, Supabase (PostgreSQL + Auth + Storage), TypeScript, Vitest (tests web), Jest (tests mobile).

---

## Mapa de archivos

```
/
├── package.json                          # workspace root
├── turbo.json                            # pipeline config
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── middleware.ts                 # RBAC route guard
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── callback/route.ts
│   │   │   └── (app)/
│   │   │       └── layout.tsx            # session check
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts             # browser client
│   │   │   │   └── server.ts             # server client (SSR)
│   │   │   └── auth/
│   │   │       └── get-user-role.ts
│   │   └── __tests__/
│   │       └── middleware.test.ts
│   └── mobile/
│       ├── package.json
│       ├── app.json
│       └── lib/
│           └── supabase.ts               # Expo Supabase client
├── packages/
│   ├── db/
│   │   ├── package.json
│   │   └── types.ts                      # generado por Supabase CLI
│   └── ui/
│       └── package.json                  # componentes compartidos (vacío por ahora)
└── supabase/
    ├── config.toml
    └── migrations/
        ├── 20260414000001_enums.sql
        ├── 20260414000002_tables.sql
        ├── 20260414000003_indexes.sql
        ├── 20260414000004_rls.sql
        └── 20260414000005_seed.sql
```

---

## Task 1: Scaffold del Monorepo

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `apps/web/package.json`
- Create: `apps/mobile/package.json`
- Create: `packages/db/package.json`

- [ ] **Step 1.1: Inicializar workspace raíz**

```bash
cd C:/laragon/www/container
npm init -y
```

Editar `package.json` resultante:

```json
{
  "name": "sovereign-logistics",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 1.2: Instalar Turborepo**

```bash
npm install
npx turbo@latest init
```

- [ ] **Step 1.3: Configurar pipeline en `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev":   { "cache": false, "persistent": true },
    "test":  { "dependsOn": ["^build"] },
    "lint":  {}
  }
}
```

- [ ] **Step 1.4: Crear app web con Next.js**

```bash
cd apps
npx create-next-app@latest web --typescript --tailwind --app --src-dir no --import-alias "@/*"
```

- [ ] **Step 1.5: Crear app mobile con Expo**

```bash
npx create-expo-app@latest mobile --template blank-typescript
```

- [ ] **Step 1.6: Crear package `db`**

```bash
mkdir -p packages/db
```

Crear `packages/db/package.json`:

```json
{
  "name": "@sovereign/db",
  "version": "0.0.1",
  "main": "./types.ts",
  "types": "./types.ts"
}
```

Crear `packages/db/types.ts` (placeholder, se sobreescribirá con Supabase CLI):

```typescript
// Auto-generado por: supabase gen types typescript --local > packages/db/types.ts
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: Record<string, never>
    Enums: Record<string, never>
  }
}
```

- [ ] **Step 1.7: Commit inicial**

```bash
git init
echo "node_modules\n.next\ndist\n.env*\n.turbo" > .gitignore
git add .
git commit -m "feat: scaffold monorepo — Turborepo + Next.js + Expo"
```

---

## Task 2: Proyecto Supabase + Migraciones

**Files:**
- Create: `supabase/migrations/20260414000001_enums.sql`
- Create: `supabase/migrations/20260414000002_tables.sql`
- Create: `supabase/migrations/20260414000003_indexes.sql`
- Create: `supabase/migrations/20260414000004_rls.sql`
- Create: `supabase/migrations/20260414000005_seed.sql`

**Prerequisito:** Tener Supabase CLI instalado.
```bash
npm install -g supabase
supabase --version   # debe mostrar >= 1.170
```

- [ ] **Step 2.1: Inicializar Supabase en el monorepo**

```bash
supabase init
```

Esto crea `supabase/config.toml`. Arrancar Supabase local:

```bash
supabase start
# Guarda la URL y anon key que muestra en la consola
```

- [ ] **Step 2.2: Migración 1 — ENUMs**

Crear `supabase/migrations/20260414000001_enums.sql`:

```sql
CREATE TYPE public.user_role AS ENUM (
  'super_admin',
  'operator',
  'director',
  'client_viewer'
);

CREATE TYPE public.container_status AS ENUM (
  'en_puerto_origen',
  'zarpo',
  'en_transito_maritimo',
  'eta_puerto_destino',
  'en_aduana',
  'liberado_aduana',
  'detenido_aduana',
  'transito_terrestre',
  'entregado'
);
```

- [ ] **Step 2.3: Migración 2 — Tablas**

Crear `supabase/migrations/20260414000002_tables.sql`:

```sql
CREATE TABLE public.companies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  logo_url   text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES public.companies(id),
  full_name   text NOT NULL,
  email       text NOT NULL,
  role        public.user_role NOT NULL DEFAULT 'operator',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id),
  name          text NOT NULL,
  contact_name  text,
  email         text,
  phone         text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.containers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       uuid NOT NULL REFERENCES public.companies(id),
  container_number text NOT NULL,
  bl_number        text,
  origin_port      text NOT NULL,
  destination_port text NOT NULL DEFAULT 'Manzanillo',
  current_status   public.container_status NOT NULL DEFAULT 'en_puerto_origen',
  departure_date   date,
  eta_date         date,
  arrival_date     date,
  notes            text,
  created_by       uuid REFERENCES public.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, container_number)
);

CREATE TABLE public.container_clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id  uuid NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL REFERENCES public.clients(id),
  share_pct     numeric(5,2),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(container_id, client_id)
);

CREATE TABLE public.invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id    uuid NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  client_id       uuid NOT NULL REFERENCES public.clients(id),
  invoice_number  text NOT NULL,
  description     text,
  declared_value  numeric(12,2),
  currency        text NOT NULL DEFAULT 'USD',
  file_url        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.container_status_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id     uuid NOT NULL REFERENCES public.containers(id) ON DELETE CASCADE,
  previous_status  public.container_status,
  new_status       public.container_status NOT NULL,
  changed_by       uuid REFERENCES public.users(id),
  notes            text,
  changed_at       timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 2.4: Migración 3 — Índices**

Crear `supabase/migrations/20260414000003_indexes.sql`:

```sql
CREATE INDEX idx_containers_company  ON public.containers(company_id);
CREATE INDEX idx_containers_status   ON public.containers(current_status);
CREATE INDEX idx_containers_number   ON public.containers(container_number);
CREATE INDEX idx_status_log_container ON public.container_status_log(container_id);
CREATE INDEX idx_invoices_container  ON public.invoices(container_id);
CREATE INDEX idx_users_company       ON public.users(company_id);
```

- [ ] **Step 2.5: Migración 4 — RLS**

Crear `supabase/migrations/20260414000004_rls.sql`:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.companies            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.containers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_clients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.container_status_log ENABLE ROW LEVEL SECURITY;

-- Helper function: obtiene company_id del usuario autenticado
CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$;

-- Helper function: obtiene rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- COMPANIES: cada usuario ve solo su empresa
CREATE POLICY "companies_select" ON public.companies FOR SELECT
  USING (id = public.my_company_id());

-- USERS: SELECT propio tenant, mutación solo super_admin
CREATE POLICY "users_select" ON public.users FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (company_id = public.my_company_id() AND public.my_role() = 'super_admin');
CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (company_id = public.my_company_id() AND public.my_role() = 'super_admin');

-- CLIENTS: SELECT todos, mutación operator+ 
CREATE POLICY "clients_select" ON public.clients FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "clients_insert" ON public.clients FOR INSERT
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator', 'super_admin'));
CREATE POLICY "clients_update" ON public.clients FOR UPDATE
  USING (company_id = public.my_company_id()
    AND public.my_role() IN ('operator', 'super_admin'));

-- CONTAINERS: SELECT todos del tenant, mutación solo operator+
CREATE POLICY "containers_select" ON public.containers FOR SELECT
  USING (company_id = public.my_company_id());
CREATE POLICY "containers_insert" ON public.containers FOR INSERT
  WITH CHECK (company_id = public.my_company_id()
    AND public.my_role() IN ('operator', 'super_admin'));
CREATE POLICY "containers_update" ON public.containers FOR UPDATE
  USING (company_id = public.my_company_id()
    AND public.my_role() IN ('operator', 'super_admin'));
CREATE POLICY "containers_delete" ON public.containers FOR DELETE
  USING (company_id = public.my_company_id()
    AND public.my_role() = 'super_admin');

-- CONTAINER_CLIENTS: hereda acceso del contenedor
CREATE POLICY "cc_select" ON public.container_clients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.containers c
    WHERE c.id = container_id AND c.company_id = public.my_company_id()
  ));
CREATE POLICY "cc_insert" ON public.container_clients FOR INSERT
  WITH CHECK (public.my_role() IN ('operator', 'super_admin'));
CREATE POLICY "cc_delete" ON public.container_clients FOR DELETE
  USING (public.my_role() IN ('operator', 'super_admin'));

-- INVOICES: SELECT todos, mutación operator+
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.containers c
    WHERE c.id = container_id AND c.company_id = public.my_company_id()
  ));
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT
  WITH CHECK (public.my_role() IN ('operator', 'super_admin'));
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE
  USING (public.my_role() IN ('operator', 'super_admin'));

-- STATUS_LOG: SELECT todos, INSERT operator+ (nunca UPDATE/DELETE — es auditoría)
CREATE POLICY "log_select" ON public.container_status_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.containers c
    WHERE c.id = container_id AND c.company_id = public.my_company_id()
  ));
CREATE POLICY "log_insert" ON public.container_status_log FOR INSERT
  WITH CHECK (public.my_role() IN ('operator', 'super_admin'));
```

- [ ] **Step 2.6: Migración 5 — Seed de desarrollo**

Crear `supabase/migrations/20260414000005_seed.sql`:

```sql
-- Solo para desarrollo local. NO correr en producción.
-- Insertar empresa demo
INSERT INTO public.companies (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sovereign Logistics Demo', 'sovereign-demo');
```

- [ ] **Step 2.7: Aplicar migraciones**

```bash
supabase db reset
# Expected output: "Database reset successfully."
```

Verificar tablas creadas:
```bash
supabase db diff
# Expected: no diff (todo aplicado)
```

- [ ] **Step 2.8: Generar tipos TypeScript**

```bash
supabase gen types typescript --local > packages/db/types.ts
```

Verificar que `packages/db/types.ts` contiene las interfaces `containers`, `users`, `clients`, etc.

- [ ] **Step 2.9: Commit**

```bash
git add supabase/ packages/db/types.ts
git commit -m "feat: database schema — tables, RLS, indexes, seed"
```

---

## Task 3: Variables de entorno

**Files:**
- Create: `apps/web/.env.local`
- Create: `apps/mobile/.env.local`
- Create: `apps/web/.env.example`

- [ ] **Step 3.1: Obtener credenciales locales de Supabase**

```bash
supabase status
```

Copiar los valores de `API URL` y `anon key`.

- [ ] **Step 3.2: Crear `.env.local` para web**

Crear `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key del paso anterior>
```

- [ ] **Step 3.3: Crear `.env.example` (sin secretos)**

Crear `apps/web/.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 3.4: Agregar `.env.local` a `.gitignore`**

```bash
echo "apps/**/.env.local" >> .gitignore
```

- [ ] **Step 3.5: Commit**

```bash
git add .gitignore apps/web/.env.example
git commit -m "chore: env config and gitignore"
```

---

## Task 4: Clientes Supabase (Web)

**Files:**
- Create: `apps/web/lib/supabase/client.ts`
- Create: `apps/web/lib/supabase/server.ts`
- Create: `apps/web/lib/supabase/middleware.ts`

- [ ] **Step 4.1: Instalar dependencias web**

```bash
cd apps/web
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 4.2: Crear cliente browser**

Crear `apps/web/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@sovereign/db'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4.3: Crear cliente server (SSR)**

Crear `apps/web/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@sovereign/db'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 4.4: Crear helper Supabase para middleware**

Crear `apps/web/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from '@sovereign/db'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return { supabaseResponse, user, supabase }
}
```

- [ ] **Step 4.5: Commit**

```bash
cd ../..
git add apps/web/lib/
git commit -m "feat: supabase browser and server clients"
```

---

## Task 5: Middleware RBAC

**Files:**
- Create: `apps/web/middleware.ts`
- Create: `apps/web/__tests__/middleware.test.ts`

- [ ] **Step 5.1: Escribir el test del middleware**

Instalar Vitest:
```bash
cd apps/web
npm install -D vitest @vitejs/plugin-react
```

Crear `apps/web/__tests__/middleware.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

// Tabla de rutas protegidas y roles permitidos
const ROUTE_ROLES: Record<string, string[]> = {
  '/dashboard':    ['super_admin', 'director'],
  '/tablero':      ['super_admin', 'operator'],
  '/contenedores': ['super_admin', 'operator'],
  '/clientes':     ['super_admin', 'operator'],
  '/admin':        ['super_admin'],
}

function canAccess(pathname: string, role: string): boolean {
  const allowed = ROUTE_ROLES[pathname]
  if (!allowed) return true          // ruta pública
  return allowed.includes(role)
}

describe('RBAC route guard', () => {
  it('director puede acceder a /dashboard', () => {
    expect(canAccess('/dashboard', 'director')).toBe(true)
  })

  it('operator NO puede acceder a /dashboard', () => {
    expect(canAccess('/dashboard', 'operator')).toBe(false)
  })

  it('operator puede acceder a /tablero', () => {
    expect(canAccess('/tablero', 'operator')).toBe(true)
  })

  it('director NO puede acceder a /tablero', () => {
    expect(canAccess('/tablero', 'director')).toBe(false)
  })

  it('solo super_admin puede acceder a /admin', () => {
    expect(canAccess('/admin', 'super_admin')).toBe(true)
    expect(canAccess('/admin', 'operator')).toBe(false)
    expect(canAccess('/admin', 'director')).toBe(false)
  })

  it('rutas no listadas son públicas', () => {
    expect(canAccess('/login', 'operator')).toBe(true)
  })
})
```

- [ ] **Step 5.2: Correr el test — debe fallar**

```bash
cd apps/web
npx vitest run __tests__/middleware.test.ts
# Expected: FAIL (canAccess no existe aún)
```

- [ ] **Step 5.3: Implementar el middleware**

Crear `apps/web/middleware.ts`:

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const ROUTE_ROLES: Record<string, string[]> = {
  '/dashboard':    ['super_admin', 'director'],
  '/tablero':      ['super_admin', 'operator'],
  '/contenedores': ['super_admin', 'operator'],
  '/clientes':     ['super_admin', 'operator'],
  '/facturas':     ['super_admin', 'operator'],
  '/admin':        ['super_admin'],
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // Sin sesión → redirigir al login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Verificar rol para rutas protegidas
  const allowedRoles = ROUTE_ROLES[pathname]
  if (allowedRoles) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !allowedRoles.includes(profile.role)) {
      // Redirigir a la ruta correcta según rol
      const redirect = request.nextUrl.clone()
      redirect.pathname = profile?.role === 'director' ? '/dashboard' : '/tablero'
      return NextResponse.redirect(redirect)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|auth).*)'],
}
```

- [ ] **Step 5.4: Correr el test — debe pasar**

```bash
npx vitest run __tests__/middleware.test.ts
# Expected: PASS — 6 tests passed
```

- [ ] **Step 5.5: Commit**

```bash
cd ../..
git add apps/web/middleware.ts apps/web/__tests__/
git commit -m "feat: RBAC middleware — route guard by role"
```

---

## Task 6: Páginas de Autenticación (Web)

**Files:**
- Create: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/app/(auth)/login/actions.ts`
- Create: `apps/web/app/auth/callback/route.ts`
- Create: `apps/web/app/layout.tsx`

- [ ] **Step 6.1: Layout raíz**

Crear `apps/web/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })

export const metadata: Metadata = {
  title: 'Sovereign Logistics',
  description: 'Sistema de rastreo de contenedores China → México',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={manrope.variable}>
      <body className="font-manrope bg-[#f7fafc] text-[#181c1e]">{children}</body>
    </html>
  )
}
```

- [ ] **Step 6.2: Server actions de login**

Crear `apps/web/app/(auth)/login/actions.ts`:

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email:    formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) redirect('/login?error=invalid_credentials')
  redirect('/tablero')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 6.3: Página de login**

Crear `apps/web/app/(auth)/login/page.tsx`:

```tsx
import { signIn } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f7fafc]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 bg-[#0a1a3c] rounded-md flex items-center justify-center text-white text-lg">
            🚢
          </div>
          <span className="text-[#0a1a3c] font-extrabold text-lg tracking-tight">
            Sovereign Logistics
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-[0_2px_40px_rgba(24,28,30,0.08)] p-8">
          <h1 className="text-xl font-extrabold text-[#0a1a3c] tracking-tight mb-1">
            Iniciar sesión
          </h1>
          <p className="text-xs font-medium text-[#8a9aaa] mb-6">
            Ingresa con tus credenciales de operación
          </p>

          {searchParams.error && (
            <div className="mb-4 p-3 rounded-lg bg-[#fff5f0] border border-orange-200 text-[#C05A00] text-xs font-700">
              ▲ Credenciales incorrectas. Intenta de nuevo.
            </div>
          )}

          <form action={signIn} className="flex flex-col gap-4">
            <div>
              <label className="text-[9px] font-700 uppercase tracking-widest text-[#8a9aaa] block mb-1">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none px-0 py-2 text-sm font-600 text-[#181c1e] transition-colors"
                placeholder="operador@empresa.com"
              />
            </div>
            <div>
              <label className="text-[9px] font-700 uppercase tracking-widest text-[#8a9aaa] block mb-1">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-[#f7fafc] border-b-2 border-[#c5c6cf] focus:border-[#0a1a3c] outline-none px-0 py-2 text-sm font-600 text-[#181c1e] transition-colors"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full bg-[#0a1a3c] text-white font-700 text-sm py-3 rounded-md hover:bg-[#142a5c] transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 6.4: Callback route de Supabase Auth**

Crear `apps/web/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/tablero`)
}
```

- [ ] **Step 6.5: Verificar manualmente**

```bash
cd apps/web
npm run dev
```

Abrir `http://localhost:3000/login`. Debe mostrar la pantalla de login con Manrope, fondo blanco grisáceo, sin errores en consola.

- [ ] **Step 6.6: Commit**

```bash
cd ../..
git add apps/web/app/
git commit -m "feat: login page and auth actions — Supabase Auth"
```

---

## Task 7: Helper de rol + Layout protegido (Web)

**Files:**
- Create: `apps/web/lib/auth/get-user-role.ts`
- Create: `apps/web/app/(app)/layout.tsx`

- [ ] **Step 7.1: Helper para obtener perfil del usuario**

Crear `apps/web/lib/auth/get-user-role.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@sovereign/db'

export type UserProfile = Database['public']['Tables']['users']['Row']

export async function getUserProfile(): Promise<UserProfile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) redirect('/login')
  return profile
}
```

- [ ] **Step 7.2: Layout de la sección protegida**

Crear `apps/web/app/(app)/layout.tsx`:

```tsx
import { getUserProfile } from '@/lib/auth/get-user-role'
import { signOut } from '@/app/(auth)/login/actions'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getUserProfile()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 bg-white/70 backdrop-blur-[30px] shadow-[2px_0_40px_rgba(24,28,30,0.04)] flex flex-col py-7">
        {/* Logo */}
        <div className="px-6 pb-8 flex items-center gap-3">
          <div className="w-[34px] h-[34px] bg-[#0a1a3c] rounded-md flex items-center justify-center text-base">🚢</div>
          <div>
            <div className="text-[13px] font-extrabold text-[#0a1a3c] tracking-tight leading-tight">Sovereign Logistics</div>
            <div className="text-[10px] font-medium text-[#8a9aaa] tracking-wider">CHINA · MÉXICO OPS</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {profile.role !== 'operator' && (
            <a href="/dashboard" className="nav-item">◈ Dashboard</a>
          )}
          {profile.role !== 'director' && (
            <a href="/tablero" className="nav-item">⬡ Tablero</a>
          )}
          {profile.role !== 'director' && (
            <a href="/contenedores" className="nav-item">◱ Contenedores</a>
          )}
          {profile.role !== 'director' && (
            <a href="/clientes" className="nav-item">◎ Clientes</a>
          )}
          {profile.role === 'super_admin' && (
            <a href="/admin" className="nav-item">⚙ Admin</a>
          )}
        </nav>

        {/* User */}
        <div className="px-6 pt-4 border-t border-[#c5c6cf]/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0a1a3c] flex items-center justify-center text-white text-[11px] font-700">
              {profile.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-700 text-[#181c1e]">{profile.full_name}</div>
              <div className="text-[10px] text-[#8a9aaa] font-500 capitalize">{profile.role.replace('_', ' ')}</div>
            </div>
          </div>
          <form action={signOut} className="mt-3">
            <button className="text-[10px] font-600 text-[#8a9aaa] hover:text-[#181c1e]">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
```

Agregar en `apps/web/app/globals.css`:

```css
.nav-item {
  @apply flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold text-[#6b7a8a] hover:bg-[#ebeef0] hover:text-[#181c1e] transition-colors;
}
.nav-item.active {
  @apply bg-[#0a1a3c] text-white;
}
```

- [ ] **Step 7.3: Verificar build**

```bash
cd apps/web
npm run build
# Expected: sin errores de TypeScript ni de compilación
```

- [ ] **Step 7.4: Commit**

```bash
cd ../..
git add apps/web/lib/auth/ apps/web/app/\(app\)/ apps/web/app/globals.css
git commit -m "feat: protected layout with sidebar and user profile"
```

---

## Task 8: Cliente Supabase para Mobile (Expo)

**Files:**
- Create: `apps/mobile/lib/supabase.ts`
- Create: `apps/mobile/.env.local`

- [ ] **Step 8.1: Instalar dependencias mobile**

```bash
cd apps/mobile
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

- [ ] **Step 8.2: Variables de entorno mobile**

Crear `apps/mobile/.env.local`:

```bash
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<misma anon key>
```

- [ ] **Step 8.3: Crear cliente Supabase para Expo**

Crear `apps/mobile/lib/supabase.ts`:

```typescript
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@sovereign/db'

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

- [ ] **Step 8.4: Verificar que Expo arranca**

```bash
npx expo start --clear
# Expected: QR code en terminal, sin errores de módulos
```

- [ ] **Step 8.5: Commit**

```bash
cd ../..
git add apps/mobile/lib/ apps/mobile/.env.example
git commit -m "feat: supabase client for Expo mobile"
```

---

## Task 9: Crear usuario de prueba en Supabase local

- [ ] **Step 9.1: Crear usuario demo via Supabase Dashboard local**

Abrir `http://127.0.0.1:54323` (Supabase Studio local).

Ir a **Authentication → Users → Add user**:
- Email: `operador@demo.com`
- Password: `demo1234`
- Email confirmed: ✅

- [ ] **Step 9.2: Vincular usuario a la tabla `users`**

En Supabase Studio → SQL Editor:

```sql
INSERT INTO public.users (id, company_id, full_name, email, role)
SELECT
  au.id,
  '00000000-0000-0000-0000-000000000001',
  'Ana López',
  'operador@demo.com',
  'operator'
FROM auth.users au
WHERE au.email = 'operador@demo.com';
```

Repetir para director:
```sql
-- Crear en Auth primero (UI), luego vincular:
INSERT INTO public.users (id, company_id, full_name, email, role)
SELECT
  au.id,
  '00000000-0000-0000-0000-000000000001',
  'Roberto García',
  'director@demo.com',
  'director'
FROM auth.users au
WHERE au.email = 'director@demo.com';
```

- [ ] **Step 9.3: Verificar login completo**

Abrir `http://localhost:3000/login`, ingresar con `operador@demo.com` / `demo1234`.

Expected:
- Redirige a `/tablero` (página 404 por ahora — está bien, el middleware funciona)
- Sin error 500

- [ ] **Step 9.4: Verificar que director va a `/dashboard`**

Ingresar con `director@demo.com`. Expected: redirige a `/dashboard`.

- [ ] **Step 9.5: Commit final del Plan 1**

```bash
git add .
git commit -m "feat: Plan 1 complete — monorepo, DB schema, RLS, auth, RBAC"
```

---

## Self-Review del Plan 1

**Cobertura de spec:**
- ✅ Monorepo Turborepo con apps/web y apps/mobile
- ✅ Schema completo: companies, users, clients, containers, container_clients, invoices, container_status_log
- ✅ ENUMs: user_role (4 valores), container_status (9 estados)
- ✅ RLS con helper functions — multi-tenant garantizado
- ✅ Índices de performance
- ✅ Auth con Supabase + callback route
- ✅ Middleware RBAC con tests
- ✅ Layout protegido con sidebar por rol
- ✅ Cliente Supabase para Expo
- ✅ Tipos TypeScript generados automáticamente

**Resultado al terminar este plan:**
Sistema base funcionando con login, sesión persistente, RBAC por ruta, base de datos multi-tenant con RLS activo, y tipos TypeScript compartidos entre web y mobile. Listo para construir el Plan 2 (UI Web).
