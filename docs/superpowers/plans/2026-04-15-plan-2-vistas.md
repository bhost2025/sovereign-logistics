# Plan 2 — Vistas: Tablero Kanban + Dashboard Director + Detalle Contenedor

**Goal:** Construir las tres vistas principales de la app web con datos reales de Supabase: el Tablero Kanban del Operador, el Dashboard del Director y la página de detalle de contenedor (la favorita del usuario).

**Approach:** Server Components para fetch de datos + Client Components solo donde haya interactividad. Datos de prueba insertados vía SQL antes de construir las vistas.

---

## Mapa de archivos

```
apps/web/
├── app/(app)/
│   ├── tablero/
│   │   └── page.tsx                    # Kanban 9 columnas (reemplazar placeholder)
│   ├── dashboard/
│   │   └── page.tsx                    # KPIs + tabla + alertas (Director)
│   └── contenedores/
│       ├── page.tsx                    # Lista con buscador
│       └── [id]/
│           └── page.tsx                # Detalle: timeline + LCL + mensajes
├── components/
│   ├── status-badge.tsx                # Badge con barra lateral + símbolo
│   ├── kpi-card.tsx                    # Card KPI con barra superior de color
│   ├── kanban-column.tsx               # Columna del tablero
│   └── container-card.tsx             # Card de contenedor (kanban + lista)
└── lib/
    └── containers.ts                   # Queries Supabase reutilizables
```

---

## Datos de prueba

Antes de construir las vistas se insertan contenedores de prueba en Supabase. Correr en el SQL Editor del dashboard.

---

## Task 1: Datos de prueba + Componentes base

### Step 1.1: Insertar contenedores de prueba

Correr en SQL Editor (`supabase.com/dashboard/project/lrhnrrxojzuebzdcksif/sql/new`):

```sql
-- Clientes demo
INSERT INTO public.clients (id, company_id, name, contact_name, email, phone) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Importadora Garza', 'Luis Garza', 'luis@garza.mx', '+52 81 1234 5678'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Distribuidora Norte', 'María Soto', 'maria@dnorte.mx', '+52 81 8765 4321'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Textiles del Pacífico', 'Roberto Kim', 'rkim@textpac.mx', NULL);

-- Contenedores en distintos estados
INSERT INTO public.containers (id, company_id, container_number, bl_number, origin_port, destination_port, current_status, departure_date, eta_date, created_by) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'MSCU1234567', 'BL-2026-001', 'Shanghai', 'Manzanillo', 'en_transito_maritimo', '2026-03-15', '2026-04-28', (SELECT id FROM public.users WHERE email = 'operador@demo.com')),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'HLCU9876543', 'BL-2026-002', 'Shenzhen', 'Manzanillo', 'en_aduana', '2026-03-20', '2026-04-10', (SELECT id FROM public.users WHERE email = 'operador@demo.com')),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'TCKU5551234', 'BL-2026-003', 'Guangzhou', 'Lázaro Cárdenas', 'detenido_aduana', '2026-03-10', '2026-04-05', (SELECT id FROM public.users WHERE email = 'operador@demo.com')),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'CMAU4447890', 'BL-2026-004', 'Ningbo', 'Manzanillo', 'zarpo', '2026-04-10', '2026-05-15', (SELECT id FROM public.users WHERE email = 'operador@demo.com')),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'OOLU1112233', 'BL-2026-005', 'Tianjin', 'Manzanillo', 'entregado', '2026-02-20', '2026-03-28', (SELECT id FROM public.users WHERE email = 'operador@demo.com')),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'APZU3334455', NULL, 'Shanghai', 'Manzanillo', 'en_puerto_origen', '2026-04-20', '2026-05-25', (SELECT id FROM public.users WHERE email = 'operador@demo.com'));

-- LCL: contenedor 1 tiene 2 clientes
INSERT INTO public.container_clients (container_id, client_id, share_pct) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 60.00),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 40.00);

-- LCL: contenedor 3 tiene 3 clientes
INSERT INTO public.container_clients (container_id, client_id, share_pct) VALUES
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 40.00),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 35.00),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 25.00);

-- Cliente único para el resto
INSERT INTO public.container_clients (container_id, client_id) VALUES
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003');

-- Historial de estados para el contenedor detenido (para timeline en detalle)
INSERT INTO public.container_status_log (container_id, previous_status, new_status, changed_by, notes) VALUES
  ('20000000-0000-0000-0000-000000000003', NULL, 'en_puerto_origen', (SELECT id FROM public.users WHERE email = 'operador@demo.com'), 'Carga recibida en Guangzhou'),
  ('20000000-0000-0000-0000-000000000003', 'en_puerto_origen', 'zarpo', (SELECT id FROM public.users WHERE email = 'operador@demo.com'), 'Zarpó el 10 de marzo'),
  ('20000000-0000-0000-0000-000000000003', 'zarpo', 'en_transito_maritimo', (SELECT id FROM public.users WHERE email = 'operador@demo.com'), 'En ruta al Pacífico'),
  ('20000000-0000-0000-0000-000000000003', 'en_transito_maritimo', 'eta_puerto_destino', (SELECT id FROM public.users WHERE email = 'operador@demo.com'), 'ETA Lázaro Cárdenas confirmado'),
  ('20000000-0000-0000-0000-000000000003', 'eta_puerto_destino', 'en_aduana', (SELECT id FROM public.users WHERE email = 'operador@demo.com'), 'Ingresó a aduana'),
  ('20000000-0000-0000-0000-000000000003', 'en_aduana', 'detenido_aduana', (SELECT id FROM public.users WHERE email = 'operador@demo.com'), 'Documento faltante: factura comercial. SAT solicitó verificación.');
```

### Step 1.2: Componente `status-badge.tsx`

- [ ] Crear `apps/web/components/status-badge.tsx`

```tsx
import type { Database } from '@sovereign/db'

type ContainerStatus = Database['public']['Enums']['container_status']

const STATUS_CONFIG: Record<ContainerStatus, {
  label: string
  symbol: string
  color: string
  bg: string
}> = {
  en_puerto_origen:     { label: 'Puerto Origen',    symbol: '◎', color: '#556479', bg: '#f0f2f5' },
  zarpo:                { label: 'Zarpó',             symbol: '▶', color: '#4A6FA5', bg: '#eef2f8' },
  en_transito_maritimo: { label: 'En Tránsito',       symbol: '◈', color: '#4A6FA5', bg: '#eef2f8' },
  eta_puerto_destino:   { label: 'ETA Puerto',        symbol: '◉', color: '#4A6FA5', bg: '#eef2f8' },
  en_aduana:            { label: 'En Aduana',         symbol: '◆', color: '#B8860B', bg: '#fdf8ec' },
  liberado_aduana:      { label: 'Liberado ✓',        symbol: '✓', color: '#1A7A8A', bg: '#edf6f7' },
  detenido_aduana:      { label: 'Detenido ▲',        symbol: '▲', color: '#C05A00', bg: '#fef4ed' },
  transito_terrestre:   { label: 'T. Terrestre',      symbol: '◱', color: '#7A6A00', bg: '#fdf9e6' },
  entregado:            { label: 'Entregado',         symbol: '✓', color: '#1A7A8A', bg: '#edf6f7' },
}

export function StatusBadge({ status }: { status: ContainerStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 pl-0 pr-2.5 py-0.5 rounded text-[11px] font-bold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span
        className="w-[3px] self-stretch rounded-l"
        style={{ background: cfg.color }}
      />
      {cfg.symbol} {cfg.label}
    </span>
  )
}

export { STATUS_CONFIG }
export type { ContainerStatus }
```

### Step 1.3: Componente `kpi-card.tsx`

- [ ] Crear `apps/web/components/kpi-card.tsx`

```tsx
export function KpiCard({
  label,
  value,
  symbol,
  accentColor,
  sub,
}: {
  label: string
  value: number | string
  symbol: string
  accentColor: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
      <div className="h-[3px]" style={{ background: accentColor }} />
      <div className="p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa] mb-2">
          {symbol} {label}
        </div>
        <div className="text-3xl font-extrabold text-[#0a1a3c] tracking-tight">{value}</div>
        {sub && <div className="text-[10px] text-[#8a9aaa] mt-1">{sub}</div>}
      </div>
    </div>
  )
}
```

### Step 1.4: Query helpers `lib/containers.ts`

- [ ] Crear `apps/web/lib/containers.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

export async function getContainersByStatus() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('containers')
    .select(`
      id, container_number, bl_number, origin_port, destination_port,
      current_status, departure_date, eta_date, arrival_date, updated_at,
      container_clients(
        client_id,
        clients(name)
      )
    `)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getContainerById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('containers')
    .select(`
      *,
      container_clients(
        share_pct,
        clients(id, name, contact_name, email, phone)
      ),
      container_status_log(
        id, previous_status, new_status, notes, changed_at,
        users(full_name)
      ),
      invoices(
        id, invoice_number, description, declared_value, currency, file_url,
        clients(name)
      )
    `)
    .eq('id', id)
    .order('changed_at', { referencedTable: 'container_status_log', ascending: true })
    .single()

  if (error) throw error
  return data
}

export async function getKpiSummary() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('containers')
    .select('current_status')

  if (error) throw error

  const counts = (data ?? []).reduce((acc, c) => {
    acc[c.current_status] = (acc[c.current_status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const activos = Object.entries(counts)
    .filter(([s]) => !['entregado', 'en_puerto_origen'].includes(s))
    .reduce((sum, [, n]) => sum + n, 0)

  return {
    total: data?.length ?? 0,
    activos,
    detenidos: counts['detenido_aduana'] ?? 0,
    entregados: counts['entregado'] ?? 0,
    en_aduana: (counts['en_aduana'] ?? 0) + (counts['detenido_aduana'] ?? 0),
    en_transito: counts['en_transito_maritimo'] ?? 0,
  }
}
```

---

## Task 2: Tablero Kanban (`/tablero`)

- [ ] Reemplazar `apps/web/app/(app)/tablero/page.tsx`

```tsx
import { getContainersByStatus } from '@/lib/containers'
import { StatusBadge, STATUS_CONFIG, type ContainerStatus } from '@/components/status-badge'

const COLUMNS: ContainerStatus[] = [
  'en_puerto_origen', 'zarpo', 'en_transito_maritimo', 'eta_puerto_destino',
  'en_aduana', 'liberado_aduana', 'detenido_aduana', 'transito_terrestre', 'entregado',
]

export default async function TableroPage() {
  const containers = await getContainersByStatus()

  const byStatus = COLUMNS.reduce((acc, s) => {
    acc[s] = containers.filter(c => c.current_status === s)
    return acc
  }, {} as Record<ContainerStatus, typeof containers>)

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <div className="px-8 py-4 flex items-center justify-between border-b border-[#e8ebee] bg-white/60 backdrop-blur-sm">
        <div>
          <h1 className="text-base font-extrabold text-[#0a1a3c] tracking-tight">Tablero Operador</h1>
          <p className="text-[10px] text-[#8a9aaa] font-medium">{containers.length} contenedores activos</p>
        </div>
        <a
          href="/contenedores/nuevo"
          className="bg-[#0a1a3c] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#142a5c] transition-colors"
        >
          + Nuevo Contenedor
        </a>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(status => {
            const cfg = STATUS_CONFIG[status]
            const cards = byStatus[status]
            const isAlert = status === 'detenido_aduana'

            return (
              <div key={status} className="w-[220px] shrink-0 flex flex-col">
                {/* Column header */}
                <div
                  className="rounded-t-lg px-3 py-2 flex items-center justify-between"
                  style={{ background: cfg.bg, borderTop: `3px solid ${cfg.color}` }}
                >
                  <span className="text-[11px] font-bold" style={{ color: cfg.color }}>
                    {cfg.symbol} {cfg.label}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: isAlert && cards.length > 0 ? '#C05A00' : cfg.color + '22',
                      color: isAlert && cards.length > 0 ? 'white' : cfg.color,
                    }}
                  >
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 bg-[#f0f2f5] rounded-b-lg p-2 space-y-2 overflow-y-auto">
                  {cards.map(c => {
                    const clients = c.container_clients ?? []
                    const isLcl = clients.length > 1
                    const clientName = clients[0]?.clients?.name ?? '—'

                    return (
                      <a
                        key={c.id}
                        href={`/contenedores/${c.id}`}
                        className="block bg-white rounded-lg p-3 shadow-[0_1px_8px_rgba(24,28,30,0.07)] hover:shadow-[0_2px_16px_rgba(24,28,30,0.12)] transition-shadow"
                        style={isAlert ? { borderLeft: `3px solid #C05A00` } : {}}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <span className="text-[11px] font-extrabold text-[#0a1a3c] tracking-tight font-mono">
                            {c.container_number}
                          </span>
                          {isLcl && (
                            <span className="text-[9px] font-bold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded">
                              LCL
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#6b7a8a] font-medium truncate">{clientName}{isLcl && ` +${clients.length - 1}`}</div>
                        <div className="text-[10px] text-[#8a9aaa] mt-1">
                          {c.origin_port} → {c.destination_port}
                        </div>
                        {c.eta_date && (
                          <div className="text-[9px] font-bold text-[#8a9aaa] mt-1.5">
                            ETA {new Date(c.eta_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                          </div>
                        )}
                      </a>
                    )
                  })}
                  {cards.length === 0 && (
                    <div className="text-center text-[10px] text-[#b0bac3] py-4">Sin contenedores</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

---

## Task 3: Dashboard Director (`/dashboard`)

- [ ] Crear `apps/web/app/(app)/dashboard/page.tsx`

```tsx
import { getContainersByStatus, getKpiSummary } from '@/lib/containers'
import { KpiCard } from '@/components/kpi-card'
import { StatusBadge, STATUS_CONFIG } from '@/components/status-badge'

export default async function DashboardPage() {
  const [containers, kpis] = await Promise.all([
    getContainersByStatus(),
    getKpiSummary(),
  ])

  const activos = containers.filter(c =>
    !['entregado', 'en_puerto_origen'].includes(c.current_status)
  )
  const detenidos = containers.filter(c => c.current_status === 'detenido_aduana')

  return (
    <div className="p-8 max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#0a1a3c] tracking-tight">Dashboard</h1>
        <p className="text-xs text-[#8a9aaa] mt-0.5">Vista ejecutiva · Solo lectura</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Activos" value={kpis.activos} symbol="◈" accentColor="#4A6FA5" />
        <KpiCard label="En Aduana" value={kpis.en_aduana} symbol="◆" accentColor="#B8860B" />
        <KpiCard label="Detenidos" value={kpis.detenidos} symbol="▲" accentColor="#C05A00" />
        <KpiCard label="Entregados" value={kpis.entregados} symbol="✓" accentColor="#1A7A8A" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla contenedores activos */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f2f5]">
            <h2 className="text-sm font-extrabold text-[#0a1a3c]">Contenedores Activos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#f0f2f5]">
                  {['Contenedor', 'Cliente', 'Ruta', 'ETA', 'Estado'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8a9aaa]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activos.map(c => {
                  const client = c.container_clients?.[0]?.clients?.name ?? '—'
                  const isLcl = (c.container_clients?.length ?? 0) > 1
                  return (
                    <tr key={c.id} className="border-b border-[#f7fafc] hover:bg-[#f7fafc] transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-[#0a1a3c]">{c.container_number}</td>
                      <td className="px-5 py-3 text-[#181c1e]">
                        {client}{isLcl && <span className="ml-1.5 text-[9px] bg-sky-100 text-sky-700 font-bold px-1 py-0.5 rounded">LCL</span>}
                      </td>
                      <td className="px-5 py-3 text-[#6b7a8a]">{c.origin_port} → {c.destination_port}</td>
                      <td className="px-5 py-3 text-[#6b7a8a]">
                        {c.eta_date ? new Date(c.eta_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={c.current_status} />
                      </td>
                    </tr>
                  )
                })}
                {activos.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-[#b0bac3]">Sin contenedores activos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel alertas */}
        <div className="bg-white rounded-xl shadow-[0_1px_20px_rgba(24,28,30,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f2f5] flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#0a1a3c]">▲ Alertas</h2>
            {detenidos.length > 0 && (
              <span className="text-[10px] font-bold bg-[#fef4ed] text-[#C05A00] px-2 py-0.5 rounded">
                {detenidos.length} detenido{detenidos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="p-4 space-y-3">
            {detenidos.map(c => (
              <a key={c.id} href={`/contenedores/${c.id}`}
                className="block p-3 rounded-lg bg-[#fef4ed] border-l-[3px] border-[#C05A00] hover:bg-[#fdeee3] transition-colors">
                <div className="font-mono font-bold text-[11px] text-[#0a1a3c]">{c.container_number}</div>
                <div className="text-[10px] text-[#C05A00] font-semibold mt-0.5">Detenido en aduana</div>
                <div className="text-[10px] text-[#8a9aaa] mt-0.5">{c.origin_port} → {c.destination_port}</div>
              </a>
            ))}
            {detenidos.length === 0 && (
              <p className="text-center text-[11px] text-[#b0bac3] py-6">✓ Sin alertas activas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 4: Detalle de Contenedor (`/contenedores/[id]`)

- [ ] Crear `apps/web/app/(app)/contenedores/[id]/page.tsx`

Timeline vertical + inventario LCL + log de estados.

---

## Task 5: Verificación visual

- [ ] `npm run dev` → abrir `/tablero`, `/dashboard`, `/contenedores/[id]` con usuario demo
- [ ] Confirmar que el Kanban muestra las 9 columnas con los contenedores insertados
- [ ] Confirmar que los KPIs reflejan los datos correctos
- [ ] Build sin errores: `npm run build`

---

## Task 6: Commit

```bash
git add apps/web/components/ apps/web/lib/containers.ts apps/web/app/\(app\)/
git commit -m "feat: tablero kanban, dashboard director y detalle contenedor"
```
