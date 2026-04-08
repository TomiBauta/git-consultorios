import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología',
  gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología',
  clinica_medica: 'Clínica Médica',
}

export default async function ConfirmadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ specialty: string; doctorId: string; date: string }>
  searchParams: Promise<{ id?: string }>
}) {
  const { specialty } = await params
  const { id } = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let appointment: any = null

  if (id) {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('appointments')
      .select('id, scheduled_at, full_name, phone, doctor:profiles!appointments_doctor_id_fkey(full_name, specialty)')
      .eq('id', id)
      .single()
    appointment = data
  }

  const formattedDate = appointment?.scheduled_at
    ? new Date(appointment.scheduled_at).toLocaleDateString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  const formattedTime = appointment?.scheduled_at
    ? new Date(appointment.scheduled_at).toLocaleTimeString('es-AR', {
        hour: '2-digit', minute: '2-digit',
      })
    : null

  function getInitials(name: string) {
    return name.split(' ').filter((w: string) => !['Dr.','Dra.'].includes(w)).slice(0,2).map((w: string) => w[0]).join('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      {/* Success hero */}
      <div
        className="rounded p-10 text-center space-y-5"
        style={{
          background: 'var(--surface-container-lowest, #ffffff)',
          boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.06)',
          border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
        }}
      >
        {/* Check icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'var(--secondary-container-val, #cce8f0)' }}
        >
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: 'var(--secondary-val, #0c6780)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--primary-val, #00113a)' }}>
            ¡Turno confirmado!
          </h1>
          <p style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
            Tu turno fue reservado exitosamente.
          </p>
        </div>

        {appointment && (
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: 'var(--secondary-container-val, #cce8f0)', color: 'var(--secondary-val, #0c6780)' }}
          >
            N° {appointment.id.slice(0, 8).toUpperCase()}
          </div>
        )}
      </div>

      {/* Appointment details */}
      {appointment ? (
        <div
          className="rounded overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)',
          }}
        >
          {/* Doctor header */}
          <div className="px-6 pt-6 pb-4 flex items-center gap-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              {getInitials(appointment.doctor?.full_name ?? '?')}
            </div>
            <div>
              <p className="font-bold text-white">{appointment.doctor?.full_name ?? '—'}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {SPECIALTY_LABELS[appointment.doctor?.specialty ?? ''] ?? SPECIALTY_LABELS[specialty] ?? specialty}
              </p>
            </div>
          </div>

          {/* Detail rows */}
          <div className="px-6 py-5 space-y-4">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                label: 'Fecha',
                value: formattedDate ?? '—',
                capitalize: true,
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                  </svg>
                ),
                label: 'Hora',
                value: formattedTime ? `${formattedTime} hs` : '—',
                capitalize: false,
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                label: 'Paciente',
                value: appointment.full_name,
                capitalize: false,
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" />
                  </svg>
                ),
                label: 'Lugar',
                value: 'DIT Consultorios · Buenos Aires',
                capitalize: false,
              },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {item.label}
                  </p>
                  <p className={`text-sm font-semibold ${item.capitalize ? 'capitalize' : ''}`} style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="rounded p-6 text-center"
          style={{
            background: 'var(--surface-container-lowest, #ffffff)',
            boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
            border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
            Tu turno fue registrado correctamente.
          </p>
        </div>
      )}

      {/* Info banner */}
      <div
        className="rounded px-5 py-4 space-y-1"
        style={{
          background: 'var(--secondary-container-val, #cce8f0)',
          border: '1px solid rgba(12,103,128,0.2)',
        }}
      >
        <p className="font-bold text-sm" style={{ color: 'var(--primary-val, #00113a)' }}>
          ¿Necesitás cancelar o modificar tu turno?
        </p>
        <p className="text-xs" style={{ color: 'var(--secondary-val, #0c6780)' }}>
          Llamanos al consultorio o escribinos por WhatsApp con suficiente anticipación.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/reservar"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded text-sm font-bold transition-all hover:opacity-85"
          style={{
            background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)',
            color: '#ffffff',
          }}
        >
          Reservar otro turno
        </Link>
        <Link
          href="/"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded text-sm font-bold transition-all hover:opacity-80"
          style={{
            background: 'var(--surface-container-low, #f2f4f6)',
            color: 'var(--primary-val, #00113a)',
          }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
