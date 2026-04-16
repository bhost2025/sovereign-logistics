import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    color: '#181c1e',
    backgroundColor: '#ffffff',
  },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  brandBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 28, height: 28, backgroundColor: '#0a1a3c', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  brandName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0a1a3c' },
  brandSub: { fontSize: 7, color: '#8a9aaa', marginTop: 1 },
  headerRight: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0a1a3c' },
  reportDate: { fontSize: 8, color: '#8a9aaa', marginTop: 2 },
  // Divider
  divider: { height: 1.5, backgroundColor: '#0a1a3c', marginBottom: 20 },
  // KPIs
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: '#f7fafc', borderRadius: 6, padding: 10, alignItems: 'center' },
  kpiValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0a1a3c' },
  kpiLabel: { fontSize: 7, color: '#8a9aaa', marginTop: 2, textTransform: 'uppercase' },
  // Section title
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#8a9aaa', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  // Table
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f2f5', borderRadius: 4, paddingVertical: 5, paddingHorizontal: 6, marginBottom: 2 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  tableRowAlt: { backgroundColor: '#fafbfc' },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#8a9aaa', textTransform: 'uppercase' },
  td: { fontSize: 8, color: '#181c1e' },
  tdGray: { fontSize: 8, color: '#6b7a8a' },
  // Badges
  badgeAlert: { backgroundColor: '#fef4ed', color: '#C05A00', fontSize: 7, fontFamily: 'Helvetica-Bold', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  badgeOk: { backgroundColor: '#e6f4ea', color: '#2D7A4F', fontSize: 7, fontFamily: 'Helvetica-Bold', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  badgeNeutral: { backgroundColor: '#f0f2f5', color: '#556479', fontSize: 7, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  // Two columns layout
  row2: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  col: { flex: 1 },
  // Invoice summary
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, marginTop: 4 },
  // Footer
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#b0bac3' },
})

type Props = {
  kpis: { total: number; activos: number; en_aduana: number; detenidos: number; entregados: number; en_transito: number }
  containers: any[]
  proximos: any[]
  invoiceStats: Record<string, { count: number; total: number }>
  topClients: { name: string; count: number }[]
  containersByMonth: { month: string; label: string; count: number }[]
  generatedAt: string
}

const STATUS_LABEL: Record<string, string> = {
  en_puerto_origen: 'Puerto Origen', zarpo: 'Zarpó', en_transito_maritimo: 'En Tránsito',
  eta_puerto_destino: 'ETA Puerto', en_aduana: 'En Aduana', liberado_aduana: 'Liberado',
  detenido_aduana: 'Detenido', transito_terrestre: 'Tránsito Terrestre', entregado: 'Entregado',
}

export function ReportDocument({ kpis, containers, proximos, invoiceStats, topClients, containersByMonth, generatedAt }: Props) {
  const totalFacturado = Object.values(invoiceStats).reduce((s, v) => s + v.total, 0)
  const detenidos = containers.filter(c => c.current_status === 'detenido_aduana')
  const activos = containers.filter(c => !['entregado', 'en_puerto_origen'].includes(c.current_status))

  return (
    <Document title="Reporte Ejecutivo — Sovereign Logistics">
      <Page size="LETTER" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBox}>
            <View style={styles.logo}><Text style={styles.logoText}>S</Text></View>
            <View>
              <Text style={styles.brandName}>Sovereign Logistics</Text>
              <Text style={styles.brandSub}>CHINA · MÉXICO OPS</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>Reporte Ejecutivo</Text>
            <Text style={styles.reportDate}>{generatedAt}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* KPIs */}
        <Text style={styles.sectionTitle}>Resumen General</Text>
        <View style={styles.kpiRow}>
          {[
            { label: 'Total', value: kpis.total },
            { label: 'En Tránsito', value: kpis.en_transito },
            { label: 'En Aduana', value: kpis.en_aduana },
            { label: 'Detenidos', value: kpis.detenidos },
            { label: 'Entregados', value: kpis.entregados },
          ].map(k => (
            <View key={k.label} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Facturas + Top Clientes */}
        <View style={styles.row2}>
          {/* Facturas */}
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Facturas por Estado</Text>
            {(['pendiente', 'pagada', 'cancelada'] as const).map(s => {
              const stat = invoiceStats[s] ?? { count: 0, total: 0 }
              return (
                <View key={s} style={styles.invoiceRow}>
                  <Text style={styles.td}>{s.charAt(0).toUpperCase() + s.slice(1)} ({stat.count})</Text>
                  <Text style={{ ...styles.td, fontFamily: 'Helvetica-Bold' }}>
                    ${stat.total.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                  </Text>
                </View>
              )
            })}
            <View style={styles.totalRow}>
              <Text style={{ ...styles.td, fontFamily: 'Helvetica-Bold' }}>Total Declarado</Text>
              <Text style={{ ...styles.td, fontFamily: 'Helvetica-Bold', color: '#0a1a3c', fontSize: 10 }}>
                ${totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
              </Text>
            </View>
          </View>

          {/* Top Clientes */}
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Top Clientes</Text>
            {topClients.map((c, i) => (
              <View key={c.name} style={styles.invoiceRow}>
                <Text style={styles.td}>{i + 1}. {c.name}</Text>
                <Text style={styles.tdGray}>{c.count} contenedores</Text>
              </View>
            ))}
            {topClients.length === 0 && <Text style={styles.tdGray}>Sin datos</Text>}
          </View>
        </View>

        {/* Contenedores por Mes */}
        <Text style={styles.sectionTitle}>Volumen de Contenedores — Últimos 6 Meses</Text>
        <View style={{ marginBottom: 20, backgroundColor: '#f7fafc', borderRadius: 6, padding: 12 }}>
          {(() => {
            const maxCount = Math.max(...containersByMonth.map(m => m.count), 1)
            const BAR_MAX_WIDTH = 340
            return (
              <View style={{ gap: 6 }}>
                {containersByMonth.map(m => (
                  <View key={m.month} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ ...styles.th, width: 32, textAlign: 'right' }}>{m.label}</Text>
                    <View style={{ flex: 1, height: 14, backgroundColor: '#e8ebee', borderRadius: 3, overflow: 'hidden' }}>
                      <View
                        style={{
                          width: m.count === 0 ? 2 : (m.count / maxCount) * BAR_MAX_WIDTH,
                          height: 14,
                          backgroundColor: m.count === 0 ? '#e8ebee' : '#4A6FA5',
                          borderRadius: 3,
                        }}
                      />
                    </View>
                    <Text style={{ ...styles.td, width: 18, textAlign: 'right', fontFamily: m.count > 0 ? 'Helvetica-Bold' : 'Helvetica' }}>
                      {m.count}
                    </Text>
                  </View>
                ))}
              </View>
            )
          })()}
        </View>

        {/* Contenedores Activos */}
        <Text style={styles.sectionTitle}>Contenedores Activos ({activos.length})</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.th, flex: 2 }}>Contenedor</Text>
            <Text style={{ ...styles.th, flex: 2 }}>Cliente</Text>
            <Text style={{ ...styles.th, flex: 2 }}>Ruta</Text>
            <Text style={{ ...styles.th, flex: 1 }}>ETA</Text>
            <Text style={{ ...styles.th, flex: 1.5 }}>Estado</Text>
          </View>
          {activos.slice(0, 20).map((c, i) => {
            const client = c.container_clients?.[0]?.clients?.name ?? '—'
            const isDetained = c.current_status === 'detenido_aduana'
            return (
              <View key={c.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={{ ...styles.td, flex: 2, fontFamily: 'Helvetica-Bold' }}>{c.container_number}</Text>
                <Text style={{ ...styles.td, flex: 2 }}>{client}</Text>
                <Text style={{ ...styles.tdGray, flex: 2 }}>{c.origin_port} → {c.destination_port}</Text>
                <Text style={{ ...styles.tdGray, flex: 1 }}>
                  {c.eta_date ? new Date(c.eta_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—'}
                </Text>
                <Text style={{ ...(isDetained ? styles.badgeAlert : styles.badgeNeutral), flex: 1.5 }}>
                  {STATUS_LABEL[c.current_status] ?? c.current_status}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Alertas si hay detenidos */}
        {detenidos.length > 0 && (
          <>
            <Text style={{ ...styles.sectionTitle, color: '#C05A00' }}>▲ Contenedores Detenidos en Aduana</Text>
            <View style={styles.table}>
              {detenidos.map(c => {
                const client = c.container_clients?.[0]?.clients?.name ?? '—'
                return (
                  <View key={c.id} style={{ ...styles.tableRow, backgroundColor: '#fef4ed' }}>
                    <Text style={{ ...styles.td, flex: 2, fontFamily: 'Helvetica-Bold' }}>{c.container_number}</Text>
                    <Text style={{ ...styles.td, flex: 2 }}>{client}</Text>
                    <Text style={{ ...styles.tdGray, flex: 3 }}>{c.origin_port} → {c.destination_port}</Text>
                  </View>
                )
              })}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Sovereign Logistics — Reporte Ejecutivo</Text>
          <Text style={styles.footerText}>{generatedAt} · Confidencial</Text>
        </View>
      </Page>
    </Document>
  )
}
