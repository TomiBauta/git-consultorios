import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// ── Status badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    confirmado: { bg: 'rgba(12,103,128,0.12)', text: '#0c6780',  label: 'Confirmado' },
    atendido:   { bg: 'rgba(12,103,128,0.12)', text: '#0c6780',  label: 'Atendido'   },
    en_sala:    { bg: 'rgba(0,35,102,0.08)',     text: '#002366',  label: 'En Sala'    },
    pendiente:  { bg: '#e2e5e9',                text: '#3d4a5c',  label: 'Pendiente'  },
    cancelado:  { bg: '#ffdad6',                text: '#93000a',  label: 'Cancelado'  },
    ausente:    { bg: '#fff3cc',                text: '#7a5800',  label: 'Ausente'    },
  }
  const s = map[status] ?? map.pendiente
  return (
    <span
      className="px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

// ── Availability bar ─────────────────────────────────────────────────────────
function AvailabilityBar({ label, count, maxCount }: { label: string; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
  const opacity = pct > 80 ? 0.9 : pct > 60 ? 0.7 : pct > 40 ? 0.5 : 0.3
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className="w-full flex flex-col justify-end h-20">
        <div
          className="w-full rounded-t-lg transition-all"
          style={{
            height: `${Math.max(8, pct)}%`,
            background: `rgba(0,36,83,${opacity})`,
          }}
        />
      </div>
      <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--on-surface-variant)' }}>
        {label}
      </span>
      <span className="text-[10px]" style={{ color: 'var(--on-surface-variant)' }}>
        {count}
      </span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const today = new Date()
  const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0)
  const endOfDay   = new Date(today); endOfDay.setHours(23, 59, 59, 999)

  // Today's appointments
  let apptQuery = supabase
    .from('appointments')
    .select(`
      id, scheduled_at, status, reason, specialty, doctor_id,
      patients (first_name, last_name),
      profiles!appointments_doctor_id_fkey (full_name)
    `)
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString())
    .neq('status', 'cancelado')
    .order('scheduled_at')

  if (profile?.role === 'doctor') {
    apptQuery = apptQuery.eq('doctor_id', user!.id)
  }

  const { data: todayAppointments } = await apptQuery

  // Monthly count
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const { count: monthAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_at', startOfMonth.toISOString())
    .neq('status', 'cancelado')

  // Total patients
  const { count: totalPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  // This week (Mon–Fri) for capacity
  const startOfWeek = new Date(today)
  const dow = today.getDay()
  startOfWeek.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 4)
  endOfWeek.setHours(23, 59, 59, 999)

  const { count: thisWeekCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_at', startOfWeek.toISOString())
    .lte('scheduled_at', endOfWeek.toISOString())
    .neq('status', 'cancelado')

  const { count: doctorCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'doctor')

  const maxWeeklyCapacity = Math.max(1, (doctorCount ?? 1) * 5 * 8)
  const capacityPct = Math.min(100, Math.round(((thisWeekCount ?? 0) / maxWeeklyCapacity) * 100))

  // Next 4 weekdays
  const next4Days: Date[] = []
  const cursor = new Date(today)
  cursor.setDate(cursor.getDate() + 1)
  while (next4Days.length < 4) {
    const d = cursor.getDay()
    if (d !== 0 && d !== 6) next4Days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  const { data: upcomingData } = await supabase
    .from('appointments')
    .select('scheduled_at')
    .gte('scheduled_at', next4Days[0].toISOString().split('T')[0] + 'T00:00:00')
    .lte('scheduled_at', next4Days[3].toISOString().split('T')[0] + 'T23:59:59')
    .neq('status', 'cancelado')

  const dayCountMap: Record<string, number> = {}
  for (const a of (upcomingData ?? [])) {
    const key = a.scheduled_at.split('T')[0]
    dayCountMap[key] = (dayCountMap[key] ?? 0) + 1
  }

  const next4DayCounts = next4Days.map(d => ({
    date: d,
    count: dayCountMap[d.toISOString().split('T')[0]] ?? 0,
    label: d.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase().slice(0, 3),
  }))

  const maxDayCount = Math.max(4, ...next4DayCounts.map(d => d.count), (doctorCount ?? 1) * 4)

  // Greeting
  const h = today.getHours()
  const greeting = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = profile?.full_name.split(' ')[profile.role === 'doctor' ? 1 : 0] ?? ''

  const showDoctor = profile?.role !== 'doctor'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2
          className="text-3xl font-bold tracking-tight"
          style={{ color: 'var(--primary-val)', letterSpacing: '-0.02em' }}
        >
          Resumen de Actividad
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
          {greeting}, {firstName}. Aquí tienes el estado de la clínica hoy.
        </p>
      </div>

      {/* Stats — 3 cols bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Turnos hoy */}
        <div className="card-ambient rounded p-6 hover:-translate-y-1 transition-transform cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: '#d8e2ff' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--on-surface)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} />
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} />
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
              </svg>
            </div>
            <span className="px-3 py-1 text-[10px] font-bold rounded-full" style={{ background: 'rgba(12,103,128,0.15)', color: '#0c6780' }}>
              hoy
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>Turnos de hoy</p>
          <h3 className="text-4xl font-extrabold tracking-tighter mt-1" style={{ color: 'var(--on-surface)' }}>
            {todayAppointments?.length ?? 0}
          </h3>
        </div>

        {/* Turnos mes */}
        <div className="card-ambient rounded p-6 hover:-translate-y-1 transition-transform cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: '#d9e2fc' }}>
              <svg className="w-6 h-6" style={{ color: '#555e74' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="px-3 py-1 text-[10px] font-bold rounded-full" style={{ background: 'rgba(216,226,255,0.4)', color: '#2b4677' }}>
              este mes
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>Turnos este mes</p>
          <h3 className="text-4xl font-extrabold tracking-tighter mt-1" style={{ color: 'var(--on-surface)' }}>
            {monthAppointments ?? 0}
          </h3>
        </div>

        {/* Pacientes */}
        <div className="card-ambient rounded p-6 hover:-translate-y-1 transition-transform cursor-default">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded flex items-center justify-center" style={{ background: 'rgba(12,103,128,0.10)' }}>
              <svg className="w-6 h-6" style={{ color: '#0c6780' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth={2} />
                <circle cx="9" cy="7" r="4" strokeWidth={2} />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth={2} />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth={2} />
              </svg>
            </div>
            <span className="px-3 py-1 text-[10px] font-bold rounded-full" style={{ background: 'rgba(12,103,128,0.15)', color: '#0c6780' }}>
              total
            </span>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>Pacientes totales</p>
          <h3 className="text-4xl font-extrabold tracking-tighter mt-1" style={{ color: 'var(--on-surface)' }}>
            {(totalPatients ?? 0).toLocaleString('es-AR')}
          </h3>
        </div>
      </div>

      {/* Main content — 8/4 split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Appointments list — col-span-8 */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold tracking-tight" style={{ color: 'var(--on-surface)' }}>
              Próximos Pacientes
            </h4>
            <Link
              href="/agenda"
              className="text-sm font-semibold hover:underline transition-colors"
              style={{ color: '#002366' }}
            >
              Ver agenda completa
            </Link>
          </div>

          {(todayAppointments ?? []).length === 0 ? (
            <div
              className="card-ambient rounded p-10 text-center"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              <p className="font-medium">No hay turnos programados para hoy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(todayAppointments ?? []).map((appt: any) => {
                const apptDate = new Date(appt.scheduled_at)
                const isPast = apptDate < new Date()
                const timeStr = apptDate.toLocaleTimeString('es-AR', {
                  hour: '2-digit', minute: '2-digit', hour12: false,
                })
                const period = parseInt(timeStr.split(':')[0]) < 12 ? 'AM' : 'PM'
                const patientName = appt.patients
                  ? `${appt.patients.last_name}, ${appt.patients.first_name}`
                  : 'Paciente'
                const subtitle = [appt.reason, showDoctor && appt.profiles?.full_name ? `Dr. ${appt.profiles.full_name}` : null]
                  .filter(Boolean).join(' • ')

                return (
                  <div
                    key={appt.id}
                    className="flex items-center gap-6 p-5 rounded hover:shadow-md transition-all"
                    style={{
                      background: 'var(--surface-container-lowest)',
                      boxShadow: 'var(--ambient-shadow)',
                      opacity: isPast ? 0.65 : 1,
                    }}
                  >
                    {/* Time column */}
                    <div
                      className="flex flex-col items-center justify-center pr-6 min-w-[80px]"
                      style={{ borderRight: '1px solid rgba(196,198,208,0.4)' }}
                    >
                      <span
                        className="text-lg font-extrabold"
                        style={{ color: isPast ? '#3d4a5c' : '#00113a' }}
                      >
                        {timeStr}
                      </span>
                      <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--on-surface-variant)' }}>
                        {period}
                      </span>
                    </div>

                    {/* Patient info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-base font-bold truncate" style={{ color: 'var(--on-surface)' }}>
                        {patientName}
                      </h5>
                      {subtitle && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
                          {subtitle}
                        </p>
                      )}
                    </div>

                    {/* Status + arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={appt.status} />
                      <Link href={`/agenda/${appt.id}`}>
                        <button
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                          style={{ background: 'var(--surface-container)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#d8e2ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#eaecef')}
                        >
                          <ArrowRight className="w-4 h-4" style={{ color: 'var(--on-surface)' }} />
                        </button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Analysis sidebar — col-span-4 */}
        <div className="lg:col-span-4 space-y-5">

          {/* Capacity card — navy bg */}
          <div
            className="rounded p-8 overflow-hidden relative shadow-xl"
            style={{ background: '#00113a', color: 'white' }}
          >
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-6">Capacidad Semanal</h4>
              <div className="flex items-end justify-between mb-3">
                <span className="text-5xl font-extrabold tracking-tighter">{capacityPct}%</span>
                {capacityPct > 70 && (
                  <span
                    className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest"
                    style={{ color: '#cce8f0', background: 'rgba(255,255,255,0.08)' }}
                  >
                    Alta demanda
                  </span>
                )}
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${capacityPct}%`, background: '#b3e5f0' }}
                />
              </div>
              <p className="text-xs mt-5 leading-relaxed" style={{ color: '#94a3b8' }}>
                {capacityPct >= 90
                  ? 'Cerca del límite operativo. Considerá habilitar sobreturnos.'
                  : capacityPct >= 70
                  ? 'Alta demanda esta semana. Revisá disponibilidad.'
                  : 'Buena disponibilidad para nuevos turnos esta semana.'
                }
              </p>
            </div>
            {/* Decorative circle */}
            <div
              className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            />
          </div>

          {/* Availability next 4 days */}
          <div className="card-ambient rounded p-6">
            <h4 className="text-sm font-bold mb-5" style={{ color: 'var(--on-surface)' }}>
              Disponibilidad Próximos 4 Días
            </h4>
            <div className="flex justify-between items-end h-28 gap-3">
              {next4DayCounts.map(({ label, count }, i) => (
                <AvailabilityBar key={i} label={label} count={count} maxCount={maxDayCount} />
              ))}
            </div>
          </div>

          {/* Quick link */}
          <div
            className="rounded p-5"
            style={{ background: 'var(--surface-container-low)' }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'var(--on-surface)' }}
            >
              Acciones Rápidas
            </p>
            <div className="space-y-3">
              <Link
                href="/agenda/nuevo"
                className="flex items-center justify-between text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: 'var(--on-surface)' }}
              >
                <span>Nuevo turno</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pacientes/nuevo"
                className="flex items-center justify-between text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: 'var(--on-surface)' }}
              >
                <span>Nuevo paciente</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/configuracion/medicos"
                className="flex items-center justify-between text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: 'var(--on-surface)' }}
              >
                <span>Configurar agenda</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
