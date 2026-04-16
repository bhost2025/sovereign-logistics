import { renderToBuffer } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import { getContainersByStatus, getKpiSummary, getContainersProximosEta, getDirectorStats } from '@/lib/containers'
import { ReportDocument } from './document'
import React from 'react'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [containers, kpis, proximos, stats] = await Promise.all([
      getContainersByStatus(),
      getKpiSummary(),
      getContainersProximosEta(30),
      getDirectorStats(),
    ])

    const generatedAt = new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })

    const element = React.createElement(ReportDocument, {
      kpis,
      containers,
      proximos,
      invoiceStats: stats.invoiceStats as any,
      topClients: stats.topClients as any,
      containersByMonth: stats.containersByMonth as any,
      generatedAt,
    })

    const buffer = await renderToBuffer(element as any)
    const filename = `reporte-ejecutivo-${new Date().toISOString().slice(0, 10)}.pdf`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return new NextResponse('Error generando el reporte', { status: 500 })
  }
}
