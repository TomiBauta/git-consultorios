'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function AppShell({
  profile,
  children,
}: {
  profile: Profile
  children: React.ReactNode
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface)' }}>

      {/* ── Mobile overlay ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar — hidden on mobile, drawer when open ── */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-50 lg:relative lg:flex lg:flex-col lg:shrink-0 transition-transform duration-300',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded flex items-center justify-center text-white/60 hover:text-white lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>

        <Sidebar profile={profile} />
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          profile={profile}
          onMenuOpen={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
