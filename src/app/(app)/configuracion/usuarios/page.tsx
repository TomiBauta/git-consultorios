import { createClient } from '@/lib/supabase/server'

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', doctor: 'Médico', receptionist: 'Recepcionista' }
const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología', gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología', clinica_medica: 'Clínica Médica',
}

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('role')

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>Usuarios</h1>
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#F1F5F9]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Rol</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Especialidad</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map(p => (
              <tr key={p.id} className="border-b border-[#F8FAFC] last:border-b-0">
                <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">{p.full_name}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#F0F9FF] text-[#0891B2]">
                    {ROLE_LABELS[p.role] ?? p.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[#64748B]">
                  {p.specialty ? SPECIALTY_LABELS[p.specialty] ?? p.specialty : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#94A3B8]">
        Para crear nuevos usuarios, usá el panel de Supabase Authentication o contactá al administrador del sistema.
      </p>
    </div>
  )
}
