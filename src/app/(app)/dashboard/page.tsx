import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pendiente:   { label: 'Pendiente',   color: 'bg-yellow-100 text-yellow-800' },
  confirmado:  { label: 'Confirmado',  color: 'bg-green-100 text-green-800' },
  cancelado:   { label: 'Cancelado',   color: 'bg-red-100 text-red-800' },
  ausente:     { label: 'Ausente',     color: 'bg-gray-100 text-gray-600' },
  atendido:    { label: 'Atendido',    color: 'bg-blue-100 text-blue-800' },
}

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia:      'Oftalmología',
  gastroenterologia: 'Gastroenterología',
  diabetologia:      'Diabetología',
  clinica_medica:    'Clínica Médica',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  // Turnos de hoy
  let apptQuery = supabase
    .from('appointments')
    .select(`
      id, scheduled_at, status, reason, specialty,
      patients (first_name, last_name, obra_social_id),
      profiles!appointments_doctor_id_fkey (full_name, specialty)
    `)
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString())
    .neq('status', 'cancelado')
    .order('scheduled_at')

  if (profile?.role === 'doctor') {
    apptQuery = apptQuery.eq('doctor_id', user!.id)
  }

  const { data: todayAppointments } = await apptQuery

  // Stats
  const { count: totalPatients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const { count: monthAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_at', startOfMonth.toISOString())
    .neq('status', 'cancelado')

  const { count: pendingAppointments } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_at', startOfDay.toISOString())
    .eq('status', 'pendiente')

  const greeting = () => {
    const h = today.getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {greeting()}, {profile?.full_name.split(' ')[profile.role === 'doctor' ? 1 : 0]}
        </h1>
        <p className="text-[#64748B] text-sm mt-1">
          {today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0]">
          <CardContent className="pt-6">
            <p className="text-sm text-[#64748B]">Turnos hoy</p>
            <p className="text-3xl font-bold text-[#1B3A6B] mt-1">{todayAppointments?.length ?? 0}</p>
            {(pendingAppointments ?? 0) > 0 && (
              <p className="text-xs text-yellow-600 mt-1">{pendingAppointments} pendiente{pendingAppointments !== 1 ? 's' : ''}</p>
            )}
          </CardContent>
        </Card>
        <Card className="border-[#E2E8F0]">
          <CardContent className="pt-6">
            <p className="text-sm text-[#64748B]">Turnos este mes</p>
            <p className="text-3xl font-bold text-[#1B3A6B] mt-1">{monthAppointments ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-[#E2E8F0]">
          <CardContent className="pt-6">
            <p className="text-sm text-[#64748B]">Pacientes totales</p>
            <p className="text-3xl font-bold text-[#1B3A6B] mt-1">{totalPatients ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Turnos de hoy */}
      <Card className="border-[#E2E8F0]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-semibold text-[#0F172A]">
            Turnos de hoy
          </CardTitle>
          <Link href="/agenda" className="text-sm text-[#0891B2] hover:underline">
            Ver agenda →
          </Link>
        </CardHeader>
        <CardContent>
          {!todayAppointments || todayAppointments.length === 0 ? (
            <div className="text-center py-10 text-[#94A3B8]">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-sm">No hay turnos para hoy</p>
              <Link href="/agenda/nuevo" className="text-sm text-[#0891B2] hover:underline mt-2 inline-block">
                Agregar turno
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAppointments.map((appt: any) => {
                const time = new Date(appt.scheduled_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                const status = STATUS_LABELS[appt.status] ?? { label: appt.status, color: 'bg-gray-100 text-gray-600' }
                const patient = appt.patients as any
                const doctor = appt.profiles as any
                return (
                  <Link key={appt.id} href={`/agenda/${appt.id}`}>
                    <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E2E8F0]">
                      <div className="w-14 text-center shrink-0">
                        <p className="text-sm font-semibold text-[#1B3A6B]">{time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[#0F172A] truncate">
                          {patient?.first_name} {patient?.last_name}
                        </p>
                        <p className="text-xs text-[#64748B] truncate">
                          {profile?.role !== 'doctor' ? `${doctor?.full_name} · ` : ''}
                          {SPECIALTY_LABELS[appt.specialty] ?? appt.specialty}
                          {appt.reason ? ` · ${appt.reason}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
