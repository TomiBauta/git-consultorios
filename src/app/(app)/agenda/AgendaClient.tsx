'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isSameDay, startOfMonth, endOfMonth, format, startOfToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { FullScreenCalendar, CalendarDay } from '@/components/ui/fullscreen-calendar'
import Link from 'next/link'
import { Sun, Moon, ArrowRight, Plus } from 'lucide-react'

type Profile = { id: string; full_name: string; role: string; specialty: string | null }
type Doctor  = { id: string; full_name: string; specialty: string | null }

const DOCTOR_COLORS = ['#00113a', '#002366', '#0891B2', '#059669', '#7C3AED']

// ── Status helpers ──────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; dot: string; text: string }> = {
  confirmado: { label: 'Confirmado', dot: '#b3e5f0', text: '#0c6780' },
  atendido:   { label: 'Atendido',   dot: '#b3e5f0', text: '#0c6780' },
  en_sala:    { label: 'En Sala',    dot: '#adc6ff', text: '#2b4677' },
  pendiente:  { label: 'Pendiente',  dot: '#c4c6d0', text: '#3d4a5c' },
  cancelado:  { label: 'Cancelado',  dot: '#ba1a1a', text: '#93000a' },
  ausente:    { label: 'Ausente',    dot: '#ffb958', text: '#7a5800' },
}

// ── Side panel appointment card ─────────────────────────────────────────────
function AppointmentCard({ appt, doctorColor }: { appt: any; doctorColor: string }) {
  const timeStr  = new Date(appt.scheduled_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const patient  = appt.patients ? `${appt.patients.first_name} ${appt.patients.last_name}` : 'Paciente'
  const isActive = appt.status === 'confirmado' || appt.status === 'atendido'
  const st = STATUS_MAP[appt.status] ?? STATUS_MAP.pendiente

  return (
    <Link href={`/agenda/${appt.id}`}>
      <div
        className="p-4 rounded cursor-pointer hover:brightness-95 transition-all"
        style={{
          background: '#f2f4f6',
          borderLeft: `4px solid ${isActive ? doctorColor : 'rgba(196,198,208,0.4)'}`,
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{
              background: isActive ? `${doctorColor}18` : '#eaecef',
              color: isActive ? doctorColor : '#3d4a5c',
            }}
          >
            {timeStr}
          </span>
          <ArrowRight className="w-3.5 h-3.5 opacity-30" />
        </div>
        <p className="text-sm font-bold" style={{ color: '#1a1b1f' }}>{patient}</p>
        {appt.reason && (
          <p className="text-[11px] mt-0.5" style={{ color: '#3d4a5c' }}>{appt.reason}</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
          <span className="text-[10px] font-semibold" style={{ color: st.text }}>{st.label}</span>
        </div>
      </div>
    </Link>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AgendaClient({ profile, doctors }: { profile: Profile | null; doctors: Doctor[] }) {
  const supabase = createClient()
  const router = useRouter()

  const [currentMonthStart, setCurrentMonthStart] = useState<Date>(startOfMonth(new Date()))
  const [selectedDay,       setSelectedDay]        = useState<Date>(startOfToday())
  const [selectedDoctorId,  setSelectedDoctorId]   = useState<string>(
    profile?.role === 'doctor' ? profile.id : 'all'
  )
  const [appointments, setAppointments] = useState<any[]>([])

  // Build doctor→color map
  const doctorColorMap: Record<string, string> = {}
  doctors.forEach((d, i) => { doctorColorMap[d.id] = DOCTOR_COLORS[i % DOCTOR_COLORS.length] })

  const fetchAppointments = useCallback(async () => {
    const start = startOfMonth(currentMonthStart)
    const end   = endOfMonth(currentMonthStart)

    let query = supabase
      .from('appointments')
      .select(`id, scheduled_at, duration_mins, status, reason, specialty, doctor_id,
        patients (id, first_name, last_name),
        profiles!appointments_doctor_id_fkey (full_name, specialty)`)
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .neq('status', 'cancelado')
      .order('scheduled_at')

    if (selectedDoctorId !== 'all') query = query.eq('doctor_id', selectedDoctorId)
    else if (profile?.role === 'doctor') query = query.eq('doctor_id', profile.id)

    const { data } = await query
    setAppointments(data ?? [])
  }, [currentMonthStart.toISOString(), selectedDoctorId])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  useEffect(() => {
    const channel = supabase
      .channel('appointments-agenda')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAppointments])

  // Map to CalendarDay[]
  const calendarData: CalendarDay[] = (() => {
    const map: Record<string, CalendarDay> = {}
    for (const appt of appointments) {
      const day = new Date(appt.scheduled_at)
      const key = format(day, 'yyyy-MM-dd')
      if (!map[key]) map[key] = { day: new Date(key), events: [] }
      const patient = appt.patients
      const color   = doctorColorMap[appt.doctor_id] ?? '#00113a'
      map[key].events.push({
        id:       appt.id,
        name:     patient ? `${patient.last_name}, ${patient.first_name}` : 'Paciente',
        time:     new Date(appt.scheduled_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        datetime: appt.scheduled_at,
        href:     `/agenda/${appt.id}`,
        color,
      })
    }
    return Object.values(map)
  })()

  // Side panel data
  const selectedDayAppts = appointments.filter(a => isSameDay(new Date(a.scheduled_at), selectedDay))
  const amAppts = selectedDayAppts.filter(a => new Date(a.scheduled_at).getHours() < 12)
  const pmAppts = selectedDayAppts.filter(a => new Date(a.scheduled_at).getHours() >= 12)

  // Doctor filter control (bento styled — passed as extraControls)
  const doctorFilter = profile?.role !== 'doctor' ? (
    <select
      value={selectedDoctorId}
      onChange={e => setSelectedDoctorId(e.target.value)}
      className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 focus:outline-none"
      style={{ color: '#00113a' }}
    >
      <option value="all">Todos los médicos</option>
      {doctors.map(d => (
        <option key={d.id} value={d.id}>{d.full_name}</option>
      ))}
    </select>
  ) : null

  return (
    <div className="flex h-full -m-8 overflow-hidden">

      {/* ── Calendar area ── */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto min-w-0">
        <FullScreenCalendar
          data={calendarData}
          onNewEvent={() => router.push('/agenda/nuevo')}
          onMonthChange={first => setCurrentMonthStart(startOfMonth(first))}
          extraControls={doctorFilter ?? undefined}
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
        />
      </div>

      {/* ── Detail side panel ── */}
      <aside
        className="w-80 flex flex-col p-6 overflow-y-auto shrink-0"
        style={{
          background: '#ffffff',
          borderLeft: '1px solid rgba(196,198,208,0.1)',
        }}
      >
        {/* Day header */}
        <div className="mb-8">
          <h3
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: '#3d4a5c' }}
          >
            Detalle del Día
          </h3>
          <p
            className="text-xl font-extrabold capitalize"
            style={{ color: '#00113a', letterSpacing: '-0.02em' }}
          >
            {format(selectedDay, "EEEE, d MMMM", { locale: es })}
          </p>
          {selectedDayAppts.length > 0 && (
            <p className="text-xs mt-1" style={{ color: '#3d4a5c' }}>
              {selectedDayAppts.length} turno{selectedDayAppts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Empty state */}
        {selectedDayAppts.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div
              className="w-12 h-12 rounded flex items-center justify-center mb-4"
              style={{ background: '#f2f4f6' }}
            >
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-sm font-medium" style={{ color: '#3d4a5c' }}>
              Sin turnos para este día
            </p>
            <button
              onClick={() => router.push('/agenda/nuevo')}
              className="mt-4 text-xs font-bold px-4 py-2 rounded transition-all"
              style={{ background: '#00113a', color: '#ffffff' }}
            >
              + Agendar turno
            </button>
          </div>
        )}

        {/* AM block */}
        {amAppts.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-4 h-4" style={{ color: '#3d4a5c' }} />
              <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1a1b1f' }}>
                Mañana
              </h4>
            </div>
            <div className="space-y-3">
              {amAppts.map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  doctorColor={doctorColorMap[appt.doctor_id] ?? '#00113a'}
                />
              ))}
            </div>
          </section>
        )}

        {/* PM block */}
        {pmAppts.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-4 h-4" style={{ color: '#3d4a5c' }} />
              <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#1a1b1f' }}>
                Tarde / Noche
              </h4>
            </div>
            <div className="space-y-3">
              {pmAppts.map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  doctorColor={doctorColorMap[appt.doctor_id] ?? '#00113a'}
                />
              ))}
            </div>
          </section>
        )}

        {/* Quick add link at bottom */}
        {selectedDayAppts.length > 0 && (
          <div className="mt-auto pt-6" style={{ borderTop: '1px solid rgba(196,198,208,0.15)' }}>
            <Link
              href="/agenda/nuevo"
              className="flex items-center gap-2 text-xs font-bold transition-colors hover:opacity-70"
              style={{ color: '#00113a' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar turno en este día
            </Link>
          </div>
        )}
      </aside>

      {/* FAB */}
      <button
        onClick={() => router.push('/agenda/nuevo')}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center z-50 transition-all hover:scale-105 active:scale-95"
        style={{
          background: '#00113a',
          color: 'white',
          boxShadow: '0px 10px 30px rgba(0,17,58,0.18)',
        }}
        aria-label="Nuevo turno"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
