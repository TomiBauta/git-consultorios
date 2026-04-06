import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología',
  gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología',
  clinica_medica: 'Clínica Médica',
}

export default async function SelectDoctorPage({ params }: { params: Promise<{ specialty: string }> }) {
  const { specialty } = await params

  if (!SPECIALTY_LABELS[specialty]) notFound()

  const supabase = await createClient()
  const { data: doctors } = await supabase
    .from('profiles')
    .select('id, full_name, specialty')
    .eq('role', 'doctor')
    .eq('specialty', specialty)
    .eq('is_active', true)
    .order('full_name')

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#64748B]">
        <Link href="/reservar" className="hover:text-[#1B3A6B]">Especialidades</Link>
        <span>›</span>
        <span className="text-[#0F172A] font-medium">{SPECIALTY_LABELS[specialty]}</span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {SPECIALTY_LABELS[specialty]}
        </h1>
        <p className="text-[#64748B]">Elegí el médico con quien querés consultar</p>
      </div>

      {!doctors || doctors.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl text-center py-12">
          <p className="text-4xl mb-3">😔</p>
          <p className="text-[#64748B]">No hay médicos disponibles en esta especialidad por el momento.</p>
          <Link href="/reservar" className="text-sm text-[#0891B2] hover:underline mt-3 inline-block">
            ← Volver
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {doctors.map(doctor => (
            <Link key={doctor.id} href={`/reservar/${specialty}/${doctor.id}`}>
              <div className="flex items-center gap-4 p-5 bg-white border-2 border-[#E2E8F0] rounded-2xl hover:border-[#0891B2] hover:shadow-sm transition-all cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {doctor.full_name.split(' ').filter((w: string) => !['Dr.','Dra.'].includes(w)).slice(0,2).map((w: string) => w[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#0F172A]">{doctor.full_name}</p>
                  <p className="text-sm text-[#64748B]">{SPECIALTY_LABELS[doctor.specialty ?? '']}</p>
                </div>
                <span className="text-[#0891B2] font-medium text-sm">Ver turnos ›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
