'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',      Icon: LayoutDashboard, roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/agenda',         label: 'Agenda',          Icon: Calendar,         roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/pacientes',      label: 'Pacientes',       Icon: Users,            roles: ['admin', 'doctor', 'receptionist'] },
  { href: '/whatsapp',       label: 'WhatsApp',        Icon: MessageSquare,    roles: ['admin'] },
  { href: '/configuracion',  label: 'Configuración',   Icon: Settings,         roles: ['admin'] },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = navItems.filter(item => item.roles.includes(profile.role))
  const initials = profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')

  return (
    <aside
      className={cn(
        'bg-[#1B3A6B] dark:bg-[#0D1E3A] flex flex-col shrink-0 transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 border-b border-white/10 flex items-center gap-3 shrink-0 overflow-hidden',
        collapsed ? 'justify-center px-0' : 'px-4'
      )}>
        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
          DIT
        </div>
        <div className={cn('min-w-0 transition-all duration-200', collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto')}>
          <p className="text-white font-semibold text-sm leading-tight whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif' }}>
            DIT Consultorios
          </p>
          <p className="text-white/50 text-xs whitespace-nowrap">Sistema médico</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-hidden">
        {visibleItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const { Icon } = item
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                collapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              {/* Circular active indicator in collapsed mode */}
              {collapsed && active && (
                <span className="absolute inset-0 rounded-xl bg-white/15" />
              )}
              <Icon className={cn('shrink-0 transition-all duration-200', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              <span className={cn(
                'whitespace-nowrap transition-all duration-200 overflow-hidden',
                collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}>
                {item.label}
              </span>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#0D1E3A] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Specialty badge */}
      {!collapsed && profile.role === 'doctor' && profile.specialty && (
        <div className="px-4 pb-2">
          <div className="px-3 py-2 rounded-xl bg-white/8 text-white/70 text-xs capitalize">
            {profile.specialty.replace('_', ' ')}
          </div>
        </div>
      )}

      {/* User info */}
      <div className={cn(
        'border-t border-white/10 flex items-center gap-3 overflow-hidden transition-all duration-200',
        collapsed ? 'justify-center p-3' : 'px-4 py-3'
      )}>
        <div className="w-8 h-8 rounded-full bg-[#0891B2] flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className={cn(
          'min-w-0 flex-1 transition-all duration-200',
          collapsed ? 'opacity-0 w-0' : 'opacity-100'
        )}>
          <p className="text-white text-xs font-medium truncate">{profile.full_name}</p>
          <p className="text-white/50 text-xs capitalize">{profile.role}</p>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className={cn(
          'mx-3 mb-3 flex items-center justify-center rounded-xl py-2 text-white/40 hover:text-white/80 hover:bg-white/8 transition-all duration-200 text-xs gap-1.5',
        )}
        aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4" />
          : <><ChevronLeft className="w-4 h-4" /><span className="overflow-hidden whitespace-nowrap" style={{ fontSize: '11px' }}>Contraer</span></>
        }
      </button>
    </aside>
  )
}
