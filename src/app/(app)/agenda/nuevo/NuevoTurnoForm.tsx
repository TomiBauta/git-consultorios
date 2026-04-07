'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

type Profile = { id: string; full_name: string; role: string; specialty: string | null }
type Doctor  = { id: string; full_name: string; specialty: string | null }

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología', gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología', clinica_medica: 'Clínica Médica',
}

export default function NuevoTurnoForm({
  profile, doctors, defaultDoctorId, defaultFecha,
}: {
  profile: Profile | null; doctors: Doctor[]; defaultDoctorId: string; defaultFecha: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [doctorId, setDoctorId]         = useState(defaultDoctorId)
  const [fecha, setFecha]               = useState(defaultFecha || new Date().toISOString().split('T')[0])
  const [hora, setHora]                 = useState('09:00')
  const [duracion, setDuracion]         = useState('30')
  const [motivo, setMotivo]             = useState('')
  const [notas, setNotas]               = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [patients, setPatients]         = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  // Buscar pacientes con debounce
  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, dni, obra_social_id')
        .or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,dni.ilike.%${patientSearch}%`)
        .is('deleted_at', null)
        .limit(8)
      setPatients(data ?? [])
      setShowDropdown(true)
    }, 300)
    return () => clearTimeout(timeout)
  }, [patientSearch])

  const selectedDoctor = doctors.find(d => d.id === doctorId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatient) { setError('Seleccioná un paciente'); return }
    if (!doctorId) { setError('Seleccioná un médico'); return }
    setLoading(true)
    setError('')

    const scheduledAt = new Date(`${fecha}T${hora}:00`)
    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await supabase.from('appointments').insert({
      patient_id:   selectedPatient.id,
      doctor_id:    doctorId,
      specialty:    selectedDoctor?.specialty ?? '',
      scheduled_at: scheduledAt.toISOString(),
      duration_mins: parseInt(duracion),
      reason:       motivo || null,
      notes:        notas || null,
      status:       'pendiente',
      created_by:   user!.id,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/agenda')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Paciente */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Paciente</h2>
          <div className="relative">
            <Label htmlFor="paciente">Buscar paciente</Label>
            {selectedPatient ? (
              <div className="mt-1.5 flex items-center justify-between px-4 py-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded">
                <div>
                  <p className="font-medium text-sm text-[#1B3A6B]">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                  {selectedPatient.dni && <p className="text-xs text-[#64748B]">DNI {selectedPatient.dni}</p>}
                </div>
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch('') }}
                  className="text-[#64748B] hover:text-[#1B3A6B] text-sm">✕</button>
              </div>
            ) : (
              <div className="relative mt-1.5">
                <Input
                  id="paciente"
                  placeholder="Nombre, apellido o DNI..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  onFocus={() => patients.length > 0 && setShowDropdown(true)}
                  autoComplete="off"
                />
                {showDropdown && patients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2E8F0] rounded shadow-lg overflow-hidden">
                    {patients.map(p => (
                      <button
                        key={p.id} type="button"
                        className="w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-b-0"
                        onClick={() => { setSelectedPatient(p); setPatientSearch(''); setShowDropdown(false) }}
                      >
                        <p className="text-sm font-medium text-[#0F172A]">{p.first_name} {p.last_name}</p>
                        {p.dni && <p className="text-xs text-[#94A3B8]">DNI {p.dni}</p>}
                      </button>
                    ))}
                  </div>
                )}
                {patientSearch.length >= 2 && patients.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2E8F0] rounded shadow-lg p-4 text-center">
                    <p className="text-sm text-[#94A3B8]">No se encontraron pacientes</p>
                    <Link href="/pacientes/nuevo" className="text-sm text-[#0891B2] hover:underline">
                      Crear nuevo paciente →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Médico y fecha */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Turno</h2>

          {profile?.role !== 'doctor' && (
            <div className="space-y-1.5">
              <Label>Médico</Label>
              <select
                value={doctorId}
                onChange={e => setDoctorId(e.target.value)}
                required
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
              >
                <option value="">Seleccioná un médico</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} · {SPECIALTY_LABELS[d.specialty ?? ''] ?? d.specialty}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedDoctor && (
            <div className="px-3 py-2 bg-[#F0F9FF] rounded-lg text-xs text-[#0891B2]">
              Especialidad: <strong>{SPECIALTY_LABELS[selectedDoctor.specialty ?? ''] ?? selectedDoctor.specialty}</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hora">Hora</Label>
              <Input id="hora" type="time" value={hora} onChange={e => setHora(e.target.value)} required min="07:00" max="20:00" step="900" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Duración</Label>
            <select
              value={duracion}
              onChange={e => setDuracion(e.target.value)}
              className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Motivo */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Detalles (opcional)</h2>
          <div className="space-y-1.5">
            <Label htmlFor="motivo">Motivo de consulta</Label>
            <Input id="motivo" placeholder="Ej: Control anual, consulta por dolor..." value={motivo} onChange={e => setMotivo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas internas</Label>
            <Textarea id="notas" placeholder="Notas para el equipo..." value={notas} onChange={e => setNotas(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="flex-1 bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white">
          {loading ? 'Guardando...' : 'Guardar turno'}
        </Button>
      </div>
    </form>
  )
}
