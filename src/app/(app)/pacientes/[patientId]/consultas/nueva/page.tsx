import { createClient } from '@/lib/supabase/server'
import NuevaConsultaForm from './NuevaConsultaForm'

export default async function NuevaConsultaPage({
  params,
  searchParams,
}: {
  params: Promise<{ patientId: string }>
  searchParams: Promise<{ appointment?: string }>
}) {
  const { patientId } = await params
  const { appointment: appointmentId } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: patient } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .eq('id', patientId)
    .single()

  // Si viene de un turno, pre-cargar datos
  let appointment = null
  if (appointmentId) {
    const { data } = await supabase.from('appointments').select('*').eq('id', appointmentId).single()
    appointment = data
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Nueva consulta
        </h2>
        <p className="text-sm text-[#64748B] mt-0.5">
          {patient?.first_name} {patient?.last_name}
        </p>
      </div>
      <NuevaConsultaForm
        patient={patient}
        profile={profile}
        appointmentId={appointmentId ?? null}
        defaultSpecialty={appointment?.specialty ?? profile?.specialty ?? ''}
        defaultReason={appointment?.reason ?? ''}
      />
    </div>
  )
}
