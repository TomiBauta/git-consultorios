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
import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"

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
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export function FullScreenCalendar({
  data,
  onNewEvent,
  onMonthChange,
  extraControls,
}: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy", { locale: es }),
  )
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date(), { locale: es })
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const first = add(firstDayCurrentMonth, { months: -1 })
    const next = format(first, "MMM-yyyy", { locale: es })
    setCurrentMonth(next)
    onMonthChange?.(first)
  }

  function nextMonth() {
    const first = add(firstDayCurrentMonth, { months: 1 })
    const next = format(first, "MMM-yyyy", { locale: es })
    setCurrentMonth(next)
    onMonthChange?.(first)
  }

  function goToToday() {
    const first = parse(format(today, "MMM-yyyy", { locale: es }), "MMM-yyyy", new Date(), { locale: es })
    setCurrentMonth(format(today, "MMM-yyyy", { locale: es }))
    onMonthChange?.(first)
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            {/* Today badge */}
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
              <h1 className="p-1 text-xs uppercase text-muted-foreground">
                {format(today, "MMM", { locale: es })}
              </h1>
              <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
                <span>{format(today, "d")}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold capitalize text-foreground">
                {format(firstDayCurrentMonth, "MMMM yyyy", { locale: es })}
              </h2>
              <p className="text-sm text-muted-foreground capitalize">
                {format(firstDayCurrentMonth, "d MMM", { locale: es })} –{" "}
                {format(endOfMonth(firstDayCurrentMonth), "d MMM yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          {/* Doctor filter slot */}
          {extraControls && (
            <>
              {extraControls}
              <Separator orientation="vertical" className="hidden h-6 md:block" />
            </>
          )}

          {/* Month nav */}
          <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
            <Button
              onClick={previousMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Mes anterior"
            >
              <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              onClick={goToToday}
              className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto"
              variant="outline"
            >
              Hoy
            </Button>
            <Button
              onClick={nextMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Mes siguiente"
            >
              <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <Separator orientation="horizontal" className="block w-full md:hidden" />

          <Button onClick={onNewEvent} className="w-full gap-2 md:w-auto">
            <PlusCircleIcon size={16} strokeWidth={2} aria-hidden="true" />
            <span>Nuevo turno</span>
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border text-center text-xs font-semibold leading-6 lg:flex-none">
          {WEEK_DAYS.map((d, i) => (
            <div key={d} className={cn("py-2.5", i < 6 ? "border-r" : "")}>
              {d}
            </div>
          ))}
        </div>

        <div className="flex text-xs leading-6 lg:flex-auto">
          {/* Desktop grid */}
          <div className="hidden w-full border-x lg:grid lg:grid-cols-7 lg:grid-rows-5">
            {days.map((day, dayIdx) =>
              !isDesktop ? (
                <MobileDay
                  key={dayIdx}
                  day={day}
                  dayIdx={dayIdx}
                  selectedDay={selectedDay}
                  firstDayCurrentMonth={firstDayCurrentMonth}
                  data={data}
                  onSelect={setSelectedDay}
                />
              ) : (
                <DesktopDay
                  key={dayIdx}
                  day={day}
                  dayIdx={dayIdx}
                  selectedDay={selectedDay}
                  firstDayCurrentMonth={firstDayCurrentMonth}
                  data={data}
                  onSelect={setSelectedDay}
                />
              ),
            )}
          </div>

          {/* Mobile grid */}
          <div className="isolate grid w-full grid-cols-7 grid-rows-5 border-x lg:hidden">
            {days.map((day, dayIdx) => (
              <MobileDay
                key={dayIdx}
                day={day}
                dayIdx={dayIdx}
                selectedDay={selectedDay}
                firstDayCurrentMonth={firstDayCurrentMonth}
                data={data}
                onSelect={setSelectedDay}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- sub-components ---------- */

interface DayProps {
  day: Date
  dayIdx: number
  selectedDay: Date
  firstDayCurrentMonth: Date
  data: CalendarDay[]
  onSelect: (d: Date) => void
}

function MobileDay({ day, dayIdx, selectedDay, firstDayCurrentMonth, data, onSelect }: DayProps) {
  return (
    <button
      onClick={() => onSelect(day)}
      type="button"
      className={cn(
        isEqual(day, selectedDay) && "text-primary-foreground",
        !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && "text-foreground",
        !isEqual(day, selectedDay) && !isToday(day) && !isSameMonth(day, firstDayCurrentMonth) && "text-muted-foreground",
        (isEqual(day, selectedDay) || isToday(day)) && "font-semibold",
        "flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10",
      )}
    >
      <time
        dateTime={format(day, "yyyy-MM-dd")}
        className={cn(
          "ml-auto flex size-6 items-center justify-center rounded-full",
          isEqual(day, selectedDay) && "bg-primary text-primary-foreground",
        )}
      >
        {format(day, "d")}
      </time>
      {data.filter(d => isSameDay(d.day, day)).length > 0 && (
        <div className="-mx-0.5 mt-auto flex flex-wrap-reverse">
          {data
            .filter(d => isSameDay(d.day, day))
            .flatMap(d => d.events)
            .slice(0, 3)
            .map((event, i) => (
              <span key={i} className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            ))}
        </div>
      )}
    </button>
  )
}

function DesktopDay({ day, dayIdx, selectedDay, firstDayCurrentMonth, data, onSelect }: DayProps) {
  const dayData = data.find(d => isSameDay(d.day, day))

  return (
    <div
      onClick={() => onSelect(day)}
      className={cn(
        dayIdx === 0 && colStartClasses[getDay(day)],
        !isEqual(day, selectedDay) && !isToday(day) && !isSameMonth(day, firstDayCurrentMonth) && "bg-accent/50 text-muted-foreground",
        "relative flex flex-col border-b border-r",
        !isEqual(day, selectedDay) && "hover:bg-accent/75 cursor-pointer",
      )}
    >
      <header className="flex items-center justify-between p-2.5">
        <button
          type="button"
          className={cn(
            isEqual(day, selectedDay) && "text-primary-foreground",
            !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && "text-foreground",
            !isEqual(day, selectedDay) && !isToday(day) && !isSameMonth(day, firstDayCurrentMonth) && "text-muted-foreground",
            isEqual(day, selectedDay) && isToday(day) && "border-none bg-primary",
            isEqual(day, selectedDay) && !isToday(day) && "bg-foreground text-background",
            isToday(day) && !isEqual(day, selectedDay) && "border border-primary text-primary",
            (isEqual(day, selectedDay) || isToday(day)) && "font-semibold",
            "flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border",
          )}
        >
          <time dateTime={format(day, "yyyy-MM-dd")}>{format(day, "d")}</time>
        </button>
      </header>

      <div className="flex-1 p-2.5 space-y-1">
        {dayData?.events.slice(0, 2).map(event => {
          const inner = (
            <div
              key={event.id}
              className="flex flex-col items-start gap-0.5 rounded-lg px-2 py-1.5 text-xs leading-tight"
              style={{
                backgroundColor: event.color ? `${event.color}18` : undefined,
                borderLeft: event.color ? `3px solid ${event.color}` : undefined,
                ...(event.color ? {} : { border: "1px solid var(--border)", backgroundColor: "hsl(var(--muted)/0.5)" }),
              }}
            >
              <p className="font-medium leading-none truncate w-full" style={event.color ? { color: event.color } : {}}>
                {event.name}
              </p>
              <p className="leading-none text-muted-foreground">{event.time}</p>
            </div>
          )

          return event.href ? (
            <Link key={event.id} href={event.href} onClick={e => e.stopPropagation()}>
              {inner}
            </Link>
          ) : (
            <div key={event.id}>{inner}</div>
          )
        })}
        {dayData && dayData.events.length > 2 && (
          <p className="text-xs text-muted-foreground px-1">
            +{dayData.events.length - 2} más
          </p>
        )}
      </div>
    </div>
  )
}
