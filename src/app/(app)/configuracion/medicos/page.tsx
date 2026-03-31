import { createClient } from '@/lib/supabase/server'
import DoctorAvailabilityManager from './DoctorAvailabilityManager'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología', gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología', clinica_medica: 'Clínica Médica',
}
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default async function MedicosConfigPage() {
  const supabase = await createClient()

  const { data: doctors } = await supabase
    .from('profiles')
    .select('id, full_name, specialty, is_active')
    .eq('role', 'doctor')
    .order('full_name')

  const { data: availability } = await supabase
    .from('doctor_availability')
    .select('*')
    .eq('is_active', true)
    .order('day_of_week')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>Médicos</h1>
        <p className="text-sm text-[#64748B] mt-1">Configurar horarios de atención por médico</p>
      </div>

      <div className="space-y-4">
        {doctors?.map(doctor => {
          const doctorAvailability = availability?.filter(a => a.doctor_id === doctor.id) ?? []
          return (
            <div key={doctor.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-[#0F172A]">{doctor.full_name}</p>
                  <p className="text-sm text-[#64748B]">{SPECIALTY_LABELS[doctor.specialty ?? ''] ?? doctor.specialty}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${doctor.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {doctor.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {doctorAvailability.length === 0 ? (
                <p className="text-sm text-[#94A3B8]">Sin horarios configurados</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {doctorAvailability.map(a => (
                    <div key={a.id} className="px-3 py-2 bg-[#F8FAFC] rounded-lg text-sm">
                      <p className="font-medium text-[#334155]">{DAYS[a.day_of_week]}</p>
                      <p className="text-xs text-[#64748B]">{a.start_time.slice(0,5)} – {a.end_time.slice(0,5)}</p>
                      <p className="text-xs text-[#94A3B8]">c/{a.slot_duration} min</p>
                    </div>
                  ))}
                </div>
              )}

              <DoctorAvailabilityManager doctorId={doctor.id} existing={doctorAvailability} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
