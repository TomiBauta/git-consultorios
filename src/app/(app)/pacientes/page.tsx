import { createClient } from '@/lib/supabase/server'
import PacientesClient from './PacientesClient'
import type { PatientRow } from './PacientesClient'

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  // Total count (sin filtro de búsqueda)
  const { count: totalCount } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  let query = supabase
    .from('patients')
    .select('id, first_name, last_name, dni, birth_date, phone, email, obras_sociales(name)')
    .is('deleted_at', null)
    .order('last_name')
    .limit(200)

  if (q && q.length >= 2) {
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,dni.ilike.%${q}%`)
  }

  const { data: patients } = await query

  const rows: PatientRow[] = (patients ?? []).map((p: any) => ({
    id:          p.id,
    first_name:  p.first_name,
    last_name:   p.last_name,
    dni:         p.dni ?? null,
    birth_date:  p.birth_date ?? null,
    phone:       p.phone ?? null,
    email:       p.email ?? null,
    obra_social: p.obras_sociales?.name ?? null,
  }))

  return (
    <PacientesClient
      patients={rows}
      totalCount={totalCount ?? rows.length}
    />
  )
}
