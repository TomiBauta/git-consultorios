import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sacar turno · DIT Consultorios Médicos',
  description: 'Reservá tu turno online en DIT Consultorios. Oftalmología, Gastroenterología, Diabetología y Clínica Médica en Buenos Aires.',
}

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface, #f7f9fb)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-6 lg:px-12"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 1px 0 rgba(68,71,79,0.08)',
        }}
      >
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/reservar" className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 rounded flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)' }}
            >
              DIT
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold" style={{ color: 'var(--primary-val, #00113a)' }}>DIT Consultorios</p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>Reserva de turnos online</p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: 'Especialidades', href: '/reservar' },
              { label: 'Cómo funciona', href: '/reservar#como-funciona' },
              { label: 'Contacto', href: '/reservar#contacto' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-bold transition-all hover:opacity-85"
            style={{
              background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)',
              color: '#ffffff',
            }}
          >
            Ingresar
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="mt-16 border-t"
        style={{
          borderColor: 'var(--outline-variant, rgba(61,74,92,0.15))',
          background: 'var(--surface-container-lowest, #ffffff)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: '#00113a' }}
            >
              DIT
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--primary-val, #00113a)' }}>DIT Consultorios Médicos</p>
              <p className="text-xs" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>Buenos Aires, Argentina</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
            © {new Date().getFullYear()} DIT Consultorios · Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
