import { createClient } from '@/lib/supabase/server'
import NuevoPacienteForm from './NuevoPacienteForm'

export default async function NuevoPacientePage() {
  const supabase = await createClient()
  const { data: obrasSociales } = await supabase
    .from('obras_sociales')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Nuevo paciente
        </h1>
        <p className="text-sm text-[#64748B] mt-1">Completá los datos del paciente</p>
      </div>
      <NuevoPacienteForm obrasSociales={obrasSociales ?? []} />
    </div>
  )
}
