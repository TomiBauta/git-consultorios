'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Availability = { start_time: string; end_time: string; slot_duration: number }

function generateSlots(date: string, availability: Availability[]): string[] {
  const slots: string[] = []
  for (const avail of availability) {
    const [sh, sm] = avail.start_time.split(':').map(Number)
    const [eh, em] = avail.end_time.split(':').map(Number)
    const slotMins = avail.slot_duration
    for (let mins = sh * 60 + sm; mins < eh * 60 + em; mins += slotMins) {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      const iso = `${date}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`
      slots.push(iso)
    }
  }
  return slots
}

function fmtTime(iso: string) {
  return new Date(iso + (iso.endsWith('Z') ? '' : '')).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
}

function normalizeSlot(iso: string) {
  return iso.replace(/:\d\d(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/, ':00')
}

function fmtDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export default function SlotPicker({
  doctorId, date, specialty, doctorName, doctorSpecialtyLabel, availability, initialTakenSlots,
}: {
  doctorId: string; date: string; specialty: string; doctorName: string; doctorSpecialtyLabel: string
  availability: Availability[]; initialTakenSlots: string[]
}) {
  const router = useRouter()
  const supabase = createClient()

  const allSlots = generateSlots(date, availability)
  const [takenSlots, setTakenSlots] = useState<Set<string>>(
    new Set(initialTakenSlots.map(normalizeSlot))
  )
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [step, setStep] = useState<'slots' | 'form' | 'loading' | 'error'>('slots')
  const [errorMsg, setErrorMsg] = useState('')

  const [fullName, setFullName] = useState('')
  const [dni, setDni]           = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [obraSocial, setObraSocial] = useState('')
  const [reason, setReason]     = useState('')
  const [agreed, setAgreed]     = useState(false)

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`slots-${doctorId}-${date}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'appointments',
        filter: `doctor_id=eq.${doctorId}`,
      }, payload => {
        const appt = payload.new as Record<string, unknown>
        const slotDate = (appt.scheduled_at as string)?.split('T')[0]
        if (slotDate === date && appt.status !== 'cancelado') {
          setTakenSlots(prev => new Set([...prev, normalizeSlot(appt.scheduled_at as string)]))
          if (selectedSlot && normalizeSlot(appt.scheduled_at as string) === normalizeSlot(selectedSlot)) {
            setSelectedSlot(null)
            setStep('slots')
            setErrorMsg('Ese turno acaba de ser tomado. Elegí otro horario.')
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'appointments',
        filter: `doctor_id=eq.${doctorId}`,
      }, payload => {
        const appt = payload.new as Record<string, unknown>
        const slotDate = (appt.scheduled_at as string)?.split('T')[0]
        if (slotDate !== date) return
        setTakenSlots(prev => {
          const next = new Set(prev)
          const key = normalizeSlot(appt.scheduled_at as string)
          if (appt.status === 'cancelado') next.delete(key)
          else next.add(key)
          return next
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [doctorId, date, selectedSlot])

  const freeSlots = allSlots.filter(s => !takenSlots.has(normalizeSlot(s)))

  async function handleConfirm() {
    if (!selectedSlot || !fullName.trim() || !phone.trim() || !agreed) return
    setStep('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/booking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctorId,
          scheduled_at: selectedSlot,
          full_name: fullName.trim(),
          dni: dni.trim(),
          email: email.trim(),
          phone: phone.trim(),
          obra_social: obraSocial.trim(),
          reason: reason.trim(),
        }),
      })
      const data = await res.json()

      if (data.ok) {
        router.push(`/reservar/${specialty}/${doctorId}/${date}/confirmado?id=${data.appointment_id}`)
      } else if (data.error === 'slot_taken') {
        setTakenSlots(prev => new Set([...prev, normalizeSlot(selectedSlot)]))
        setSelectedSlot(null)
        setStep('slots')
        setErrorMsg('Ese turno acaba de ser tomado por otro paciente. Elegí otro horario.')
      } else {
        setStep('error')
        setErrorMsg('Ocurrió un error al reservar. Intentá de nuevo.')
      }
    } catch {
      setStep('error')
      setErrorMsg('Error de conexión. Revisá tu internet e intentá de nuevo.')
    }
  }

  function getInitials(name: string) {
    return name.split(' ').filter(w => !['Dr.','Dra.'].includes(w)).slice(0,2).map(w => w[0]).join('')
  }

  if (allSlots.length === 0) {
    return (
      <div
        className="rounded p-16 text-center space-y-4"
        style={{
          background: 'var(--surface-container-lowest, #ffffff)',
          boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
          border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
        }}
      >
        <p className="text-5xl">📅</p>
        <p className="font-bold" style={{ color: 'var(--primary-val, #00113a)' }}>Sin horarios configurados</p>
        <p className="text-sm" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
          No hay horarios disponibles para este día.
        </p>
        <button
          onClick={() => router.back()}
          className="text-sm font-semibold hover:opacity-70 transition-opacity"
          style={{ color: 'var(--secondary-val, #0c6780)' }}
        >
          ← Elegir otra fecha
        </button>
      </div>
    )
  }

  // STEP: Loading
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div
          className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--primary-val, #00113a)', borderTopColor: 'transparent' }}
        />
        <p style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>Reservando tu turno...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-start gap-2 px-4 py-3 rounded text-sm" style={{ background: '#fff1f0', border: '1px solid #ffd6d6', color: '#9b1c1c' }}>
          <span className="shrink-0 text-base">⚠️</span>
          <p>{errorMsg}</p>
        </div>
      )}

      {/* STEP 1: Slots */}
      {(step === 'slots' || step === 'error') && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Slot grid */}
          <div
            className="lg:col-span-3 rounded p-6 space-y-5"
            style={{
              background: 'var(--surface-container-lowest, #ffffff)',
              boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
              border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-sm font-bold transition-all hover:opacity-80 shrink-0"
                style={{ background: 'var(--surface-container-low, #f2f4f6)', color: 'var(--primary-val, #00113a)' }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 3L5 8l5 5" />
                </svg>
                Volver
              </button>
              <div className="flex items-center gap-3 ml-auto">
                <h3 className="font-bold" style={{ color: 'var(--primary-val, #00113a)' }}>
                  Horarios disponibles
                </h3>
                <span className="text-xs font-medium" style={{ color: 'var(--secondary-val, #0c6780)' }}>
                  {freeSlots.length} libre{freeSlots.length !== 1 ? 's' : ''} · Tiempo real
                </span>
              </div>
            </div>

            {freeSlots.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-3xl">📅</p>
                <p className="text-sm" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                  No quedan turnos para este día.
                </p>
                <button
                  onClick={() => router.back()}
                  className="text-sm font-semibold hover:opacity-70"
                  style={{ color: 'var(--secondary-val, #0c6780)' }}
                >
                  ← Elegir otra fecha
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allSlots.map(slot => {
                  const taken = takenSlots.has(normalizeSlot(slot))
                  return (
                    <button
                      key={slot}
                      disabled={taken}
                      onClick={() => { setSelectedSlot(slot); setStep('form'); setErrorMsg('') }}
                      className="py-3 rounded text-sm font-semibold transition-all"
                      style={
                        taken
                          ? {
                              background: 'var(--surface-container-low, #f2f4f6)',
                              color: 'var(--on-surface-variant, #3d4a5c)',
                              opacity: 0.4,
                              cursor: 'not-allowed',
                              textDecoration: 'line-through',
                            }
                          : {
                              background: 'var(--secondary-container-val, #cce8f0)',
                              color: 'var(--secondary-val, #0c6780)',
                              border: '1px solid rgba(12,103,128,0.2)',
                              cursor: 'pointer',
                            }
                      }
                    >
                      {fmtTime(slot)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Summary card */}
          <div
            className="lg:col-span-2 rounded p-6 flex flex-col gap-4"
            style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Resumen de reserva
            </p>

            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                {getInitials(doctorName)}
              </div>
              <div>
                <p className="font-bold text-white">{doctorName}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{doctorSpecialtyLabel}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Fecha</p>
                  <p className="text-sm font-semibold capitalize" style={{ color: 'rgba(255,255,255,0.9)' }}>{fmtDate(date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Horario</p>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {selectedSlot ? fmtTime(selectedSlot) : 'Seleccioná un horario'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs mt-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Seleccioná un horario disponible para continuar con la reserva.
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: Form */}
      {step === 'form' && selectedSlot && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Patient form */}
          <div
            className="lg:col-span-3 rounded p-6 space-y-5"
            style={{
              background: 'var(--surface-container-lowest, #ffffff)',
              boxShadow: '0px 8px 32px rgba(0, 17, 58, 0.04)',
              border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: 'var(--primary-val, #00113a)' }}>
                Tus datos
              </h3>
              <button
                onClick={() => { setSelectedSlot(null); setStep('slots') }}
                className="text-xs font-semibold hover:opacity-70 transition-opacity"
                style={{ color: 'var(--secondary-val, #0c6780)' }}
              >
                ← Cambiar horario
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                  Nombre completo <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div className="login-tray rounded px-4 py-3">
                  <input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ej: María González"
                    autoComplete="name"
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: 'var(--on-surface, #00113a)' }}
                  />
                </div>
              </div>

              {/* DNI */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                  DNI
                </label>
                <div className="login-tray rounded px-4 py-3">
                  <input
                    value={dni}
                    onChange={e => setDni(e.target.value)}
                    placeholder="12345678"
                    inputMode="numeric"
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: 'var(--on-surface, #00113a)' }}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                  Teléfono / WhatsApp <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div className="login-tray rounded px-4 py-3">
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+54 9 11 ..."
                    inputMode="tel"
                    autoComplete="tel"
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: 'var(--on-surface, #00113a)' }}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                  Email
                </label>
                <div className="login-tray rounded px-4 py-3">
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    type="email"
                    autoComplete="email"
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: 'var(--on-surface, #00113a)' }}
                  />
                </div>
              </div>

              {/* Obra social */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                  Obra social
                </label>
                <div className="login-tray rounded px-4 py-3">
                  <select
                    value={obraSocial}
                    onChange={e => setObraSocial(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: obraSocial ? 'var(--on-surface, #00113a)' : 'var(--on-surface-variant, #3d4a5c)' }}
                  >
                    <option value="">Seleccioná</option>
                    <option value="OSDE">OSDE</option>
                    <option value="Swiss Medical">Swiss Medical</option>
                    <option value="Galeno">Galeno</option>
                    <option value="IOMA">IOMA</option>
                    <option value="Medicus">Medicus</option>
                    <option value="Particular">Particular</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                  Motivo de consulta <span className="font-normal normal-case" style={{ color: 'var(--on-surface-variant)' }}>(opcional)</span>
                </label>
                <div className="login-tray rounded px-4 py-3">
                  <input
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Ej: Control anual, dolor de estómago..."
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: 'var(--on-surface, #00113a)' }}
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-current shrink-0"
                style={{ accentColor: 'var(--primary-val, #00113a)' }}
              />
              <span className="text-xs" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                Acepto que mis datos se usen para la gestión de mi turno médico según la política de privacidad de DIT Consultorios.
              </span>
            </label>
          </div>

          {/* Appointment summary sidebar */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="rounded p-6 flex flex-col gap-5"
              style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Tu turno
              </p>

              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
                >
                  {getInitials(doctorName)}
                </div>
                <div>
                  <p className="font-bold text-white">{doctorName}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{doctorSpecialtyLabel}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {[
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ),
                    label: 'Fecha',
                    value: fmtDate(date),
                    capitalize: true,
                  },
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                        <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
                      </svg>
                    ),
                    label: 'Horario',
                    value: `${fmtTime(selectedSlot)} hs`,
                    capitalize: false,
                  },
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><circle cx="12" cy="11" r="3" />
                      </svg>
                    ),
                    label: 'Lugar',
                    value: 'DIT Consultorios · Buenos Aires',
                    capitalize: false,
                  },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</p>
                      <p className={`text-sm font-semibold ${item.capitalize ? 'capitalize' : ''}`} style={{ color: 'rgba(255,255,255,0.9)' }}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirm CTA */}
              <button
                onClick={handleConfirm}
                disabled={!fullName.trim() || !phone.trim() || !agreed}
                className="w-full py-3 rounded text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                style={{ background: 'var(--secondary-val, #0c6780)', color: '#ffffff' }}
              >
                Confirmar Turno
              </button>

              <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Al confirmar aceptás los términos indicados en el formulario.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
