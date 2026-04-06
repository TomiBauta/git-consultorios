import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AppointmentsTable, AppointmentRow } from '@/components/ui/appointments-table'
import { Calendar, Users, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const today = new Date()
  const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0)
  const endOfDay   = new Date(today); endOfDay.setHours(23, 59, 59, 999)

  let apptQuery = supabase
    .from('appointments')
    .select(`
      id, scheduled_at, status, reason, specialty,
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

  const appointments: AppointmentRow[] = (todayAppointments ?? []).map((appt: any) => ({
    id: appt.id,
    scheduled_at: appt.scheduled_at,
    status: appt.status,
    reason: appt.reason,
    specialty: appt.specialty,
    patient_name: appt.patients
      ? `${appt.patients.first_name} ${appt.patients.last_name}`
      : 'Paciente',
    doctor_name: appt.profiles?.full_name ?? undefined,
  }))

  const showDoctor = profile?.role !== 'doctor'

  return (
    <div className="space-y-6">
      {/* Header — Display typography, tight tracking */}
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--on-surface, #1a1b1f)', letterSpacing: '-0.02em' }}
        >
          {greeting()}, {profile?.full_name.split(' ')[profile.role === 'doctor' ? 1 : 0]}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant, #44474f)' }}>
          {today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats — tonal cards, ambient shadow, no explicit borders */}
      <div className="grid grid-cols-3 gap-4">
        {/* Turnos hoy */}
        <div className="card-ambient rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--on-surface-variant, #44474f)' }}>
                Turnos hoy
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--primary-val, #002453)' }}>
                {todayAppointments?.length ?? 0}
              </p>
              {(pendingAppointments ?? 0) > 0 && (
                <p className="text-xs mt-1 text-amber-600 dark:text-amber-400">
                  {pendingAppointments} pendiente{pendingAppointments !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface-container-low, #f4f3f8)' }}
            >
              <Calendar className="w-5 h-5" style={{ color: 'var(--primary-val, #002453)' }} />
            </div>
          </div>
        </div>

        {/* Turnos mes */}
        <div className="card-ambient rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--on-surface-variant, #44474f)' }}>
                Turnos este mes
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--primary-val, #002453)' }}>
                {monthAppointments ?? 0}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface-container-low, #f4f3f8)' }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--primary-val, #002453)' }} />
            </div>
          </div>
        </div>

        {/* Pacientes */}
        <div className="card-ambient rounded-2xl p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--on-surface-variant, #44474f)' }}>
                Pacientes totales
              </p>
              <p className="text-3xl font-bold mt-1" style={{ color: 'var(--primary-val, #002453)' }}>
                {totalPatients ?? 0}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--surface-container-low, #f4f3f8)' }}
            >
              <Users className="w-5 h-5" style={{ color: 'var(--primary-val, #002453)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de turnos — tonal surface, no border */}
      <div
        className="card-ambient rounded-2xl overflow-hidden"
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--outline-variant, rgba(68,71,79,0.15))' }}
        >
          <h2
            className="text-base font-semibold tracking-tight"
            style={{ color: 'var(--on-surface, #1a1b1f)' }}
          >
            Turnos de hoy
          </h2>
          <Link
            href="/agenda"
            className="text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--primary-val, #002453)' }}
          >
            Ver agenda →
          </Link>
        </div>
        <div className="p-4">
          <AppointmentsTable appointments={appointments} showDoctor={showDoctor} />
        </div>
      </div>
    </div>
  )
}
