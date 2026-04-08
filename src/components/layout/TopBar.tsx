'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sun, Moon, Bell, HelpCircle, Search, ChevronLeft } from 'lucide-react'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

// Top-level routes — no back button on these
const ROOT_PATHS = ['/dashboard', '/agenda', '/pacientes', '/whatsapp', '/configuracion']

export default function TopBar({ profile }: { profile: Profile }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isSubRoute = !ROOT_PATHS.includes(pathname)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('q') as string
    if (q?.trim()) router.push(`/pacientes?q=${encodeURIComponent(q.trim())}`)
  }

  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    doctor: profile.specialty ? profile.specialty.replace('_', ' ') : 'Médico',
    receptionist: 'Recepcionista',
  }

  return (
    <header
      className="h-16 px-8 flex items-center justify-between shrink-0 transition-colors sticky top-0 z-40"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0px 1px 0px rgba(68,71,79,0.08)',
      }}
    >
      {/* Back button — only on sub-routes */}
      {isSubRoute && (
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 mr-4 px-3 py-2 rounded transition-all hover:opacity-70 shrink-0"
          style={{ background: '#f2f4f6', color: '#00113a' }}
          aria-label="Volver"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs font-bold">Volver</span>
        </button>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="relative w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }} />
        <input
          name="q"
          placeholder="Buscar pacientes o historias clínicas..."
          className="w-full rounded-full pl-10 pr-4 py-2 text-sm border-none outline-none focus:ring-2 transition-all"
          style={{
            background: 'var(--surface-container-low, #f2f4f6)',
            color: 'var(--on-surface, #1a1b1f)',
          }}
        />
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-5">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-full transition-colors hover:bg-[#f2f4f6] dark:hover:bg-white/8"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#0c6780] rounded-full ring-2 ring-white" />
        </button>

        {/* Help */}
        <button
          className="p-2 rounded-full transition-colors hover:bg-[#f2f4f6] dark:hover:bg-white/8"
          aria-label="Ayuda"
        >
          <HelpCircle className="w-5 h-5" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }} />
        </button>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full transition-colors hover:bg-[#f2f4f6] dark:hover:bg-white/8"
            aria-label="Cambiar tema"
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }} />
              : <Moon className="w-4 h-4" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }} />
            }
          </button>
        )}

        {/* Divider */}
        <div className="h-8 w-px bg-[#c4c6d0]/50" />

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--primary-val, #00113a)' }}>
              {profile.full_name}
            </p>
            <p className="text-[10px] font-medium capitalize" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
              {roleLabel[profile.role] ?? profile.role}
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold border-2"
            style={{
              background: '#002366',
              color: '#ffffff',
              borderColor: 'rgba(0,35,102,0.4)',
            }}
          >
            {profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
        </div>
      </div>
    </header>
  )
}
