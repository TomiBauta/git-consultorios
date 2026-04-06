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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#0F172A] dark:text-slate-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {greeting()}, {profile?.full_name.split(' ')[profile.role === 'doctor' ? 1 : 0]}
        </h1>
        <p className="text-[#64748B] dark:text-slate-400 text-sm mt-1">
          {today.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {/* Turnos hoy */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#64748B] dark:text-slate-400">Turnos hoy</p>
              <p className="text-3xl font-bold text-[#1B3A6B] dark:text-sky-400 mt-1">{todayAppointments?.length ?? 0}</p>
              {(pendingAppointments ?? 0) > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  {pendingAppointments} pendiente{pendingAppointments !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-sky-900/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#1B3A6B] dark:text-sky-400" />
            </div>
          </div>
        </div>

        {/* Turnos mes */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#64748B] dark:text-slate-400">Turnos este mes</p>
              <p className="text-3xl font-bold text-[#1B3A6B] dark:text-sky-400 mt-1">{monthAppointments ?? 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-sky-900/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#0891B2] dark:text-sky-400" />
            </div>
          </div>
        </div>

        {/* Pacientes */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-[#64748B] dark:text-slate-400">Pacientes totales</p>
              <p className="text-3xl font-bold text-[#1B3A6B] dark:text-sky-400 mt-1">{totalPatients ?? 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-sky-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#1B3A6B] dark:text-sky-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de turnos */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl transition-colors">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] dark:border-[#334155]">
          <h2 className="text-base font-semibold text-[#0F172A] dark:text-slate-100">Turnos de hoy</h2>
          <Link href="/agenda" className="text-sm text-[#0891B2] hover:underline">
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
