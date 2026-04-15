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
