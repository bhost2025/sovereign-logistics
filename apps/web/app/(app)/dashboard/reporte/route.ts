import { renderToBuffer } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getContainersByStatus, getKpiSummary, getContainersProximosEta, getDirectorStats } from '@/lib/containers'
import { ReportDocument } from './document'
import React from 'react'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const locale = (['es', 'en', 'zh'].includes(cookieStore.get('locale')?.value ?? ''))
      ? cookieStore.get('locale')!.value
      : 'es'

    const jsLocale = locale === 'zh' ? 'zh-CN' : locale === 'en' ? 'en-US' : 'es-MX'

    const [containers, kpis, proximos, stats] = await Promise.all([
      getContainersByStatus(),
      getKpiSummary(),
      getContainersProximosEta(30),
      getDirectorStats(locale),
    ])

    const generatedAt = new Date().toLocaleDateString(jsLocale, {
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
      locale,
    })

    const buffer = await renderToBuffer(element as any)
    const filename = `report-${new Date().toISOString().slice(0, 10)}.pdf`

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return new NextResponse('Error generating report', { status: 500 })
  }
}
