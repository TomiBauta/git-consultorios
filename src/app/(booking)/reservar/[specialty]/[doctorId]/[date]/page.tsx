import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SlotPicker from './SlotPicker'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología',
  gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología',
  clinica_medica: 'Clínica Médica',
}

export default async function SelectSlotPage({
  params,
}: {
  params: Promise<{ specialty: string; doctorId: string; date: string }>
}) {
  const { specialty, doctorId, date } = await params

  // Validar formato fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()

  const supabase = await createClient()

  const { data: doctor } = await supabase
    .from('profiles')
    .select('id, full_name, specialty')
    .eq('id', doctorId)
    .eq('is_active', true)
    .single()

  if (!doctor) notFound()

  const dayOfWeek = new Date(date + 'T12:00:00').getDay()

  const { data: availability } = await supabase
    .from('doctor_availability')
    .select('start_time, end_time, slot_duration')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)

  // Turnos ya ocupados ese día
  const { data: takenAppointments } = await supabase
    .from('appointments')
    .select('scheduled_at')
    .eq('doctor_id', doctorId)
    .gte('scheduled_at', `${date}T00:00:00`)
    .lte('scheduled_at', `${date}T23:59:59`)
    .neq('status', 'cancelado')

  const takenSlots = (takenAppointments ?? []).map(a => a.scheduled_at)

  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#64748B] flex-wrap">
        <Link href="/reservar" className="hover:text-[#1B3A6B]">Especialidades</Link>
        <span>›</span>
        <Link href={`/reservar/${specialty}`} className="hover:text-[#1B3A6B]">{SPECIALTY_LABELS[specialty]}</Link>
        <span>›</span>
        <Link href={`/reservar/${specialty}/${doctorId}`} className="hover:text-[#1B3A6B]">
          {doctor.full_name}
        </Link>
        <span>›</span>
        <span className="text-[#0F172A] font-medium capitalize">{dateFormatted}</span>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-[#0F172A] capitalize" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {dateFormatted}
        </h2>
        <p className="text-sm text-[#64748B]">{doctor.full_name} · {SPECIALTY_LABELS[specialty]}</p>
      </div>

      <SlotPicker
        doctorId={doctorId}
        date={date}
        specialty={specialty}
        doctorName={doctor.full_name}
        availability={availability ?? []}
        initialTakenSlots={takenSlots}
      />
    </div>
  )
}
