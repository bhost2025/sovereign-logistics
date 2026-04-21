# Plan 3 — CRUD Contenedores + App Móvil Expo

**Goal:** Operaciones completas sobre contenedores (crear, editar, cambiar estado) y la app móvil Expo con lista y actualización de estado.

**Approach:** Server Actions para mutaciones web (sin API routes extra). Expo con navegación por tabs y stack para detalle/estado.

---

## Mapa de archivos

```
apps/web/app/(app)/
├── contenedores/
│   ├── page.tsx                        # Lista con buscador
│   ├── nuevo/page.tsx                  # Formulario crear
│   ├── [id]/
│   │   ├── page.tsx                    # Detalle (ya existe)
│   │   └── editar/page.tsx             # Formulario editar
│   └── actions.ts                      # Server Actions CRUD
apps/mobile/
├── app/
│   ├── _layout.tsx                     # Root layout (tabs)
│   ├── (tabs)/
│   │   ├── _layout.tsx                 # Tab navigator
│   │   ├── index.tsx                   # Lista contenedores
│   │   └── perfil.tsx                  # Perfil usuario
│   └── contenedor/
│       └── [id]/
│           ├── index.tsx               # Detalle básico
│           └── estado.tsx              # Cambiar estado
├── components/
│   ├── ContainerCard.tsx
│   └── StatusBadge.tsx
└── lib/
    └── supabase.ts                     # (ya existe)
```

---

## Task 1: Server Actions CRUD (Web)

### Step 1.1: `apps/web/app/(app)/contenedores/actions.ts`

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createContainer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('company_id, id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data, error } = await supabase.from('containers').insert({
    company_id:       profile.company_id,
    container_number: (formData.get('container_number') as string).trim().toUpperCase(),
    bl_number:        (formData.get('bl_number') as string)?.trim() || null,
    origin_port:      (formData.get('origin_port') as string).trim(),
    destination_port: (formData.get('destination_port') as string).trim(),
    departure_date:   (formData.get('departure_date') as string) || null,
    eta_date:         (formData.get('eta_date') as string) || null,
    notes:            (formData.get('notes') as string)?.trim() || null,
    created_by:       profile.id,
  }).select('id').single()

  if (error) redirect('/contenedores/nuevo?error=1')

  await supabase.from('container_status_log').insert({
    container_id:    data.id,
    previous_status: null,
    new_status:      'en_puerto_origen',
    changed_by:      profile.id,
    notes:           'Contenedor registrado',
  })

  revalidatePath('/tablero')
  revalidatePath('/contenedores')
  redirect(`/contenedores/${data.id}`)
}

export async function updateContainerStatus(
  containerId: string,
  newStatus: string,
  notes: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('id').eq('id', user.id).single()

  const { data: current } = await supabase
    .from('containers').select('current_status').eq('id', containerId).single()

  await supabase.from('containers')
    .update({ current_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', containerId)

  await supabase.from('container_status_log').insert({
    container_id:    containerId,
    previous_status: current?.current_status ?? null,
    new_status:      newStatus,
    changed_by:      profile?.id ?? null,
    notes:           notes || null,
  })

  revalidatePath(`/contenedores/${containerId}`)
  revalidatePath('/tablero')
  redirect(`/contenedores/${containerId}`)
}
```

---

## Task 2: Lista de contenedores (`/contenedores`)

### Step 2.1: `apps/web/app/(app)/contenedores/page.tsx`

Lista con búsqueda simple, enlace a detalle y botón crear.

---

## Task 3: Formulario crear contenedor (`/contenedores/nuevo`)

### Step 3.1: `apps/web/app/(app)/contenedores/nuevo/page.tsx`

Form con campos: número de contenedor, BL, puerto origen, puerto destino (default Manzanillo), fecha salida, ETA, notas.

---

## Task 4: Cambiar estado desde detalle

### Step 4.1: Agregar `ChangeStatusForm` client component

`apps/web/components/change-status-form.tsx` — select de nuevo estado + notas + submit. Se monta dentro de la página de detalle.

---

## Task 5: App Móvil Expo

### Step 5.1: Instalar navegación

```bash
cd apps/mobile
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

### Step 5.2: Estructura de archivos Expo Router

- `app/_layout.tsx` — root con SessionProvider
- `app/(tabs)/_layout.tsx` — tab bar
- `app/(tabs)/index.tsx` — lista contenedores
- `app/(tabs)/perfil.tsx` — perfil
- `app/contenedor/[id]/index.tsx` — detalle
- `app/contenedor/[id]/estado.tsx` — cambiar estado

---

## Task 6: Build verification + Commit

```bash
cd apps/web && npm run build   # sin errores
cd ../.. && git add . && git commit -m "feat: CRUD contenedores + app móvil Expo"
```
