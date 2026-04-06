'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Sun, Moon } from 'lucide-react'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function TopBar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

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
    <header className="h-16 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-6 flex items-center justify-between shrink-0 transition-colors">
      <p className="text-sm text-[#64748B] dark:text-slate-400 capitalize">{dateStr}</p>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[#334155] dark:text-slate-200">
          {profile.full_name}
        </span>

        {/* Dark mode toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#64748B] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-slate-700 transition-colors"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-[#64748B] dark:text-slate-400 hover:text-[#1B3A6B] dark:hover:text-white"
        >
          Salir
        </Button>
      </div>
    </header>
  )
}
