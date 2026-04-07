'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function normalizeSlot(iso: string) {
  // Normalizar a segundos=0 para comparación
  return iso.replace(/:\d\d(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/, ':00')
}

export default function SlotPicker({
  doctorId, date, specialty, doctorName, availability, initialTakenSlots,
}: {
  doctorId: string; date: string; specialty: string; doctorName: string
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

  // Formulario
  const [fullName, setFullName] = useState('')
  const [dni, setDni]           = useState('')
  const [phone, setPhone]       = useState('')
  const [reason, setReason]     = useState('')

  // Realtime: suscripción a nuevos turnos para este médico y fecha
  useEffect(() => {
    const channel = supabase
      .channel(`slots-${doctorId}-${date}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'appointments',
        filter: `doctor_id=eq.${doctorId}`,
      }, payload => {
        const appt = payload.new as any
        const slotDate = appt.scheduled_at?.split('T')[0]
        if (slotDate === date && appt.status !== 'cancelado') {
          setTakenSlots(prev => new Set([...prev, normalizeSlot(appt.scheduled_at)]))
          // Si alguien tomó el slot que el usuario tenía seleccionado
          if (selectedSlot && normalizeSlot(appt.scheduled_at) === normalizeSlot(selectedSlot)) {
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
        const appt = payload.new as any
        const slotDate = appt.scheduled_at?.split('T')[0]
        if (slotDate !== date) return
        setTakenSlots(prev => {
          const next = new Set(prev)
          const key = normalizeSlot(appt.scheduled_at)
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
    if (!selectedSlot || !fullName.trim() || !phone.trim()) return
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
          phone: phone.trim(),
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

  if (allSlots.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded text-center py-12 space-y-3">
        <p className="text-3xl">😔</p>
        <p className="text-[#64748B]">No hay horarios configurados para este día.</p>
        <button onClick={() => router.back()} className="text-sm text-[#0891B2] hover:underline">
          ← Elegir otra fecha
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <span className="shrink-0">⚠️</span>
          <p>{errorMsg}</p>
        </div>
      )}

      {/* STEP 1: Grilla de slots */}
      {(step === 'slots' || step === 'error') && (
        <div className="space-y-4">
          {freeSlots.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded text-center py-12 space-y-3">
              <p className="text-3xl">📅</p>
              <p className="text-[#64748B]">No quedan turnos disponibles para este día.</p>
              <button onClick={() => router.back()} className="text-sm text-[#0891B2] hover:underline">
                ← Elegir otra fecha
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#64748B] text-center">
                {freeSlots.length} turno{freeSlots.length !== 1 ? 's' : ''} disponible{freeSlots.length !== 1 ? 's' : ''}
                <span className="text-xs text-[#0891B2] ml-2">· Se actualiza en tiempo real</span>
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {allSlots.map(slot => {
                  const taken = takenSlots.has(normalizeSlot(slot))
                  const selected = selectedSlot === slot
                  return (
                    <button
                      key={slot}
                      disabled={taken}
                      onClick={() => { setSelectedSlot(slot); setStep('form'); setErrorMsg('') }}
                      className={[
                        'py-3 rounded text-sm font-medium transition-all border-2',
                        taken
                          ? 'bg-[#F8FAFC] text-[#CBD5E1] border-transparent cursor-not-allowed line-through'
                          : selected
                          ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                          : 'bg-white text-[#1B3A6B] border-[#BFDBFE] hover:border-[#1B3A6B] hover:bg-[#EFF6FF]',
                      ].join(' ')}
                    >
                      {fmtTime(slot)}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 2: Formulario de paciente */}
      {step === 'form' && selectedSlot && (
        <div className="space-y-4">
          {/* Slot seleccionado */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#EFF6FF] border-2 border-[#BFDBFE] rounded">
            <div>
              <p className="text-sm font-semibold text-[#1B3A6B]">Turno seleccionado</p>
              <p className="text-sm text-[#64748B]">{fmtTime(selectedSlot)} · {doctorName}</p>
            </div>
            <button
              onClick={() => { setSelectedSlot(null); setStep('slots') }}
              className="text-xs text-[#64748B] hover:text-[#1B3A6B] underline"
            >
              Cambiar
            </button>
          </div>

          {/* Datos del paciente */}
          <div className="bg-white border border-[#E2E8F0] rounded p-5 space-y-4">
            <h3 className="font-semibold text-[#0F172A]">Tus datos</h3>

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo <span className="text-red-500">*</span></Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ej: María González"
                autoComplete="name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={dni}
                  onChange={e => setDni(e.target.value)}
                  placeholder="12345678"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono / WhatsApp <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  inputMode="tel"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Motivo de consulta <span className="text-[#94A3B8] font-normal">(opcional)</span></Label>
              <Input
                id="reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ej: Control anual, dolor de estómago..."
              />
            </div>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={!fullName.trim() || !phone.trim()}
            className="w-full bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white h-12 text-base rounded"
          >
            Confirmar turno
          </Button>

          <p className="text-xs text-center text-[#94A3B8]">
            Al confirmar aceptás que tus datos se usen para gestionar tu turno médico.
          </p>
        </div>
      )}

      {/* STEP 3: Loading */}
      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#1B3A6B] border-t-transparent animate-spin" />
          <p className="text-[#64748B]">Reservando tu turno...</p>
        </div>
      )}
    </div>
  )
}
