import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología',
  gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología',
  clinica_medica: 'Clínica Médica',
}

const SPECIALTY_DESC: Record<string, string> = {
  oftalmologia: 'Especialistas en salud visual y enfermedades oculares',
  gastroenterologia: 'Expertos en sistema digestivo y enfermedades hepáticas',
  diabetologia: 'Especialistas en diabetes, tiroides y metabolismo',
  clinica_medica: 'Medicina general, preventiva y seguimiento de salud',
}

export default async function SelectDoctorPage({ params }: { params: Promise<{ specialty: string }> }) {
  const { specialty } = await params

  if (!SPECIALTY_LABELS[specialty]) notFound()

  const supabase = await createClient()
  const { data: doctors } = await supabase
    .from('profiles')
    .select('id, full_name, specialty')
    .eq('role', 'doctor')
    .eq('specialty', specialty)
    .eq('is_active', true)
    .order('full_name')

  function getInitials(name: string) {
    return name
      .split(' ')
      .filter(w => !['Dr.', 'Dra.'].includes(w))
      .slice(0, 2)
      .map(w => w[0])
      .join('')
  }

  return (
    <div className="space-y-8">
      {/* Back + Breadcrumb */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/reservar"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-sm font-bold transition-all hover:opacity-80 shrink-0"
          style={{ background: 'var(--surface-container-low, #f2f4f6)', color: 'var(--primary-val, #00113a)' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 3L5 8l5 5" />
          </svg>
          Volver
        </Link>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
          <Link href="/reservar" className="hover:opacity-70 transition-opacity">Especialidades</Link>
          <span>›</span>
          <span className="font-semibold" style={{ color: 'var(--primary-val, #00113a)' }}>{SPECIALTY_LABELS[specialty]}</span>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: 'var(--secondary-container-val, #cce8f0)', color: 'var(--secondary-val, #0c6780)' }}
        >
          {SPECIALTY_LABELS[specialty]}
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--primary-val, #00113a)' }}>
          Elegí tu Profesional
        </h1>
        <p style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
          {SPECIALTY_DESC[specialty]} · {doctors?.length ?? 0} profesional{(doctors?.length ?? 0) !== 1 ? 'es' : ''} disponible{(doctors?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Doctor grid */}
      {!doctors || doctors.length === 0 ? (
        <div
          className="rounded p-16 text-center space-y-3"
          style={{
            background: 'var(--surface-container-lowest, #ffffff)',
            boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
            border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
          }}
        >
          <p className="text-5xl">😔</p>
          <p className="font-semibold" style={{ color: 'var(--primary-val, #00113a)' }}>Sin profesionales disponibles</p>
          <p className="text-sm" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
            No hay médicos activos en esta especialidad por el momento.
          </p>
          <Link
            href="/reservar"
            className="inline-flex items-center gap-1 text-sm font-semibold mt-2 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--secondary-val, #0c6780)' }}
          >
            ← Volver a especialidades
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {doctors.map(doctor => (
            <Link key={doctor.id} href={`/reservar/${specialty}/${doctor.id}`} className="group block">
              <div
                className="rounded overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg h-full flex flex-col"
                style={{
                  background: 'var(--surface-container-lowest, #ffffff)',
                  boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
                  border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
                }}
              >
                {/* Avatar band */}
                <div
                  className="h-36 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 60%, #0c6780 100%)' }}
                >
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4"
                    style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }}
                  >
                    {getInitials(doctor.full_name)}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div>
                    <p className="font-bold text-base" style={{ color: 'var(--primary-val, #00113a)' }}>
                      {doctor.full_name}
                    </p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--secondary-val, #0c6780)' }}>
                      {SPECIALTY_LABELS[doctor.specialty ?? '']}
                    </p>
                  </div>

                  {/* Credentials */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--secondary-val, #0c6780)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9a3 3 0 100-6 3 3 0 000 6zM2 14s-1-1 1-4c2-3 5-3 5-3s3 0 5 3c2 3 1 4 1 4H2z" />
                      </svg>
                      DIT Consultorios · Buenos Aires
                    </div>
                  </div>

                  {/* Availability badge */}
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit"
                    style={{ background: 'var(--secondary-container-val, #cce8f0)', color: 'var(--secondary-val, #0c6780)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    Turnos disponibles
                  </div>

                  {/* CTA */}
                  <div className="mt-auto pt-2">
                    <div
                      className="w-full py-2.5 rounded text-sm font-bold text-center transition-all group-hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)', color: '#ffffff' }}
                    >
                      Ver turnos disponibles
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Help card */}
      <div
        className="rounded p-6 flex items-center gap-5"
        style={{
          background: 'var(--secondary-container-val, #cce8f0)',
          border: '1px solid rgba(12,103,128,0.2)',
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--secondary-val, #0c6780)', color: '#fff' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: 'var(--primary-val, #00113a)' }}>¿Necesitás ayuda para elegir?</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--secondary-val, #0c6780)' }}>
            Escribinos por WhatsApp y te orientamos con la especialidad indicada.
          </p>
        </div>
      </div>
    </div>
  )
}
