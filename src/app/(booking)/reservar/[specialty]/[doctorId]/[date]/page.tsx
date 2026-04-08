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
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
        <Link href="/reservar" className="hover:opacity-70 transition-opacity">Especialidades</Link>
        <span>›</span>
        <Link href={`/reservar/${specialty}`} className="hover:opacity-70 transition-opacity">
          {SPECIALTY_LABELS[specialty]}
        </Link>
        <span>›</span>
        <Link href={`/reservar/${specialty}/${doctorId}`} className="hover:opacity-70 transition-opacity">
          {doctor.full_name}
        </Link>
        <span>›</span>
        <span className="font-semibold capitalize" style={{ color: 'var(--primary-val, #00113a)' }}>{dateFormatted}</span>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight capitalize" style={{ color: 'var(--primary-val, #00113a)' }}>
          {dateFormatted}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
          {doctor.full_name} · {SPECIALTY_LABELS[specialty]}
        </p>
      </div>

      <SlotPicker
        doctorId={doctorId}
        date={date}
        specialty={specialty}
        doctorName={doctor.full_name}
        doctorSpecialtyLabel={SPECIALTY_LABELS[specialty] ?? specialty}
        availability={availability ?? []}
        initialTakenSlots={takenSlots}
      />
    </div>
  )
}
