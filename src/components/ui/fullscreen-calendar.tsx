"use client"

import * as React from "react"
import {
  add,
  sub,
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
  startOfMonth,
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

type View = 'mes' | 'semana' | 'dia'

interface FullScreenCalendarProps {
  data: CalendarDay[]
  onNewEvent?: () => void
  onMonthChange?: (firstDay: Date) => void
  extraControls?: React.ReactNode
  selectedDay?: Date
  onDaySelect?: (day: Date) => void
}

// Monday-first col-start mapping
const colStartClassesMon = [
  "col-start-7", "","col-start-2","col-start-3","col-start-4","col-start-5","col-start-6",
]

const WEEK_DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"]

// ── Small appointment chip used in week/day views ────────────────────────────
function EventChip({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
  const chip = (
    <div
      className={cn(
        "rounded font-bold truncate transition-all hover:brightness-95",
        compact ? "px-2 py-1 text-[10px]" : "px-3 py-2 text-xs",
      )}
      style={{
        background: event.color ? `${event.color}18` : '#eaecef',
        borderLeft: `3px solid ${event.color ?? '#747780'}`,
        color: event.color ?? '#3d4a5c',
      }}
    >
      <span className="opacity-70">{event.time}</span>
      {' '}
      {event.name.split(',')[0]}
    </div>
  )
  return event.href
    ? <Link href={event.href} onClick={e => e.stopPropagation()}>{chip}</Link>
    : chip
}

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

  const [view, setView] = React.useState<View>('mes')

  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy", { locale: es }),
  )
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date(), { locale: es })

  // Sync month when selectedDay changes months (for week/day nav)
  React.useEffect(() => {
    const sm = format(startOfMonth(selectedDay), "MMM-yyyy", { locale: es })
    if (sm !== currentMonth) {
      setCurrentMonth(sm)
      onMonthChange?.(startOfMonth(selectedDay))
    }
  }, [selectedDay.toISOString()])

  // Days for month view
  const monthDays = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth), { weekStartsOn: 1 }),
  })

  // Days for week view
  const weekStart = startOfWeek(selectedDay, { weekStartsOn: 1 })
  const weekDays  = eachDayOfInterval({ start: weekStart, end: add(weekStart, { days: 6 }) })

  const totalEvents = data.reduce((sum, d) => sum + d.events.length, 0)

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goBack() {
    if (view === 'mes') {
      const first = add(firstDayCurrentMonth, { months: -1 })
      setCurrentMonth(format(first, "MMM-yyyy", { locale: es }))
      onMonthChange?.(first)
    } else if (view === 'semana') {
      handleSelectDay(sub(selectedDay, { weeks: 1 }))
    } else {
      handleSelectDay(sub(selectedDay, { days: 1 }))
    }
  }

  function goForward() {
    if (view === 'mes') {
      const first = add(firstDayCurrentMonth, { months: 1 })
      setCurrentMonth(format(first, "MMM-yyyy", { locale: es }))
      onMonthChange?.(first)
    } else if (view === 'semana') {
      handleSelectDay(add(selectedDay, { weeks: 1 }))
    } else {
      handleSelectDay(add(selectedDay, { days: 1 }))
    }
  }

  function handleSelectDay(day: Date) {
    setInternalSelected(day)
    onDaySelect?.(day)
  }

  // ── Header label ────────────────────────────────────────────────────────────
  const headerLabel = (() => {
    if (view === 'mes') {
      return format(firstDayCurrentMonth, "MMMM yyyy", { locale: es })
    }
    if (view === 'semana') {
      const wEnd = add(weekStart, { days: 6 })
      if (isSameMonth(weekStart, wEnd)) {
        return `${format(weekStart, "d", { locale: es })} – ${format(wEnd, "d 'de' MMMM yyyy", { locale: es })}`
      }
      return `${format(weekStart, "d MMM", { locale: es })} – ${format(wEnd, "d MMM yyyy", { locale: es })}`
    }
    return format(selectedDay, "EEEE, d 'de' MMMM yyyy", { locale: es })
  })()

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2
            className="text-3xl font-extrabold tracking-tight capitalize"
            style={{ color: '#00113a', letterSpacing: '-0.02em' }}
          >
            {headerLabel}
          </h2>
          <div className="flex items-center gap-4 text-sm font-medium mt-1" style={{ color: '#3d4a5c' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00113a]" />
              {totalEvents} Turnos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#cce8f0]" />
              {totalEvents > 0 ? `${Math.min(99, Math.round((totalEvents / 200) * 100))}% Capacidad` : 'Sin turnos'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded p-1" style={{ background: '#eaecef' }}>
            {(['mes', 'semana', 'dia'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-4 py-2 text-xs font-bold rounded transition-all capitalize"
                style={view === v
                  ? { background: '#fff', color: '#00113a', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: '#3d4a5c' }
                }
              >
                {v === 'dia' ? 'Día' : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Nav */}
          <button
            onClick={goBack}
            className="p-2 rounded transition-all hover:text-white"
            style={{ background: '#eaecef', color: '#00113a' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00113a'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#eaecef'; e.currentTarget.style.color = '#00113a' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goForward}
            className="p-2 rounded transition-all hover:text-white"
            style={{ background: '#eaecef', color: '#00113a' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00113a'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#eaecef'; e.currentTarget.style.color = '#00113a' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Bento filter row ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="col-span-2 p-4 rounded" style={{ background: '#f2f4f6' }}>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#3d4a5c' }}>
            Médico
          </label>
          {extraControls ?? (
            <span className="text-sm font-semibold" style={{ color: '#00113a' }}>Todos los médicos</span>
          )}
        </div>
        <button
          onClick={() => handleSelectDay(today)}
          className="col-span-1 p-4 rounded text-left transition-all hover:opacity-80"
          style={{ background: '#f2f4f6' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#3d4a5c' }}>Hoy</p>
          <p className="text-sm font-semibold capitalize" style={{ color: '#00113a' }}>
            {format(today, "d MMM", { locale: es })}
          </p>
        </button>
        <button
          onClick={onNewEvent}
          className="col-span-1 rounded font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)', color: '#ffffff' }}
        >
          + Nuevo Turno
        </button>
      </div>

      {/* ── MONTH VIEW ── */}
      {view === 'mes' && (
        <div
          className="flex-1 rounded overflow-hidden flex flex-col"
          style={{ background: '#ffffff', boxShadow: '0px 10px 30px rgba(0,17,58,0.04)' }}
        >
          {/* Week day headers */}
          <div className="grid grid-cols-7" style={{ background: '#f2f4f6', borderBottom: '1px solid rgba(196,198,208,0.1)' }}>
            {WEEK_DAYS.map((d, i) => (
              <div
                key={d}
                className="py-4 text-center text-[11px] font-bold uppercase tracking-widest"
                style={{ color: i === 6 ? 'rgba(186,26,26,0.6)' : '#3d4a5c' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 flex-1">
            {monthDays.map((day, dayIdx) => {
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
                    isTodayDay && "bg-[#00113a]/5",
                    isSelected && !isTodayDay && "bg-[#f2f4f6]",
                    "hover:bg-[#f2f4f6]",
                  )}
                  style={{ borderColor: 'rgba(196,198,208,0.08)' }}
                >
                  <span
                    className={cn(
                      "text-sm",
                      isTodayDay ? "font-black underline underline-offset-4 decoration-2" : isCurrentMonth ? "font-bold" : "font-medium",
                    )}
                    style={{ color: isTodayDay ? '#00113a' : isCurrentMonth ? '#1a1b1f' : '#3d4a5c' }}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-2 space-y-1">
                    {dayData?.events.slice(0, 2).map(event => (
                      <EventChip key={event.id} event={event} compact />
                    ))}
                    {dayData && dayData.events.length > 2 && (
                      <p className="text-[9px] font-bold px-1" style={{ color: '#3d4a5c' }}>
                        + {dayData.events.length - 2} más
                      </p>
                    )}
                  </div>
                  {isTodayDay && (
                    <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#00113a] animate-pulse" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── WEEK VIEW ── */}
      {view === 'semana' && (
        <div
          className="flex-1 rounded overflow-hidden flex flex-col"
          style={{ background: '#ffffff', boxShadow: '0px 10px 30px rgba(0,17,58,0.04)' }}
        >
          {/* Column headers */}
          <div className="grid grid-cols-7" style={{ background: '#f2f4f6', borderBottom: '1px solid rgba(196,198,208,0.1)' }}>
            {weekDays.map((day, i) => {
              const isTodayDay = isToday(day)
              const isSelected = isSameDay(day, selectedDay)
              return (
                <button
                  key={i}
                  onClick={() => handleSelectDay(day)}
                  className="py-4 text-center transition-colors hover:bg-[#eaecef] w-full"
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: i === 6 ? 'rgba(186,26,26,0.6)' : '#3d4a5c' }}
                  >
                    {WEEK_DAYS[i]}
                  </p>
                  <div
                    className="mt-1 w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold"
                    style={
                      isTodayDay
                        ? { background: '#00113a', color: '#fff' }
                        : isSelected
                        ? { background: '#cce8f0', color: '#00113a' }
                        : { color: '#1a1b1f' }
                    }
                  >
                    {format(day, "d")}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Event columns */}
          <div className="grid grid-cols-7 flex-1 overflow-y-auto divide-x" style={{ borderColor: 'rgba(196,198,208,0.08)' }}>
            {weekDays.map((day, i) => {
              const dayData = data.find(d => isSameDay(d.day, day))
              const isTodayDay = isToday(day)
              const isSelected = isSameDay(day, selectedDay)

              return (
                <div
                  key={i}
                  onClick={() => handleSelectDay(day)}
                  className="p-3 space-y-2 cursor-pointer min-h-[200px] transition-colors hover:bg-[#f7f9fb]"
                  style={{
                    background: isTodayDay ? 'rgba(0,17,58,0.03)' : isSelected ? '#f7f9fb' : 'transparent',
                    borderRight: '1px solid rgba(196,198,208,0.08)',
                  }}
                >
                  {!dayData || dayData.events.length === 0 ? (
                    <p className="text-[10px] text-center pt-4" style={{ color: 'rgba(61,74,92,0.3)' }}>—</p>
                  ) : (
                    dayData.events.map(event => (
                      <EventChip key={event.id} event={event} compact />
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── DAY VIEW ── */}
      {view === 'dia' && (
        <div
          className="flex-1 rounded overflow-hidden flex flex-col"
          style={{ background: '#ffffff', boxShadow: '0px 10px 30px rgba(0,17,58,0.04)' }}
        >
          {/* Day header */}
          <div
            className="px-6 py-4 flex items-center gap-4"
            style={{ background: '#f2f4f6', borderBottom: '1px solid rgba(196,198,208,0.1)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black shrink-0"
              style={
                isToday(selectedDay)
                  ? { background: '#00113a', color: '#fff' }
                  : { background: '#eaecef', color: '#00113a' }
              }
            >
              {format(selectedDay, "d")}
            </div>
            <div>
              <p className="font-bold capitalize" style={{ color: '#00113a' }}>
                {format(selectedDay, "EEEE", { locale: es })}
              </p>
              <p className="text-sm capitalize" style={{ color: '#3d4a5c' }}>
                {format(selectedDay, "d 'de' MMMM yyyy", { locale: es })}
              </p>
            </div>
            {isToday(selectedDay) && (
              <span
                className="ml-auto px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: '#cce8f0', color: '#0c6780' }}
              >
                Hoy
              </span>
            )}
          </div>

          {/* Event list */}
          <div className="flex-1 overflow-y-auto p-6">
            {(() => {
              const dayData = data.find(d => isSameDay(d.day, selectedDay))
              if (!dayData || dayData.events.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded flex items-center justify-center text-3xl" style={{ background: '#f2f4f6' }}>
                      📅
                    </div>
                    <p className="font-semibold" style={{ color: '#3d4a5c' }}>Sin turnos para este día</p>
                    <button
                      onClick={onNewEvent}
                      className="mt-2 px-4 py-2 rounded text-xs font-bold transition-all hover:opacity-85"
                      style={{ background: '#00113a', color: '#fff' }}
                    >
                      + Agendar turno
                    </button>
                  </div>
                )
              }

              // Group by hour
              const byHour: Record<number, CalendarEvent[]> = {}
              for (const ev of dayData.events) {
                const h = new Date(ev.datetime).getHours()
                if (!byHour[h]) byHour[h] = []
                byHour[h].push(ev)
              }

              return (
                <div className="space-y-1">
                  {Object.entries(byHour)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([hour, events]) => (
                      <div key={hour} className="flex gap-4 items-start">
                        {/* Time label */}
                        <div className="w-14 pt-3 shrink-0 text-right">
                          <span className="text-xs font-bold" style={{ color: '#3d4a5c' }}>
                            {String(hour).padStart(2,'0')}:00
                          </span>
                        </div>
                        {/* Divider */}
                        <div className="flex flex-col items-center pt-3 shrink-0">
                          <div className="w-2 h-2 rounded-full" style={{ background: '#cce8f0' }} />
                          <div className="w-px flex-1 mt-1" style={{ background: 'rgba(196,198,208,0.3)', minHeight: '2rem' }} />
                        </div>
                        {/* Events */}
                        <div className="flex-1 pb-4 space-y-2 pt-1">
                          {events.map(event => (
                            <EventChip key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
