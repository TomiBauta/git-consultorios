'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦', roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/agenda', label: 'Agenda', icon: '📅', roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/pacientes', label: 'Pacientes', icon: '👤', roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/whatsapp', label: 'WhatsApp', icon: '💬', roles: ['admin'] },
  { href: '/configuracion', label: 'Configuración', icon: '⚙️', roles: ['admin'] },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(item => item.roles.includes(profile.role))

  return (
    <aside className="w-64 bg-[#1B3A6B] flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm">
            DIT
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
              DIT Consultorios
            </p>
            <p className="text-white/50 text-xs">Sistema médico</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {visibleItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/8 hover:text-white/90'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Especialidad badge */}
      {profile.role === 'doctor' && profile.specialty && (
        <div className="px-4 pb-2">
          <div className="px-3 py-2 rounded-xl bg-white/8 text-white/70 text-xs capitalize">
            {profile.specialty.replace('_', ' ')}
          </div>
        </div>
      )}

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#0891B2] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{profile.full_name}</p>
            <p className="text-white/50 text-xs capitalize">{profile.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
