import Link from 'next/link'

const SPECIALTIES = [
  {
    slug: 'oftalmologia',
    label: 'Oftalmología',
    desc: 'Ojos, visión y salud ocular',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    slug: 'gastroenterologia',
    label: 'Gastroenterología',
    desc: 'Sistema digestivo y hepático',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    slug: 'diabetologia',
    label: 'Diabetología',
    desc: 'Diabetes, tiroides y metabolismo',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    slug: 'clinica_medica',
    label: 'Clínica Médica',
    desc: 'Medicina general y preventiva',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
]

export default function ReservarPage() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 pt-4">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2"
          style={{ background: 'var(--secondary-container-val, #cce8f0)', color: 'var(--secondary-val, #0c6780)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Turnos disponibles hoy
        </div>
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ color: 'var(--primary-val, #00113a)' }}
        >
          ¿Con qué especialidad<br />querés consultar?
        </h1>
        <p className="text-base max-w-md mx-auto" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
          Seleccioná la especialidad para ver los profesionales disponibles y reservar tu turno en minutos.
        </p>
      </div>

      {/* Specialties grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SPECIALTIES.map(s => (
          <Link key={s.slug} href={`/reservar/${s.slug}`}>
            <div
              className="group flex flex-col gap-4 p-6 rounded transition-all cursor-pointer hover:-translate-y-0.5"
              style={{
                background: 'var(--surface-container-lowest, #ffffff)',
                boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
                border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
              }}
            >
              <div
                className="w-12 h-12 rounded flex items-center justify-center shrink-0 transition-colors group-hover:scale-110"
                style={{
                  background: 'var(--secondary-container-val, #cce8f0)',
                  color: 'var(--secondary-val, #0c6780)',
                  transition: 'all 0.2s',
                }}
              >
                {s.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-base" style={{ color: 'var(--primary-val, #00113a)' }}>{s.label}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>{s.desc}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--secondary-val, #0c6780)' }}>
                Ver profesionales
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Info strip */}
      <div
        className="rounded p-6 flex flex-col sm:flex-row items-center gap-6"
        style={{
          background: 'var(--surface-container-lowest, #ffffff)',
          boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
          border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
        }}
      >
        {[
          { icon: '📅', title: 'Reserva en línea', desc: 'Sin esperar, sin llamar. Elegí tu turno en 3 pasos.' },
          { icon: '✅', title: 'Confirmación inmediata', desc: 'Recibís la confirmación al instante.' },
          { icon: '🔒', title: 'Datos seguros', desc: 'Tu información médica está protegida.' },
        ].map(item => (
          <div key={item.title} className="flex items-center gap-4 flex-1">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--primary-val, #00113a)' }}>{item.title}</p>
              <p className="text-xs" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
