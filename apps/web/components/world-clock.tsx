'use client'
import { useEffect, useState } from 'react'

function getTime(timeZone: string) {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function getDate(timeZone: string) {
  return new Date().toLocaleDateString('es-MX', {
    timeZone,
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

export function WorldClock() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000) // refresh every 30s
    return () => clearInterval(id)
  }, [])

  const cnTime   = getTime('Asia/Shanghai')
  const cnDate   = getDate('Asia/Shanghai')
  const mxTime   = getTime('America/Mexico_City')
  const mxDate   = getDate('America/Mexico_City')

  return (
    <div className="px-4 pb-4 pt-1 space-y-1.5">
      {[
        { flag: '🇨🇳', label: 'China',   time: cnTime, date: cnDate },
        { flag: '🇲🇽', label: 'México',  time: mxTime, date: mxDate },
      ].map(({ flag, label, time, date }) => (
        <div
          key={label}
          className="flex items-center justify-between bg-[#f7fafc] rounded-lg px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm leading-none">{flag}</span>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#8a9aaa]">{label}</div>
              <div className="text-[9px] text-[#b0bac3] capitalize">{date}</div>
            </div>
          </div>
          <div className="text-sm font-extrabold text-[#0a1a3c] tabular-nums tracking-tight">
            {time}
          </div>
        </div>
      ))}
    </div>
  )
}
