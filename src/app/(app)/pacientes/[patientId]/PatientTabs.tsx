'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function PatientTabs({ patientId }: { patientId: string }) {
  const pathname = usePathname()
  const base = `/pacientes/${patientId}`

  const tabs = [
    { href: `${base}/historia`,  label: 'Historia clínica' },
    { href: `${base}/consultas`, label: 'Consultas' },
    { href: `${base}/estudios`,  label: 'Estudios' },
    { href: `${base}/turnos`,    label: 'Turnos' },
  ]

  return (
    <div className="flex gap-1 border-b border-[#E2E8F0]">
      {tabs.map(tab => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              active
                ? 'border-[#1B3A6B] text-[#1B3A6B]'
                : 'border-transparent text-[#64748B] hover:text-[#334155]'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
