'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function TopBar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0">
      <p className="text-sm text-[#64748B] capitalize">{dateStr}</p>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-[#334155]">
          {profile.full_name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-[#64748B] hover:text-[#1B3A6B]"
        >
          Salir
        </Button>
      </div>
    </header>
  )
}
