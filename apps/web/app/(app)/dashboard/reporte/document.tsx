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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  brandBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 28, height: 28, backgroundColor: '#0a1a3c', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  brandName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0a1a3c' },
  brandSub: { fontSize: 7, color: '#8a9aaa', marginTop: 1 },
  headerRight: { alignItems: 'flex-end' },
  reportTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0a1a3c' },
  reportDate: { fontSize: 8, color: '#8a9aaa', marginTop: 2 },
  divider: { height: 1.5, backgroundColor: '#0a1a3c', marginBottom: 20 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: '#f7fafc', borderRadius: 6, padding: 10, alignItems: 'center' },
  kpiValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0a1a3c' },
  kpiLabel: { fontSize: 7, color: '#8a9aaa', marginTop: 2, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#8a9aaa', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f2f5', borderRadius: 4, paddingVertical: 5, paddingHorizontal: 6, marginBottom: 2 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  tableRowAlt: { backgroundColor: '#fafbfc' },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#8a9aaa', textTransform: 'uppercase' },
  td: { fontSize: 8, color: '#181c1e' },
  tdGray: { fontSize: 8, color: '#6b7a8a' },
  badgeAlert: { backgroundColor: '#fef4ed', color: '#C05A00', fontSize: 7, fontFamily: 'Helvetica-Bold', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  badgeOk: { backgroundColor: '#e6f4ea', color: '#2D7A4F', fontSize: 7, fontFamily: 'Helvetica-Bold', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  badgeNeutral: { backgroundColor: '#f0f2f5', color: '#556479', fontSize: 7, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  row2: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  col: { flex: 1 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f2f5' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, marginTop: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: '#b0bac3' },
})

const STATUS_LABEL: Record<string, Record<string, string>> = {
  es: {
    en_puerto_origen: 'Puerto Origen', zarpo: 'Zarpó', en_transito_maritimo: 'En Tránsito',
    eta_puerto_destino: 'ETA Puerto', en_aduana: 'En Aduana', liberado_aduana: 'Liberado',
    detenido_aduana: 'Detenido', transito_terrestre: 'Tránsito Terrestre', entregado: 'Entregado',
  },
  en: {
    en_puerto_origen: 'Origin Port', zarpo: 'Departed', en_transito_maritimo: 'In Transit',
    eta_puerto_destino: 'ETA Port', en_aduana: 'In Customs', liberado_aduana: 'Cleared',
    detenido_aduana: 'Detained', transito_terrestre: 'Land Transit', entregado: 'Delivered',
  },
  zh: {
    en_puerto_origen: '起运港', zarpo: '已启航', en_transito_maritimo: '海运中',
    eta_puerto_destino: 'ETA目的港', en_aduana: '清关中', liberado_aduana: '已放行',
    detenido_aduana: '被扣押', transito_terrestre: '陆运中', entregado: '已交付',
  },
}

const LABELS: Record<string, Record<string, string>> = {
  es: {
    reportTitle: 'Reporte Ejecutivo',
    summary: 'Resumen General',
    total: 'Total',
    inTransit: 'En Tránsito',
    inCustoms: 'En Aduana',
    detained: 'Detenidos',
    delivered: 'Entregados',
    invoicesByStatus: 'Facturas por Estado',
    totalDeclared: 'Total Declarado',
    topClients: 'Top Clientes',
    noData: 'Sin datos',
    volumeTitle: 'Volumen de Contenedores — Últimos 6 Meses',
    activeContainers: 'Contenedores Activos',
    container: 'Contenedor',
    client: 'Cliente',
    route: 'Ruta',
    eta: 'ETA',
    status: 'Estado',
    detainedTitle: '▲ Contenedores Detenidos en Aduana',
    footer: 'Sovereign Logistics — Reporte Ejecutivo',
    confidential: 'Confidencial',
    containers: 'contenedores',
  },
  en: {
    reportTitle: 'Executive Report',
    summary: 'General Summary',
    total: 'Total',
    inTransit: 'In Transit',
    inCustoms: 'In Customs',
    detained: 'Detained',
    delivered: 'Delivered',
    invoicesByStatus: 'Invoices by Status',
    totalDeclared: 'Total Declared',
    topClients: 'Top Clients',
    noData: 'No data',
    volumeTitle: 'Container Volume — Last 6 Months',
    activeContainers: 'Active Containers',
    container: 'Container',
    client: 'Client',
    route: 'Route',
    eta: 'ETA',
    status: 'Status',
    detainedTitle: '▲ Containers Detained in Customs',
    footer: 'Sovereign Logistics — Executive Report',
    confidential: 'Confidential',
    containers: 'containers',
  },
  zh: {
    reportTitle: '运营报告',
    summary: '总览',
    total: '总计',
    inTransit: '海运中',
    inCustoms: '清关中',
    detained: '被扣押',
    delivered: '已交付',
    invoicesByStatus: '按状态统计发票',
    totalDeclared: '总申报价值',
    topClients: '主要客户',
    noData: '暂无数据',
    volumeTitle: '集装箱量 — 近6个月',
    activeContainers: '在途集装箱',
    container: '集装箱',
    client: '客户',
    route: '路线',
    eta: 'ETA',
    status: '状态',
    detainedTitle: '▲ 被海关扣押的集装箱',
    footer: 'Sovereign Logistics — 运营报告',
    confidential: '机密',
    containers: '个集装箱',
  },
}

type Props = {
  kpis: { total: number; activos: number; en_aduana: number; detenidos: number; entregados: number; en_transito: number }
  containers: any[]
  proximos: any[]
  invoiceStats: Record<string, { count: number; total: number }>
  topClients: { name: string; count: number }[]
  containersByMonth: { month: string; label: string; count: number }[]
  generatedAt: string
  locale?: string
}

export function ReportDocument({ kpis, containers, proximos, invoiceStats, topClients, containersByMonth, generatedAt, locale = 'es' }: Props) {
  const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'
  const L = LABELS[locale] ?? LABELS.es
  const SL = STATUS_LABEL[locale] ?? STATUS_LABEL.es

  const totalFacturado = Object.values(invoiceStats).reduce((s, v) => s + v.total, 0)
  const detenidos = containers.filter(c => c.current_status === 'detenido_aduana')
  const activos = containers.filter(c => !['entregado', 'en_puerto_origen'].includes(c.current_status))

  const INVOICE_STATUS_LABEL: Record<string, Record<string, string>> = {
    es: { pendiente: 'Pendiente', pagada: 'Pagada', cancelada: 'Cancelada' },
    en: { pendiente: 'Pending', pagada: 'Paid', cancelada: 'Cancelled' },
    zh: { pendiente: '待付款', pagada: '已付款', cancelada: '已取消' },
  }
  const ISL = INVOICE_STATUS_LABEL[locale] ?? INVOICE_STATUS_LABEL.es

  return (
    <Document title={`Sovereign Logistics — ${L.reportTitle}`}>
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
            <Text style={styles.reportTitle}>{L.reportTitle}</Text>
            <Text style={styles.reportDate}>{generatedAt}</Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* KPIs */}
        <Text style={styles.sectionTitle}>{L.summary}</Text>
        <View style={styles.kpiRow}>
          {[
            { label: L.total,     value: kpis.total },
            { label: L.inTransit, value: kpis.en_transito },
            { label: L.inCustoms, value: kpis.en_aduana },
            { label: L.detained,  value: kpis.detenidos },
            { label: L.delivered, value: kpis.entregados },
          ].map(k => (
            <View key={k.label} style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Facturas + Top Clientes */}
        <View style={styles.row2}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>{L.invoicesByStatus}</Text>
            {(['pendiente', 'pagada', 'cancelada'] as const).map(s => {
              const stat = invoiceStats[s] ?? { count: 0, total: 0 }
              return (
                <View key={s} style={styles.invoiceRow}>
                  <Text style={styles.td}>{ISL[s]} ({stat.count})</Text>
                  <Text style={{ ...styles.td, fontFamily: 'Helvetica-Bold' }}>
                    ${stat.total.toLocaleString(jsLocale, { minimumFractionDigits: 0 })}
                  </Text>
                </View>
              )
            })}
            <View style={styles.totalRow}>
              <Text style={{ ...styles.td, fontFamily: 'Helvetica-Bold' }}>{L.totalDeclared}</Text>
              <Text style={{ ...styles.td, fontFamily: 'Helvetica-Bold', color: '#0a1a3c', fontSize: 10 }}>
                ${totalFacturado.toLocaleString(jsLocale, { minimumFractionDigits: 0 })}
              </Text>
            </View>
          </View>

          <View style={styles.col}>
            <Text style={styles.sectionTitle}>{L.topClients}</Text>
            {topClients.map((c, i) => (
              <View key={c.name} style={styles.invoiceRow}>
                <Text style={styles.td}>{i + 1}. {c.name}</Text>
                <Text style={styles.tdGray}>{c.count} {L.containers}</Text>
              </View>
            ))}
            {topClients.length === 0 && <Text style={styles.tdGray}>{L.noData}</Text>}
          </View>
        </View>

        {/* Volumen por mes */}
        <Text style={styles.sectionTitle}>{L.volumeTitle}</Text>
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
                      <View style={{ width: m.count === 0 ? 2 : (m.count / maxCount) * BAR_MAX_WIDTH, height: 14, backgroundColor: m.count === 0 ? '#e8ebee' : '#4A6FA5', borderRadius: 3 }} />
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
        <Text style={styles.sectionTitle}>{L.activeContainers} ({activos.length})</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.th, flex: 2 }}>{L.container}</Text>
            <Text style={{ ...styles.th, flex: 2 }}>{L.client}</Text>
            <Text style={{ ...styles.th, flex: 2 }}>{L.route}</Text>
            <Text style={{ ...styles.th, flex: 1 }}>{L.eta}</Text>
            <Text style={{ ...styles.th, flex: 1.5 }}>{L.status}</Text>
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
                  {c.eta_date ? new Date(c.eta_date).toLocaleDateString(jsLocale, { day: '2-digit', month: 'short' }) : '—'}
                </Text>
                <Text style={{ ...(isDetained ? styles.badgeAlert : styles.badgeNeutral), flex: 1.5 }}>
                  {SL[c.current_status] ?? c.current_status}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Alertas */}
        {detenidos.length > 0 && (
          <>
            <Text style={{ ...styles.sectionTitle, color: '#C05A00' }}>{L.detainedTitle}</Text>
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
          <Text style={styles.footerText}>{L.footer}</Text>
          <Text style={styles.footerText}>{generatedAt} · {L.confidential}</Text>
        </View>
      </Page>
    </Document>
  )
}
