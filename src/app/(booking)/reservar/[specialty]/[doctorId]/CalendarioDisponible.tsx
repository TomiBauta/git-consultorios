'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

  const maxDate = new Date(today); maxDate.setDate(today.getDate() + 60)

  const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoNext = new Date(year, month + 1, 1) <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)

  function handleDayClick(day: number) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    router.push(`/reservar/${specialty}/${doctorId}/${dateStr}`)
  }

  // Start week on Monday: 0=Mon, 1=Tue... 6=Sun
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div
      className="rounded overflow-hidden"
      style={{
        background: 'var(--surface-container-lowest, #ffffff)',
        boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
        border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
      }}
    >
      {/* Month header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--outline-variant, rgba(61,74,92,0.10))' }}
      >
        <button
          onClick={() => canGoPrev && setViewDate(new Date(year, month - 1, 1))}
          disabled={!canGoPrev}
          className="w-9 h-9 rounded flex items-center justify-center transition-colors disabled:opacity-25"
          style={{ background: 'var(--surface-container-low, #f2f4f6)', color: 'var(--primary-val, #00113a)' }}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="font-bold text-sm" style={{ color: 'var(--primary-val, #00113a)' }}>
          {MESES[month]} {year}
        </p>
        <button
          onClick={() => canGoNext && setViewDate(new Date(year, month + 1, 1))}
          disabled={!canGoNext}
          className="w-9 h-9 rounded flex items-center justify-center transition-colors disabled:opacity-25"
          style={{ background: 'var(--surface-container-low, #f2f4f6)', color: 'var(--primary-val, #00113a)' }}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div
        className="grid grid-cols-7 border-b"
        style={{ borderColor: 'var(--outline-variant, rgba(61,74,92,0.08))' }}
      >
        {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
          <div
            key={d}
            className="py-3 text-center text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 p-3 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />

          const date = new Date(year, month, day)
          const dow = date.getDay()
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
                'relative h-10 w-full rounded text-sm font-medium transition-all',
                isEnabled
                  ? 'cursor-pointer hover:scale-105'
                  : 'cursor-not-allowed opacity-30',
              ].join(' ')}
              style={
                isEnabled
                  ? isToday
                    ? {
                        background: 'var(--primary-val, #00113a)',
                        color: '#ffffff',
                        boxShadow: '0 0 0 2px rgba(0,17,58,0.3)',
                      }
                    : {
                        background: 'var(--secondary-container-val, #cce8f0)',
                        color: 'var(--secondary-val, #0c6780)',
                      }
                  : {
                      background: 'var(--surface-container-low, #f2f4f6)',
                      color: 'var(--on-surface-variant, #3d4a5c)',
                    }
              }
            >
              {day}
              {/* Availability dot */}
              {isEnabled && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{
                    background: isToday ? '#cce8f0' : 'var(--secondary-val, #0c6780)',
                    opacity: 0.7,
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div
        className="px-6 pb-4 pt-1 flex items-center gap-5 text-xs border-t"
        style={{
          borderColor: 'var(--outline-variant, rgba(61,74,92,0.08))',
          color: 'var(--on-surface-variant, #3d4a5c)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded" style={{ background: 'var(--secondary-container-val, #cce8f0)' }} />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded" style={{ background: 'var(--primary-val, #00113a)' }} />
          <span>Hoy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded opacity-30" style={{ background: 'var(--surface-container-low, #f2f4f6)' }} />
          <span>Sin turnos</span>
        </div>
      </div>
    </div>
  )
}
