import { createClient } from '@/lib/supabase/server'
import DoctorAvailabilityManager from './DoctorAvailabilityManager'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología',
  gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología',
  clinica_medica: 'Clínica Médica',
}

export default async function MedicosConfigPage() {
  const supabase = await createClient()

  const { data: doctors } = await supabase
    .from('profiles')
    .select('id, full_name, specialty, is_active')
    .eq('role', 'doctor')
    .order('full_name')

  const { data: availability } = await supabase
    .from('doctor_availability')
    .select('id, doctor_id, day_of_week, start_time, end_time, slot_duration')
    .eq('is_active', true)
    .order('day_of_week')

  // Bloqueos vigentes (hoy en adelante)
  const { data: blocks } = await supabase
    .from('doctor_blocks')
    .select('id, doctor_id, starts_at, ends_at, reason')
    .gte('ends_at', new Date().toISOString())
    .order('starts_at')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Médicos
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Configurá los horarios de atención y bloqueos por médico. Los cambios se reflejan inmediatamente en el sistema de reservas.
        </p>
      </div>

      {(!doctors || doctors.length === 0) && (
        <div className="bg-white border border-[#E2E8F0] rounded p-8 text-center">
          <p className="text-[#64748B]">No hay médicos registrados todavía.</p>
        </div>
      )}

      <div className="space-y-6">
        {doctors?.map(doctor => {
          const doctorAvailability = (availability ?? [])
            .filter(a => a.doctor_id === doctor.id)
          const doctorBlocks = (blocks ?? [])
            .filter(b => b.doctor_id === doctor.id)
            .map(b => ({ id: b.id, starts_at: b.starts_at, ends_at: b.ends_at, reason: b.reason ?? '' }))

          return (
            <div key={doctor.id} className="bg-white border border-[#E2E8F0] rounded p-6">
              {/* Header médico */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {doctor.full_name
                      .split(' ')
                      .filter((w: string) => !['Dr.', 'Dra.'].includes(w))
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0F172A]">{doctor.full_name}</p>
                    <p className="text-sm text-[#64748B]">
                      {SPECIALTY_LABELS[doctor.specialty ?? ''] ?? doctor.specialty}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  doctor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {doctor.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <DoctorAvailabilityManager
                doctorId={doctor.id}
                existing={doctorAvailability}
                blocks={doctorBlocks}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
