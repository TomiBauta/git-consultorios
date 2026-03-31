import { createClient } from '@/lib/supabase/server'
import NuevoTurnoForm from './NuevoTurnoForm'

export default async function NuevoTurnoPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; fecha?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const { data: doctors } = await supabase
    .from('profiles')
    .select('id, full_name, specialty')
    .eq('role', 'doctor')
    .eq('is_active', true)
    .order('full_name')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Nuevo turno
        </h1>
        <p className="text-sm text-[#64748B] mt-1">Completá los datos para agendar el turno</p>
      </div>
      <NuevoTurnoForm
        profile={profile}
        doctors={doctors ?? []}
        defaultDoctorId={params.doctor ?? (profile?.role === 'doctor' ? profile.id : '')}
        defaultFecha={params.fecha ?? ''}
      />
    </div>
  )
}
