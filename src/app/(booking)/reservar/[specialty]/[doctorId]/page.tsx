import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CalendarioDisponible from './CalendarioDisponible'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología',
  gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología',
  clinica_medica: 'Clínica Médica',
}

export default async function SelectDatePage({
  params,
}: {
  params: Promise<{ specialty: string; doctorId: string }>
}) {
  const { specialty, doctorId } = await params
  const supabase = await createClient()

  const { data: doctor } = await supabase
    .from('profiles')
    .select('id, full_name, specialty')
    .eq('id', doctorId)
    .eq('role', 'doctor')
    .eq('is_active', true)
    .single()

  if (!doctor) notFound()

  // Días de la semana con disponibilidad
  const { data: availability } = await supabase
    .from('doctor_availability')
    .select('day_of_week, start_time, end_time, slot_duration')
    .eq('doctor_id', doctorId)
    .eq('is_active', true)

  // Bloqueos en los próximos 60 días
  const from = new Date()
  const to = new Date(); to.setDate(to.getDate() + 60)

  const { data: blocks } = await supabase
    .from('doctor_blocks')
    .select('starts_at, ends_at')
    .eq('doctor_id', doctorId)
    .gte('ends_at', from.toISOString())
    .lte('starts_at', to.toISOString())

  const availableDays = [...new Set((availability ?? []).map(a => a.day_of_week))]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#64748B] flex-wrap">
        <Link href="/reservar" className="hover:text-[#1B3A6B]">Especialidades</Link>
        <span>›</span>
        <Link href={`/reservar/${specialty}`} className="hover:text-[#1B3A6B]">{SPECIALTY_LABELS[specialty]}</Link>
        <span>›</span>
        <span className="text-[#0F172A] font-medium">{doctor.full_name}</span>
      </div>

      <div className="bg-white dark:bg-[#1a2235] border border-[#E2E8F0] rounded p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white font-bold text-lg shrink-0">
            {doctor.full_name.split(' ').filter((w: string) => !['Dr.','Dra.'].includes(w)).slice(0,2).map((w: string) => w[0]).join('')}
          </div>
          <div>
            <p className="font-semibold text-[#0F172A]">{doctor.full_name}</p>
            <p className="text-sm text-[#64748B]">{SPECIALTY_LABELS[doctor.specialty ?? '']}</p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Elegí una fecha
        </h2>
        <p className="text-sm text-[#64748B]">Los días sin disponibilidad aparecen deshabilitados</p>
      </div>

      <CalendarioDisponible
        doctorId={doctorId}
        specialty={specialty}
        availableDays={availableDays}
        blocks={(blocks ?? []).map(b => ({ starts_at: b.starts_at, ends_at: b.ends_at }))}
      />
    </div>
  )
}
