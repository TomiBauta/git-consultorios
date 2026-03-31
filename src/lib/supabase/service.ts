import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Cliente con service_role — bypasea RLS
// SOLO importar en archivos del servidor (API routes, Server Actions)
export function createServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
