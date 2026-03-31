import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PatientTabs from './PatientTabs'

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = await params
  const supabase = await createClient()

  const { data: patient } = await supabase
    .from('patients')
    .select('*, obras_sociales(name)')
    .eq('id', patientId)
    .is('deleted_at', null)
    .single()

  if (!patient) notFound()

  const age = patient.birth_date
    ? Math.floor((Date.now() - new Date(patient.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#64748B]">
        <Link href="/pacientes" className="hover:text-[#1B3A6B]">Pacientes</Link>
        <span>›</span>
        <span className="text-[#0F172A] font-medium">{patient.last_name}, {patient.first_name}</span>
      </div>

      {/* Header del paciente */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1B3A6B] flex items-center justify-center text-white font-bold text-lg shrink-0">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {patient.first_name} {patient.last_name}
              </h1>
              <div className="flex items-center gap-3 text-sm text-[#64748B] mt-0.5 flex-wrap">
                {patient.dni && <span>DNI {patient.dni}</span>}
                {age !== null && <span>{age} años</span>}
                {patient.sex && <span className="capitalize">{patient.sex}</span>}
                {(patient.obras_sociales as any)?.name && (
                  <span className="px-2 py-0.5 bg-[#F0F9FF] text-[#0891B2] rounded-full text-xs font-medium">
                    {(patient.obras_sociales as any).name}
                    {patient.obra_social_plan ? ` · ${patient.obra_social_plan}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link href="/agenda/nuevo" className="text-sm text-[#0891B2] hover:underline shrink-0">
            + Nuevo turno
          </Link>
        </div>

        {/* Banner alergias */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl">
            <span className="text-red-500 shrink-0">⚠️</span>
            <p className="text-sm text-red-700 font-medium">
              Alergias: {patient.allergies.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <PatientTabs patientId={patientId} />

      {/* Contenido */}
      {children}
    </div>
  )
}
