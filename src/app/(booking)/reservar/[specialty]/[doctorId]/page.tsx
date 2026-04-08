import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CalendarioDisponible from './CalendarioDisponible'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología',
  gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología',
  clinica_medica: 'Clínica Médica',
}

export default async function SelectDatePage({
  params,
}: {
  params: Promise<{ specialty: string; doctorId: string }>
}) {
  const { specialty, doctorId } = await params
  const supabase = await createClient()

  const { data: doctor } = await supabase
    .from('profiles')
    .select('id, full_name, specialty')
    .eq('id', doctorId)
    .eq('role', 'doctor')
    .eq('is_active', true)
    .single()

  if (!doctor) notFound()

  const { data: availability } = await supabase
    .from('doctor_availability')
    .select('day_of_week, start_time, end_time, slot_duration')
    .eq('doctor_id', doctorId)
    .eq('is_active', true)

  const from = new Date()
  const to = new Date(); to.setDate(to.getDate() + 60)

  const { data: blocks } = await supabase
    .from('doctor_blocks')
    .select('starts_at, ends_at')
    .eq('doctor_id', doctorId)
    .gte('ends_at', from.toISOString())
    .lte('starts_at', to.toISOString())

  const availableDays = [...new Set((availability ?? []).map(a => a.day_of_week))]

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
          href={`/reservar/${specialty}`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-sm font-bold transition-all hover:opacity-80 shrink-0"
          style={{ background: 'var(--surface-container-low, #f2f4f6)', color: 'var(--primary-val, #00113a)' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 3L5 8l5 5" />
          </svg>
          Volver
        </Link>
        <div className="flex items-center gap-2 text-sm flex-wrap" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
          <Link href="/reservar" className="hover:opacity-70 transition-opacity">Especialidades</Link>
          <span>›</span>
          <Link href={`/reservar/${specialty}`} className="hover:opacity-70 transition-opacity">
            {SPECIALTY_LABELS[specialty]}
          </Link>
          <span>›</span>
          <span className="font-semibold" style={{ color: 'var(--primary-val, #00113a)' }}>{doctor.full_name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--primary-val, #00113a)' }}>
              Elegí una fecha
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
              Los días resaltados tienen turnos disponibles. Máximo 60 días a futuro.
            </p>
          </div>

          <CalendarioDisponible
            doctorId={doctorId}
            specialty={specialty}
            availableDays={availableDays}
            blocks={(blocks ?? []).map(b => ({ starts_at: b.starts_at, ends_at: b.ends_at }))}
          />
        </div>

        {/* Right: doctor card */}
        <div className="space-y-4">
          <div
            className="rounded overflow-hidden"
            style={{
              background: 'var(--surface-container-lowest, #ffffff)',
              boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
              border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
            }}
          >
            {/* Avatar band */}
            <div
              className="h-28 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 60%, #0c6780 100%)' }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white border-4"
                style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' }}
              >
                {getInitials(doctor.full_name)}
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="font-bold" style={{ color: 'var(--primary-val, #00113a)' }}>{doctor.full_name}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--secondary-val, #0c6780)' }}>
                  {SPECIALTY_LABELS[doctor.specialty ?? '']}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--secondary-val, #0c6780)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9a3 3 0 100-6 3 3 0 000 6zM2 14s-1-1 1-4c2-3 5-3 5-3s3 0 5 3c2 3 1 4 1 4H2z" />
                </svg>
                DIT Consultorios · Buenos Aires
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'var(--secondary-container-val, #cce8f0)', color: 'var(--secondary-val, #0c6780)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Turnos disponibles
              </div>
            </div>
          </div>

          {/* How-it-works mini */}
          <div
            className="rounded p-4 space-y-3"
            style={{
              background: 'var(--surface-container-lowest, #ffffff)',
              boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
              border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
            }}
          >
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
              Próximos pasos
            </p>
            {[
              { step: '1', label: 'Elegí una fecha en el calendario' },
              { step: '2', label: 'Seleccioná el horario disponible' },
              { step: '3', label: 'Completá tus datos y confirmá' },
            ].map(item => (
              <div key={item.step} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--primary-val, #00113a)', color: '#fff' }}
                >
                  {item.step}
                </div>
                <p className="text-xs" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
