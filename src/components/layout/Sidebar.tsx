'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  Stethoscope,
  PlusCircle,
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
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = navItems.filter(item => item.roles.includes(profile.role))
  const initials = profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')

  return (
    <aside
      className={cn(
        'flex flex-col shrink-0 transition-all duration-300 ease-in-out',
        'bg-[#002453] dark:bg-[#080f1e]',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 shrink-0 overflow-hidden',
        collapsed ? 'justify-center px-0 py-8' : 'px-5 py-8'
      )}>
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Stethoscope className="w-5 h-5 text-[#a3f69c]" />
        </div>
        <div className={cn('min-w-0 transition-all duration-200', collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto')}>
          <p className="text-white font-bold text-[17px] leading-tight whitespace-nowrap tracking-tight">
            DIT Consultorios
          </p>
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold whitespace-nowrap mt-0.5">
            Clinical Authority
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-hidden">
        {visibleItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const { Icon } = item
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-4 rounded-lg font-medium transition-all duration-150 group relative',
                'text-sm',
                collapsed ? 'justify-center w-10 h-10 mx-auto' : 'py-3 px-4',
                active
                  ? 'bg-white/5 text-[#a3f69c] border-r-4 border-[#a3f69c]'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className={cn('shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
              <span className={cn(
                'whitespace-nowrap transition-all duration-200 overflow-hidden',
                collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              )}>
                {item.label}
              </span>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-[#080f1e] text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-50">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Nueva Cita CTA */}
      {!collapsed && (
        <div className="px-3 mt-6">
          <button
            onClick={() => router.push('/agenda/nuevo')}
            className="w-full text-[#a3f69c] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            style={{ background: 'linear-gradient(135deg, #002453 0%, #1e3a6a 100%)', border: '1px solid rgba(163,246,156,0.2)' }}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="text-sm">Nueva Cita</span>
          </button>
        </div>
      )}

      {/* Specialty badge */}
      {!collapsed && profile.role === 'doctor' && profile.specialty && (
        <div className="px-4 mt-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#a3f69c]/10 text-[#a3f69c] text-[11px] font-medium capitalize tracking-wide">
            {profile.specialty.replace('_', ' ')}
          </div>
        </div>
      )}

      {/* User info */}
      <div className={cn(
        'flex items-center gap-3 overflow-hidden transition-all duration-200 mx-3 mt-4 mb-3 rounded-xl p-2.5 bg-white/6',
        collapsed ? 'justify-center' : ''
      )}>
        <div className="w-8 h-8 rounded-full bg-[#1e3a6a] border border-[#a3f69c]/30 flex items-center justify-center text-[#a3f69c] text-[11px] font-bold shrink-0">
          {initials}
        </div>
        <div className={cn(
          'min-w-0 flex-1 transition-all duration-200',
          collapsed ? 'opacity-0 w-0' : 'opacity-100'
        )}>
          <p className="text-white text-[12px] font-bold truncate leading-tight">{profile.full_name}</p>
          <p className="text-white/40 text-[11px] capitalize mt-0.5">{profile.role}</p>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="mx-3 mb-3 flex items-center justify-center rounded-xl py-2 text-white/30 hover:text-white/60 hover:bg-white/6 transition-all duration-200 gap-1.5 text-[11px]"
        aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4" />
          : <><ChevronLeft className="w-4 h-4" /><span className="whitespace-nowrap overflow-hidden">Contraer</span></>
        }
      </button>
    </aside>
  )
}
