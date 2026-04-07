'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

type Block = { starts_at: string; ends_at: string }

function isDayBlocked(date: Date, blocks: Block[]) {
  return blocks.some(b => {
    const start = new Date(b.starts_at)
    const end = new Date(b.ends_at)
    const dayStart = new Date(date); dayStart.setHours(0,0,0,0)
    const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999)
    return start <= dayEnd && end >= dayStart
  })
}

export default function CalendarioDisponible({
  doctorId, specialty, availableDays, blocks,
}: {
  doctorId: string; specialty: string
  availableDays: number[]; blocks: Block[]
}) {
  const router = useRouter()
  const today = new Date(); today.setHours(0,0,0,0)
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Máximo 60 días a futuro
  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 60)

  const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoNext = new Date(year, month + 1, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)

  function handleDayClick(day: number) {
    const date = new Date(year, month, day)
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    router.push(`/reservar/${specialty}/${doctorId}/${dateStr}`)
  }

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Completar hasta múltiplo de 7
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="bg-white border border-[#E2E8F0] rounded overflow-hidden">
      {/* Header mes */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          disabled={!canGoPrev}
          className="w-9 h-9 rounded flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹
        </button>
        <p className="font-semibold text-[#0F172A]">{MESES[month]} {year}</p>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          disabled={!canGoNext}
          className="w-9 h-9 rounded flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ›
        </button>
      </div>

      {/* Días de la semana — empieza en lunes */}
      <div className="grid grid-cols-7 border-b border-[#F1F5F9]">
        {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-[#94A3B8]">{d}</div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7 p-2 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />

          const date = new Date(year, month, day)
          const dow = date.getDay() // 0=Dom, 1=Lun...
          const isToday = date.toDateString() === today.toDateString()
          const isPast = date < today
          const isFuture = date > maxDate
          const hasAvailability = availableDays.includes(dow)
          const isBlocked = isDayBlocked(date, blocks)
          const isEnabled = !isPast && !isFuture && hasAvailability && !isBlocked

          return (
            <button
              key={i}
              onClick={() => isEnabled && handleDayClick(day)}
              disabled={!isEnabled}
              className={[
                'h-10 w-full rounded text-sm font-medium transition-all',
                isToday && isEnabled ? 'ring-2 ring-[#0891B2] ring-offset-1' : '',
                isEnabled
                  ? 'bg-[#EFF6FF] text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white cursor-pointer'
                  : 'text-[#CBD5E1] cursor-not-allowed',
              ].join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="px-5 pb-4 flex items-center gap-4 text-xs text-[#94A3B8]">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#EFF6FF]" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#F1F5F9]" />
          <span>Sin turnos</span>
        </div>
      </div>
    </div>
  )
}
