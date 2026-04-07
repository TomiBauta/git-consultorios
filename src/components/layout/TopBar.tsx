'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sun, Moon, Bell, HelpCircle, Search, ChevronLeft, Menu } from 'lucide-react'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

const ROOT_PATHS = ['/dashboard', '/agenda', '/pacientes', '/whatsapp', '/configuracion']

export default function TopBar({
  profile,
  onMenuOpen,
}: {
  profile: Profile
  onMenuOpen?: () => void
}) {
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
      className="h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between shrink-0 transition-colors sticky top-0 z-40"
      style={{
        background: 'rgba(var(--surface-container-lowest-rgb, 255,255,255), 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0px 1px 0px var(--outline-variant)',
      }}
    >
      {/* Left: hamburger (mobile) + back button + search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">

        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden p-2 rounded flex items-center justify-center hover:opacity-70 transition-opacity shrink-0"
          style={{ color: 'var(--on-surface-variant)' }}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Back button — sub-routes only */}
        {isSubRoute && (
          <button
            onClick={() => router.back()}
            className="hidden sm:flex items-center gap-1.5 mr-2 px-3 py-2 rounded transition-all hover:opacity-70 shrink-0"
            style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
            aria-label="Volver"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-xs font-bold">Volver</span>
          </button>
        )}

        {/* Search — hidden on smallest screens */}
        <form onSubmit={handleSearch} className="relative hidden sm:block w-full max-w-xs lg:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--on-surface-variant)' }} />
          <input
            name="q"
            placeholder="Buscar pacientes..."
            className="w-full rounded-full pl-10 pr-4 py-2 text-sm border-none outline-none focus:ring-2 transition-all"
            style={{
              background: 'var(--surface-container-low)',
              color: 'var(--on-surface)',
            }}
          />
        </form>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">

        {/* Notifications */}
        <button
          className="relative p-2 rounded transition-colors"
          style={{ color: 'var(--on-surface-variant)' }}
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#0c6780] rounded-full ring-2 ring-white dark:ring-[#0e1420]" />
        </button>

        {/* Help — hidden on small screens */}
        <button
          className="hidden md:flex p-2 rounded transition-colors"
          style={{ color: 'var(--on-surface-variant)' }}
          aria-label="Ayuda"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded transition-colors"
            style={{ color: 'var(--on-surface-variant)' }}
            aria-label="Cambiar tema"
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>
        )}

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px" style={{ background: 'var(--outline-variant)' }} />

        {/* User */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold leading-tight" style={{ color: 'var(--primary-val)' }}>
              {profile.full_name}
            </p>
            <p className="text-[10px] font-medium capitalize" style={{ color: 'var(--on-surface-variant)' }}>
              {roleLabel[profile.role] ?? profile.role}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors hover:border-[#0c6780]"
            style={{
              background: 'var(--primary-container-val)',
              color: '#ffffff',
              borderColor: 'rgba(0,35,102,0.3)',
            }}
            title="Cerrar sesión"
          >
            {profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </button>
        </div>
      </div>
    </header>
  )
}
