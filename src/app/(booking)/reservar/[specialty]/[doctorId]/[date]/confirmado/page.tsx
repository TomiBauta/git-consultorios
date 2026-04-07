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

  return (
    <div className="space-y-6">
      {/* Success card */}
      <div className="bg-white dark:bg-[#1a2235] border border-[#E2E8F0] rounded p-8 text-center space-y-4">
        {/* Check icon */}
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            ¡Turno confirmado!
          </h1>
          <p className="text-[#64748B]">Tu turno fue reservado exitosamente.</p>
        </div>
      </div>

      {/* Appointment details */}
      {appointment ? (
        <div className="bg-white dark:bg-[#1a2235] border border-[#E2E8F0] rounded p-6 space-y-4">
          <h2 className="font-semibold text-[#0F172A]">Detalle del turno</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#1B3A6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide font-medium">Médico</p>
                <p className="text-sm font-semibold text-[#0F172A]">{appointment.doctor?.full_name ?? '—'}</p>
                <p className="text-xs text-[#64748B]">{SPECIALTY_LABELS[appointment.doctor?.specialty ?? ''] ?? SPECIALTY_LABELS[specialty] ?? specialty}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#1B3A6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide font-medium">Fecha y hora</p>
                <p className="text-sm font-semibold text-[#0F172A] capitalize">{formattedDate}</p>
                <p className="text-xs text-[#64748B]">{formattedTime} hs</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-[#1B3A6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8] uppercase tracking-wide font-medium">Paciente</p>
                <p className="text-sm font-semibold text-[#0F172A]">{appointment.full_name}</p>
              </div>
            </div>
          </div>

          {/* Appointment ID */}
          <div className="pt-3 border-t border-[#F1F5F9]">
            <p className="text-xs text-[#94A3B8] text-center">
              N° de turno: <span className="font-mono text-[#64748B]">{appointment.id.slice(0, 8).toUpperCase()}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1a2235] border border-[#E2E8F0] rounded p-6 text-center">
          <p className="text-sm text-[#64748B]">Tu turno fue registrado correctamente.</p>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded px-4 py-3 text-sm text-green-800 space-y-1">
        <p className="font-medium">¿Necesitás cancelar o modificar tu turno?</p>
        <p className="text-green-700 text-xs">Llamanos al consultorio o escribinos por WhatsApp con anticipación.</p>
      </div>

      <Link
        href="/reservar"
        className="block w-full text-center py-3 px-4 border-2 border-[#BFDBFE] rounded text-sm font-medium text-[#1B3A6B] hover:bg-[#EFF6FF] transition-colors"
      >
        ← Volver al inicio
      </Link>
    </div>
  )
}
