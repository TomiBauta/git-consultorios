'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/agenda/StatusBadge'

type Profile = { id: string; full_name: string; role: string; specialty: string | null }
type Doctor  = { id: string; full_name: string; specialty: string | null }

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología', gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología', clinica_medica: 'Clínica Médica',
}
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7:00 a 19:00

function getWeekDates(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 6 }, (_, i) => { // lunes a sábado
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return dd
  })
}

export default function AgendaClient({ profile, doctors }: { profile: Profile | null; doctors: Doctor[] }) {
  const supabase = createClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    profile?.role === 'doctor' ? profile.id : 'all'
  )
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const weekDates = getWeekDates(currentDate)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[5]

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    const start = new Date(weekStart); start.setHours(0, 0, 0, 0)
    const end = new Date(weekEnd); end.setHours(23, 59, 59, 999)

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
    setLoading(false)
  }, [weekStart.toISOString(), selectedDoctorId])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchAppointments)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAppointments])

  function prevWeek() { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d) }
  function nextWeek() { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d) }
  function goToday()  { setCurrentDate(new Date()) }

  const today = new Date()
  const isCurrentWeek = weekDates.some(d => d.toDateString() === today.toDateString())

  function getApptForCell(date: Date, hour: number) {
    return appointments.filter(a => {
      const d = new Date(a.scheduled_at)
      return d.toDateString() === date.toDateString() && d.getHours() === hour
    })
  }

  const DOCTOR_COLORS = ['#1B3A6B', '#0891B2', '#059669', '#7C3AED', '#DC2626']
  const doctorColorMap: Record<string, string> = {}
  doctors.forEach((d, i) => { doctorColorMap[d.id] = DOCTOR_COLORS[i % DOCTOR_COLORS.length] })

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Agenda
          </h1>
          <p className="text-sm text-[#64748B]">
            {weekStart.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} –{' '}
            {weekEnd.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtro médico (solo admins y recepcionistas) */}
          {profile?.role !== 'doctor' && (
            <select
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(e.target.value)}
              className="text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            >
              <option value="all">Todos los médicos</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden">
            <button onClick={prevWeek} className="px-3 py-2 hover:bg-[#F8FAFC] text-[#64748B] text-sm transition-colors">‹</button>
            <button onClick={goToday} className="px-3 py-2 hover:bg-[#F8FAFC] text-sm text-[#334155] border-x border-[#E2E8F0] transition-colors">
              Hoy
            </button>
            <button onClick={nextWeek} className="px-3 py-2 hover:bg-[#F8FAFC] text-[#64748B] text-sm transition-colors">›</button>
          </div>
          <Link href="/agenda/nuevo">
            <Button className="bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white text-sm">
              + Nuevo turno
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendario semanal */}
      <div className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col min-h-0">
        {/* Header días */}
        <div className="grid border-b border-[#E2E8F0]" style={{ gridTemplateColumns: '56px repeat(6, 1fr)' }}>
          <div className="p-2 border-r border-[#E2E8F0]" />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === today.toDateString()
            return (
              <div key={i} className={`p-3 text-center border-r border-[#E2E8F0] last:border-r-0 ${isToday ? 'bg-[#EFF6FF]' : ''}`}>
                <p className="text-xs text-[#94A3B8] font-medium">{DAYS[date.getDay()]}</p>
                <p className={`text-lg font-semibold mt-0.5 ${isToday ? 'text-[#1B3A6B]' : 'text-[#334155]'}`}>
                  {date.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Grid horaria */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-[#94A3B8] text-sm">
              Cargando...
            </div>
          ) : (
            HOURS.map(hour => (
              <div key={hour} className="grid border-b border-[#F1F5F9] last:border-b-0" style={{ gridTemplateColumns: '56px repeat(6, 1fr)', minHeight: '64px' }}>
                <div className="p-2 text-right pr-3 text-xs text-[#94A3B8] font-medium border-r border-[#E2E8F0] pt-2">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {weekDates.map((date, di) => {
                  const isToday = date.toDateString() === today.toDateString()
                  const cellAppts = getApptForCell(date, hour)
                  return (
                    <div
                      key={di}
                      className={`border-r border-[#F1F5F9] last:border-r-0 p-1 ${isToday ? 'bg-[#FAFCFF]' : ''}`}
                    >
                      {cellAppts.map((appt: any) => {
                        const patient = appt.patients
                        const color = doctorColorMap[appt.doctor_id] ?? '#1B3A6B'
                        return (
                          <Link key={appt.id} href={`/agenda/${appt.id}`}>
                            <div
                              className="rounded-lg px-2 py-1.5 mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: color + '18', borderLeft: `3px solid ${color}` }}
                            >
                              <p className="text-xs font-semibold truncate" style={{ color }}>
                                {patient?.first_name} {patient?.last_name}
                              </p>
                              <p className="text-xs truncate" style={{ color: color + 'AA' }}>
                                {new Date(appt.scheduled_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                {appt.reason ? ` · ${appt.reason}` : ''}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Leyenda médicos */}
      {selectedDoctorId === 'all' && profile?.role !== 'doctor' && (
        <div className="flex items-center gap-4 flex-wrap">
          {doctors.map(d => (
            <div key={d.id} className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: doctorColorMap[d.id] }} />
              {d.full_name.replace('Dr. ', '').replace('Dra. ', '')}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
