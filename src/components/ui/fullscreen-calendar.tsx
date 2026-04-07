"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface CalendarEvent {
  id: string | number
  name: string
  time: string
  datetime: string
  href?: string
  color?: string
}

export interface CalendarDay {
  day: Date
  events: CalendarEvent[]
}

interface FullScreenCalendarProps {
  data: CalendarDay[]
  onNewEvent?: () => void
  onMonthChange?: (firstDay: Date) => void
  extraControls?: React.ReactNode
  selectedDay?: Date
  onDaySelect?: (day: Date) => void
}

// Monday-first col-start mapping (getDay: 0=Sun,1=Mon,...,6=Sat)
const colStartClassesMon = [
  "col-start-7", // Sunday  → last col
  "",            // Monday  → first col
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
]

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function FullScreenCalendar({
  data,
  onNewEvent,
  onMonthChange,
  extraControls,
  selectedDay: externalSelected,
  onDaySelect,
}: FullScreenCalendarProps) {
  const today = startOfToday()
  const [internalSelected, setInternalSelected] = React.useState(today)
  const selectedDay = externalSelected ?? internalSelected

  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy", { locale: es }),
  )
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date(), { locale: es })

  // Monday-first week interval
  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth), { weekStartsOn: 1 }),
  })

  const totalEvents = data.reduce((sum, d) => sum + d.events.length, 0)

  function previousMonth() {
    const first = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(first, "MMM-yyyy", { locale: es }))
    onMonthChange?.(first)
  }

  function nextMonth() {
    const first = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(first, "MMM-yyyy", { locale: es }))
    onMonthChange?.(first)
  }

  function handleSelectDay(day: Date) {
    setInternalSelected(day)
    onDaySelect?.(day)
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2
            className="text-3xl font-extrabold tracking-tight capitalize"
            style={{ color: '#002453', letterSpacing: '-0.02em' }}
          >
            {format(firstDayCurrentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex items-center gap-4 text-sm font-medium mt-1" style={{ color: '#44474f' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#002453]" />
              {totalEvents} Turnos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#a3f69c]" />
              {totalEvents > 0 ? `${Math.min(99, Math.round((totalEvents / 200) * 100))}% Capacidad` : 'Sin turnos'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle — visual only */}
          <div className="flex rounded-xl p-1" style={{ background: '#eeedf2' }}>
            {['Mes', 'Semana', 'Día'].map((v, i) => (
              <button
                key={v}
                className="px-4 py-2 text-xs font-bold rounded-lg transition-all"
                style={i === 0
                  ? { background: '#fff', color: '#002453', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#44474f' }
                }
              >
                {v}
              </button>
            ))}
          </div>

          {/* Nav */}
          <button
            onClick={previousMonth}
            className="p-2 rounded-xl transition-all hover:text-white"
            style={{ background: '#eeedf2', color: '#002453' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#002453'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#eeedf2'; e.currentTarget.style.color = '#002453' }}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl transition-all hover:text-white"
            style={{ background: '#eeedf2', color: '#002453' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#002453'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#eeedf2'; e.currentTarget.style.color = '#002453' }}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Bento filter row ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Doctor filter */}
        <div
          className="col-span-2 p-4 rounded-xl transition-all"
          style={{ background: '#f4f3f8' }}
        >
          <label
            className="block text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: '#44474f' }}
          >
            Médico
          </label>
          {extraControls ?? (
            <span className="text-sm font-semibold" style={{ color: '#002453' }}>
              Todos los médicos
            </span>
          )}
        </div>

        {/* Today button */}
        <button
          onClick={() => handleSelectDay(today)}
          className="col-span-1 p-4 rounded-xl text-left transition-all hover:opacity-80"
          style={{ background: '#f4f3f8' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#44474f' }}>
            Hoy
          </p>
          <p className="text-sm font-semibold capitalize" style={{ color: '#002453' }}>
            {format(today, "d MMM", { locale: es })}
          </p>
        </button>

        {/* New appointment */}
        <button
          onClick={onNewEvent}
          className="col-span-1 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #002453 0%, #1e3a6a 100%)', color: '#a3f69c' }}
        >
          + Nuevo Turno
        </button>
      </div>

      {/* ── Calendar grid ── */}
      <div
        className="flex-1 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: '#ffffff',
          boxShadow: '0px 10px 30px rgba(0,26,65,0.06)',
        }}
      >
        {/* Week day headers */}
        <div
          className="grid grid-cols-7"
          style={{ background: '#f4f3f8', borderBottom: '1px solid rgba(196,198,208,0.1)' }}
        >
          {WEEK_DAYS.map((d, i) => (
            <div
              key={d}
              className="py-4 text-center text-[11px] font-bold uppercase tracking-widest"
              style={{ color: i === 6 ? 'rgba(186,26,26,0.6)' : '#44474f' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 flex-1">
          {days.map((day, dayIdx) => {
            const dayData = data.find(d => isSameDay(d.day, day))
            const isSelected = isEqual(day, selectedDay)
            const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth)
            const isTodayDay = isToday(day)

            return (
              <div
                key={dayIdx}
                onClick={() => handleSelectDay(day)}
                className={cn(
                  "min-h-[110px] border-r border-b p-3 relative cursor-pointer transition-colors",
                  dayIdx === 0 && colStartClassesMon[getDay(day)],
                  !isCurrentMonth && "opacity-30",
                  isTodayDay && "bg-[#002453]/5",
                  isSelected && !isTodayDay && "bg-[#f4f3f8]",
                  "hover:bg-[#f4f3f8]",
                )}
                style={{ borderColor: 'rgba(196,198,208,0.08)' }}
              >
                {/* Day number */}
                <span
                  className={cn(
                    "text-sm",
                    isTodayDay
                      ? "font-black underline underline-offset-4 decoration-2"
                      : isCurrentMonth ? "font-bold" : "font-medium",
                  )}
                  style={{
                    color: isTodayDay ? '#002453' : isCurrentMonth ? '#1a1b1f' : '#44474f',
                  }}
                >
                  {format(day, "d")}
                </span>

                {/* Events */}
                <div className="mt-2 space-y-1">
                  {dayData?.events.slice(0, 2).map(event => {
                    const card = (
                      <div
                        key={event.id}
                        className="px-2 py-1 rounded text-[10px] font-bold truncate"
                        style={{
                          background: event.color ? `${event.color}18` : '#eeedf2',
                          borderLeft: `2px solid ${event.color ?? '#747780'}`,
                          color: event.color ?? '#44474f',
                        }}
                      >
                        {event.time} - {event.name.split(',')[0]}
                      </div>
                    )

                    return event.href ? (
                      <Link key={event.id} href={event.href} onClick={e => e.stopPropagation()}>
                        {card}
                      </Link>
                    ) : card
                  })}
                  {dayData && dayData.events.length > 2 && (
                    <p
                      className="text-[9px] font-bold px-1"
                      style={{ color: '#44474f' }}
                    >
                      + {dayData.events.length - 2} más
                    </p>
                  )}
                </div>

                {/* Pulse dot for today */}
                {isTodayDay && (
                  <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#002453] animate-pulse" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
