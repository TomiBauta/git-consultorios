import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{ color: 'var(--on-surface, #1a1b1f)', letterSpacing: '-0.02em' }}
          >
            Pacientes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--on-surface-variant, #44474f)' }}>
            {rows.length} resultado{rows.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/pacientes/nuevo">
          {/* Primary CTA — gradient per spec */}
          <button className="btn-primary-gradient text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all">
            + Nuevo paciente
          </button>
        </Link>
      </div>

      {/* Búsqueda — Soft Tray: surface-container-high bg + bottom-only focus stroke */}
      <form method="get">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--on-surface-variant, #44474f)' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, apellido o DNI..."
            className="w-full text-sm pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
            style={{
              background: 'var(--surface-container-high, #e6e4ef)',
              color: 'var(--on-surface, #1a1b1f)',
              border: 'none',
              borderBottom: '2px solid transparent',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderBottom = '2px solid var(--primary-val, #002453)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderBottom = '2px solid transparent'
            }}
          />
        </div>
      </form>

      {/* Tabla — tonal surface */}
      <div className="card-ambient rounded-2xl overflow-hidden">
        <PatientsTable patients={rows} searchQuery={q} />
      </div>
    </div>
  )
}
