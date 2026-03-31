import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('patients')
    .select('id, first_name, last_name, dni, birth_date, phone, obras_sociales(name)')
    .is('deleted_at', null)
    .order('last_name')
    .limit(50)

  if (q && q.length >= 2) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,dni.ilike.%${q}%`)
  }

  const { data: patients } = await query

  function calcAge(birthDate: string | null) {
    if (!birthDate) return null
    const diff = Date.now() - new Date(birthDate).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Pacientes
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">{patients?.length ?? 0} resultados</p>
        </div>
        <Link href="/pacientes/nuevo">
          <Button className="bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white text-sm">
            + Nuevo paciente
          </Button>
        </Link>
      </div>

      {/* Búsqueda */}
      <form method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre, apellido o DNI..."
          className="w-full text-sm border border-[#E2E8F0] rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2] focus:border-transparent"
        />
      </form>

      {/* Lista */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        {!patients || patients.length === 0 ? (
          <div className="text-center py-14 text-[#94A3B8]">
            <p className="text-4xl mb-3">👤</p>
            <p className="text-sm">{q ? 'No se encontraron pacientes' : 'No hay pacientes cargados'}</p>
            {!q && (
              <Link href="/pacientes/nuevo" className="text-sm text-[#0891B2] hover:underline mt-2 inline-block">
                Agregar el primero
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F5F9]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Paciente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">DNI</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Edad</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Obra social</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#94A3B8] uppercase tracking-wide">Teléfono</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {patients.map((p: any) => (
                <tr key={p.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/pacientes/${p.id}/historia`} className="font-medium text-sm text-[#0F172A] hover:text-[#0891B2]">
                      {p.last_name}, {p.first_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">{p.dni ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">
                    {calcAge(p.birth_date) !== null ? `${calcAge(p.birth_date)} años` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">
                    {(p.obras_sociales as any)?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">{p.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/pacientes/${p.id}/historia`} className="text-sm text-[#0891B2] hover:underline">
                      Ver HC →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
