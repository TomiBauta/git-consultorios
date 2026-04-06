'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
    /* Tonal separation — ambient shadow instead of hard border (no-line rule) */
    <header
      className="h-14 px-6 flex items-center justify-between shrink-0 transition-colors"
      style={{
        background: 'var(--surface-container-lowest, #ffffff)',
        boxShadow: '0px 1px 0px rgba(68, 71, 79, 0.08)',
      }}
    >
      <p
        className="text-sm capitalize"
        style={{ color: 'var(--on-surface-variant, #44474f)' }}
      >
        {dateStr}
      </p>

      <div className="flex items-center gap-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--on-surface, #1a1b1f)' }}
        >
          {profile.full_name}
        </span>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-[#f4f3f8] dark:hover:bg-white/8"
            style={{ color: 'var(--on-surface-variant, #44474f)' }}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}

        <button
          onClick={handleSignOut}
          className="text-sm px-3 py-1.5 rounded-xl transition-colors hover:bg-[#f4f3f8] dark:hover:bg-white/8"
          style={{ color: 'var(--on-surface-variant, #44474f)' }}
        >
          Salir
        </button>
      </div>
    </header>
  )
}
