import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PatientsTable, PatientRow } from '@/components/ui/patients-table'

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('patients')
    .select('id, first_name, last_name, dni, birth_date, phone, email, obras_sociales(name)')
    .is('deleted_at', null)
    .order('last_name')
    .limit(100)

  if (q && q.length >= 2) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,dni.ilike.%${q}%`)
  }

  const { data: patients } = await query

  const rows: PatientRow[] = (patients ?? []).map((p: any) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    dni: p.dni ?? null,
    birth_date: p.birth_date ?? null,
    phone: p.phone ?? null,
    email: p.email ?? null,
    obra_social: p.obras_sociales?.name ?? null,
  }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Pacientes
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">{rows.length} resultado{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/pacientes/nuevo">
          <Button className="bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white text-sm">
            + Nuevo paciente
          </Button>
        </Link>
      </div>

      {/* Búsqueda */}
      <form method="get">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, apellido o DNI..."
            className="w-full text-sm border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#0891B2] focus:border-transparent"
          />
        </div>
      </form>

      <PatientsTable patients={rows} searchQuery={q} />
    </div>
  )
}
