import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AppointmentDetail from './AppointmentDetail'

export default async function AppointmentPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: appt } = await supabase
    .from('appointments')
    .select(`
      *,
      patients (id, first_name, last_name, dni, phone, birth_date, allergies, obra_social_id,
        obras_sociales (name)),
      profiles!appointments_doctor_id_fkey (full_name, specialty)
    `)
    .eq('id', appointmentId)
    .single()

  if (!appt) notFound()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/agenda" className="text-sm text-[#64748B] hover:text-[#1B3A6B]">← Agenda</Link>
      </div>
      <AppointmentDetail appt={appt} profile={profile} />
    </div>
  )
}
