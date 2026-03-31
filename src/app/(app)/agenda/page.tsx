import { createClient } from '@/lib/supabase/server'
import AgendaClient from './AgendaClient'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  // Traer médicos para el filtro (todos los roles ven el selector)
  const { data: doctors } = await supabase
    .from('profiles')
    .select('id, full_name, specialty')
    .eq('role', 'doctor')
    .eq('is_active', true)
    .order('full_name')

  return <AgendaClient profile={profile} doctors={doctors ?? []} />
}
