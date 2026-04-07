'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import StatusBadge from '@/components/agenda/StatusBadge'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología', gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología', clinica_medica: 'Clínica Médica',
}

const NEXT_STATUSES: Record<string, { value: string; label: string; color: string }[]> = {
  pendiente:  [
    { value: 'confirmado', label: 'Confirmar', color: 'bg-green-600 hover:bg-green-700 text-white' },
    { value: 'cancelado',  label: 'Cancelar',  color: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' },
  ],
  confirmado: [
    { value: 'atendido',   label: 'Marcar atendido', color: 'bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white' },
    { value: 'ausente',    label: 'Marcar ausente',  color: 'bg-gray-100 hover:bg-gray-200 text-gray-700' },
    { value: 'cancelado',  label: 'Cancelar',        color: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' },
  ],
  atendido:   [],
  ausente:    [],
  cancelado:  [],
}

export default function AppointmentDetail({ appt, profile }: { appt: any; profile: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)
  const [loading, setLoading] = useState(false)

  const patient = appt.patients as any
  const doctor  = appt.profiles as any
  const scheduledAt = new Date(appt.scheduled_at)

  async function updateStatus(newStatus: string) {
    if (newStatus === 'cancelado' && !showCancelInput) {
      setShowCancelInput(true); return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('appointments').update({
      status: newStatus,
      cancelled_reason: newStatus === 'cancelado' ? cancelReason : null,
      cancelled_by: newStatus === 'cancelado' ? user!.id : null,
    }).eq('id', appt.id)
    router.refresh()
    setLoading(false)
    setShowCancelInput(false)
  }

  const actions = NEXT_STATUSES[appt.status] ?? []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {patient?.first_name} {patient?.last_name}
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {scheduledAt.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}{scheduledAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            {' · '}{appt.duration_mins} min
          </p>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {/* Datos del turno */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#94A3B8] text-xs uppercase tracking-wide mb-1">Médico</p>
              <p className="font-medium text-[#0F172A]">{doctor?.full_name}</p>
              <p className="text-[#64748B]">{SPECIALTY_LABELS[appt.specialty] ?? appt.specialty}</p>
            </div>
            <div>
              <p className="text-[#94A3B8] text-xs uppercase tracking-wide mb-1">Paciente</p>
              <Link href={`/pacientes/${patient?.id}/historia`} className="font-medium text-[#0891B2] hover:underline">
                {patient?.first_name} {patient?.last_name}
              </Link>
              {patient?.dni && <p className="text-[#64748B]">DNI {patient.dni}</p>}
            </div>
            {appt.reason && (
              <div className="col-span-2">
                <p className="text-[#94A3B8] text-xs uppercase tracking-wide mb-1">Motivo</p>
                <p className="text-[#334155]">{appt.reason}</p>
              </div>
            )}
            {appt.notes && (
              <div className="col-span-2">
                <p className="text-[#94A3B8] text-xs uppercase tracking-wide mb-1">Notas internas</p>
                <p className="text-[#334155]">{appt.notes}</p>
              </div>
            )}
            {appt.cancelled_reason && (
              <div className="col-span-2">
                <p className="text-[#94A3B8] text-xs uppercase tracking-wide mb-1">Motivo cancelación</p>
                <p className="text-red-600">{appt.cancelled_reason}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alergias del paciente */}
      {patient?.allergies?.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded">
          <span className="text-red-500">⚠️</span>
          <p className="text-sm text-red-700 font-medium">
            Alergias: {patient.allergies.join(', ')}
          </p>
        </div>
      )}

      {/* Acciones */}
      {actions.length > 0 && (
        <div className="space-y-3">
          {showCancelInput && (
            <div className="space-y-2">
              <Label>Motivo de cancelación</Label>
              <Textarea
                placeholder="Indicá el motivo..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={2}
              />
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            {actions.map(action => (
              <Button
                key={action.value}
                disabled={loading}
                className={`text-sm ${action.color}`}
                onClick={() => updateStatus(action.value)}
              >
                {loading ? '...' : action.label}
              </Button>
            ))}
            {showCancelInput && (
              <Button variant="ghost" onClick={() => setShowCancelInput(false)} className="text-sm">
                Volver
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Ir a HC si ya fue atendido */}
      {(appt.status === 'atendido' || appt.status === 'confirmado') && patient?.id && (
        <Link href={`/pacientes/${patient.id}/consultas/nueva?appointment=${appt.id}`}>
          <Button className="w-full bg-[#0891B2] hover:bg-[#0369A1] text-white">
            📋 Registrar consulta en historia clínica
          </Button>
        </Link>
      )}
    </div>
  )
}
