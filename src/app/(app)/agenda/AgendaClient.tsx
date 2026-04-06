'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isSameDay, startOfMonth, endOfMonth, format } from 'date-fns'
import { FullScreenCalendar, CalendarDay } from '@/components/ui/fullscreen-calendar'

type Profile = { id: string; full_name: string; role: string; specialty: string | null }
type Doctor  = { id: string; full_name: string; specialty: string | null }

const DOCTOR_COLORS = ['#1B3A6B', '#0891B2', '#059669', '#7C3AED', '#DC2626']

export default function AgendaClient({ profile, doctors }: { profile: Profile | null; doctors: Doctor[] }) {
  const supabase = createClient()
  const router = useRouter()

  const [currentMonthStart, setCurrentMonthStart] = useState<Date>(startOfMonth(new Date()))
  const [selectedDoctorId, setSelectedDoctorId]   = useState<string>(
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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('appointments-agenda')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAppointments])

  // Map appointments to CalendarDay[]
  const calendarData: CalendarDay[] = (() => {
    const map: Record<string, CalendarDay> = {}
    for (const appt of appointments) {
      const day = new Date(appt.scheduled_at)
      const key = format(day, 'yyyy-MM-dd')
      if (!map[key]) map[key] = { day: new Date(key), events: [] }
      const patient = appt.patients
      const color   = doctorColorMap[appt.doctor_id] ?? '#1B3A6B'
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

  // Doctor filter control rendered inside the calendar header
  const doctorFilter = profile?.role !== 'doctor' ? (
    <select
      value={selectedDoctorId}
      onChange={e => setSelectedDoctorId(e.target.value)}
      className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
    >
      <option value="all">Todos los médicos</option>
      {doctors.map(d => (
        <option key={d.id} value={d.id}>{d.full_name}</option>
      ))}
    </select>
  ) : null

  return (
    <div className="flex h-full flex-col -m-6">
      <FullScreenCalendar
        data={calendarData}
        onNewEvent={() => router.push('/agenda/nuevo')}
        onMonthChange={first => setCurrentMonthStart(startOfMonth(first))}
        extraControls={doctorFilter ?? undefined}
      />
    </div>
  )
}
