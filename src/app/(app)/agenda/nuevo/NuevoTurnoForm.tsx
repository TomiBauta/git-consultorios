'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, X, ChevronDown } from 'lucide-react'

type Profile = { id: string; full_name: string; role: string; specialty: string | null }
type Doctor  = { id: string; full_name: string; specialty: string | null }
type Patient = { id: string; first_name: string; last_name: string; dni: string | null }

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología', gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología', clinica_medica: 'Clínica Médica',
}

// ── Inline input style ────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
        {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

function TrayInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="login-tray rounded px-4 py-2.5">
      <input
        {...props}
        className="w-full bg-transparent text-sm outline-none"
        style={{ color: 'var(--on-surface, #00113a)' }}
      />
    </div>
  )
}

function TraySelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <div className="login-tray rounded px-4 py-2.5">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent text-sm outline-none appearance-none"
        style={{ color: value ? 'var(--on-surface, #00113a)' : 'var(--on-surface-variant, #3d4a5c)' }}
      >
        {children}
      </select>
    </div>
  )
}

export default function NuevoTurnoForm({
  profile, doctors, defaultDoctorId, defaultFecha,
}: {
  profile: Profile | null; doctors: Doctor[]; defaultDoctorId: string; defaultFecha: string
}) {
  const router = useRouter()
  const supabase = createClient()

  // ── Turno state ─────────────────────────────────────────────────────────────
  const [doctorId,  setDoctorId]  = useState(defaultDoctorId)
  const [fecha,     setFecha]     = useState(defaultFecha || new Date().toISOString().split('T')[0])
  const [hora,      setHora]      = useState('09:00')
  const [duracion,  setDuracion]  = useState('30')
  const [motivo,    setMotivo]    = useState('')
  const [notas,     setNotas]     = useState('')

  // ── Patient search ───────────────────────────────────────────────────────────
  const [patientSearch,   setPatientSearch]   = useState('')
  const [patients,        setPatients]        = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showDropdown,    setShowDropdown]    = useState(false)

  // ── New patient inline form ──────────────────────────────────────────────────
  const [showNewPatient,  setShowNewPatient]  = useState(false)
  const [npFirstName,     setNpFirstName]     = useState('')
  const [npLastName,      setNpLastName]      = useState('')
  const [npDni,           setNpDni]           = useState('')
  const [npPhone,         setNpPhone]         = useState('')
  const [npEmail,         setNpEmail]         = useState('')
  const [npSex,           setNpSex]           = useState('')
  const [npBirthDate,     setNpBirthDate]     = useState('')
  const [npCreating,      setNpCreating]      = useState(false)
  const [npError,         setNpError]         = useState('')

  // ── Submission ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const selectedDoctor = doctors.find(d => d.id === doctorId)

  // Patient search debounce
  useEffect(() => {
    if (patientSearch.length < 2) { setPatients([]); return }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, dni')
        .or(`first_name.ilike.%${patientSearch}%,last_name.ilike.%${patientSearch}%,dni.ilike.%${patientSearch}%`)
        .is('deleted_at', null)
        .limit(8)
      setPatients(data ?? [])
      setShowDropdown(true)
    }, 300)
    return () => clearTimeout(timeout)
  }, [patientSearch])

  // Pre-fill new patient form name from search
  function openNewPatient() {
    const parts = patientSearch.trim().split(' ')
    setNpFirstName(parts[0] ?? '')
    setNpLastName(parts.slice(1).join(' '))
    setShowNewPatient(true)
    setShowDropdown(false)
  }

  async function handleCreatePatient() {
    if (!npFirstName.trim() || !npLastName.trim()) {
      setNpError('Nombre y apellido son obligatorios')
      return
    }
    setNpCreating(true)
    setNpError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase
      .from('patients')
      .insert({
        first_name:  npFirstName.trim(),
        last_name:   npLastName.trim(),
        dni:         npDni.trim() || null,
        phone:       npPhone.trim() || null,
        email:       npEmail.trim() || null,
        sex:         npSex || null,
        birth_date:  npBirthDate || null,
        created_by:  user?.id,
      })
      .select('id, first_name, last_name, dni')
      .single()

    if (err || !data) {
      setNpError(err?.message ?? 'Error al crear el paciente')
      setNpCreating(false)
      return
    }

    // Auto-select the new patient
    setSelectedPatient(data)
    setPatientSearch('')
    setShowNewPatient(false)
    setNpCreating(false)
    // Reset new patient fields
    setNpFirstName(''); setNpLastName(''); setNpDni('')
    setNpPhone(''); setNpEmail(''); setNpSex(''); setNpBirthDate('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatient) { setError('Seleccioná o creá un paciente'); return }
    if (!doctorId) { setError('Seleccioná un médico'); return }
    setLoading(true)
    setError('')

    const scheduledAt = new Date(`${fecha}T${hora}:00`)
    const { data: { user } } = await supabase.auth.getUser()

    const { error: err } = await supabase.from('appointments').insert({
      patient_id:    selectedPatient.id,
      doctor_id:     doctorId,
      specialty:     selectedDoctor?.specialty ?? '',
      scheduled_at:  scheduledAt.toISOString(),
      duration_mins: parseInt(duracion),
      reason:        motivo || null,
      notes:         notas || null,
      status:        'pendiente',
      created_by:    user!.id,
    })

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/agenda')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto">

      {/* ── Sección Paciente ── */}
      <div
        className="rounded p-5 space-y-4"
        style={{
          background: 'var(--surface-container-lowest, #ffffff)',
          boxShadow: '0px 8px 32px rgba(0,17,58,0.04)',
          border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
        }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
          Paciente
        </h2>

        {/* Selected patient pill */}
        {selectedPatient ? (
          <div
            className="flex items-center justify-between px-4 py-3 rounded"
            style={{ background: 'var(--secondary-container-val, #cce8f0)', border: '1px solid rgba(12,103,128,0.2)' }}
          >
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--primary-val, #00113a)' }}>
                {selectedPatient.first_name} {selectedPatient.last_name}
              </p>
              {selectedPatient.dni && (
                <p className="text-xs" style={{ color: 'var(--secondary-val, #0c6780)' }}>DNI {selectedPatient.dni}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setSelectedPatient(null); setPatientSearch('') }}
              className="p-1 rounded hover:opacity-70 transition-opacity"
              style={{ color: 'var(--secondary-val, #0c6780)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Search input */}
            <Field label="Buscar paciente existente">
              <div className="relative">
                <div className="login-tray rounded px-4 py-2.5">
                  <input
                    placeholder="Nombre, apellido o DNI..."
                    value={patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); setShowNewPatient(false) }}
                    onFocus={() => patients.length > 0 && setShowDropdown(true)}
                    autoComplete="off"
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: 'var(--on-surface, #00113a)' }}
                  />
                </div>

                {/* Dropdown results */}
                {showDropdown && patients.length > 0 && (
                  <div
                    className="absolute z-20 w-full mt-1 rounded overflow-hidden"
                    style={{
                      background: '#ffffff',
                      boxShadow: '0px 8px 24px rgba(0,17,58,0.10)',
                      border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
                    }}
                  >
                    {patients.map(p => (
                      <button
                        key={p.id} type="button"
                        className="w-full text-left px-4 py-3 transition-colors hover:brightness-95 border-b last:border-b-0"
                        style={{ borderColor: 'var(--outline-variant, rgba(61,74,92,0.08))' }}
                        onClick={() => { setSelectedPatient(p); setPatientSearch(''); setShowDropdown(false) }}
                      >
                        <p className="text-sm font-semibold" style={{ color: 'var(--primary-val, #00113a)' }}>
                          {p.first_name} {p.last_name}
                        </p>
                        {p.dni && <p className="text-xs" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>DNI {p.dni}</p>}
                      </button>
                    ))}
                    {/* Create option at bottom of list */}
                    <button
                      type="button"
                      onClick={openNewPatient}
                      className="w-full text-left px-4 py-3 flex items-center gap-2 transition-colors"
                      style={{ background: 'var(--surface-container-low, #f2f4f6)', color: 'var(--secondary-val, #0c6780)' }}
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="text-sm font-semibold">Crear nuevo paciente</span>
                    </button>
                  </div>
                )}

                {/* No results */}
                {patientSearch.length >= 2 && patients.length === 0 && !showNewPatient && (
                  <div
                    className="absolute z-20 w-full mt-1 rounded px-4 py-3 flex items-center justify-between"
                    style={{
                      background: '#ffffff',
                      boxShadow: '0px 8px 24px rgba(0,17,58,0.10)',
                      border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
                    }}
                  >
                    <span className="text-sm" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
                      Sin resultados para "{patientSearch}"
                    </span>
                    <button
                      type="button"
                      onClick={openNewPatient}
                      className="flex items-center gap-1.5 text-sm font-bold hover:opacity-75 transition-opacity"
                      style={{ color: 'var(--secondary-val, #0c6780)' }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Crear nuevo
                    </button>
                  </div>
                )}
              </div>
            </Field>

            {/* Divider */}
            {!showNewPatient && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'var(--outline-variant, rgba(61,74,92,0.15))' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>o</span>
                <div className="flex-1 h-px" style={{ background: 'var(--outline-variant, rgba(61,74,92,0.15))' }} />
              </div>
            )}

            {/* Toggle to create */}
            {!showNewPatient && (
              <button
                type="button"
                onClick={() => { openNewPatient(); setPatientSearch('') }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-bold transition-all hover:opacity-85"
                style={{
                  background: 'var(--surface-container-low, #f2f4f6)',
                  color: 'var(--primary-val, #00113a)',
                  border: '1px dashed var(--outline-variant, rgba(61,74,92,0.3))',
                }}
              >
                <UserPlus className="w-4 h-4" />
                Crear nuevo paciente
              </button>
            )}
          </div>
        )}

        {/* ── Inline New Patient Form ── */}
        {showNewPatient && (
          <div
            className="rounded p-4 space-y-4 mt-2"
            style={{
              background: 'var(--surface-container-low, #f2f4f6)',
              border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" style={{ color: 'var(--secondary-val, #0c6780)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--primary-val, #00113a)' }}>
                  Nuevo Paciente
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPatient(false)}
                className="p-1 rounded hover:opacity-70 transition-opacity"
                style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" required>
                <TrayInput
                  value={npFirstName}
                  onChange={e => setNpFirstName(e.target.value)}
                  placeholder="Ej: María"
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Apellido" required>
                <TrayInput
                  value={npLastName}
                  onChange={e => setNpLastName(e.target.value)}
                  placeholder="Ej: González"
                  autoComplete="family-name"
                />
              </Field>
              <Field label="DNI">
                <TrayInput
                  value={npDni}
                  onChange={e => setNpDni(e.target.value)}
                  placeholder="12345678"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Sexo">
                <div className="relative">
                  <TraySelect value={npSex} onChange={setNpSex}>
                    <option value="">Seleccioná</option>
                    <option value="femenino">Femenino</option>
                    <option value="masculino">Masculino</option>
                    <option value="otro">Otro</option>
                  </TraySelect>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }} />
                </div>
              </Field>
              <Field label="Teléfono">
                <TrayInput
                  value={npPhone}
                  onChange={e => setNpPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  inputMode="tel"
                />
              </Field>
              <Field label="Email">
                <TrayInput
                  value={npEmail}
                  onChange={e => setNpEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  type="email"
                />
              </Field>
              <Field label="Fecha de nacimiento">
                <TrayInput
                  value={npBirthDate}
                  onChange={e => setNpBirthDate(e.target.value)}
                  type="date"
                />
              </Field>
            </div>

            {npError && (
              <p className="text-xs font-medium px-3 py-2 rounded" style={{ background: '#ffdad6', color: '#93000a' }}>
                {npError}
              </p>
            )}

            <button
              type="button"
              onClick={handleCreatePatient}
              disabled={npCreating || !npFirstName.trim() || !npLastName.trim()}
              className="w-full py-2.5 rounded text-sm font-bold transition-all hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)', color: '#ffffff' }}
            >
              {npCreating ? 'Creando paciente...' : 'Crear y seleccionar'}
            </button>
          </div>
        )}
      </div>

      {/* ── Sección Turno ── */}
      <div
        className="rounded p-5 space-y-4"
        style={{
          background: 'var(--surface-container-lowest, #ffffff)',
          boxShadow: '0px 8px 32px rgba(0,17,58,0.04)',
          border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
        }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
          Turno
        </h2>

        {profile?.role !== 'doctor' && (
          <Field label="Médico" required>
            <div className="relative">
              <TraySelect value={doctorId} onChange={setDoctorId}>
                <option value="">Seleccioná un médico</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} · {SPECIALTY_LABELS[d.specialty ?? ''] ?? d.specialty}
                  </option>
                ))}
              </TraySelect>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }} />
            </div>
          </Field>
        )}

        {selectedDoctor && (
          <div
            className="px-3 py-2 rounded text-xs font-medium"
            style={{ background: 'var(--secondary-container-val, #cce8f0)', color: 'var(--secondary-val, #0c6780)' }}
          >
            Especialidad: <strong>{SPECIALTY_LABELS[selectedDoctor.specialty ?? ''] ?? selectedDoctor.specialty}</strong>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha" required>
            <TrayInput type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
          </Field>
          <Field label="Hora" required>
            <TrayInput type="time" value={hora} onChange={e => setHora(e.target.value)} required min="07:00" max="20:00" step="900" />
          </Field>
        </div>

        <Field label="Duración">
          <div className="relative">
            <TraySelect value={duracion} onChange={setDuracion}>
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
            </TraySelect>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }} />
          </div>
        </Field>
      </div>

      {/* ── Detalles opcionales ── */}
      <div
        className="rounded p-5 space-y-4"
        style={{
          background: 'var(--surface-container-lowest, #ffffff)',
          boxShadow: '0px 8px 32px rgba(0,17,58,0.04)',
          border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
        }}
      >
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant, #3d4a5c)' }}>
          Detalles <span className="normal-case font-normal">(opcional)</span>
        </h2>
        <Field label="Motivo de consulta">
          <TrayInput
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: Control anual, consulta por dolor..."
          />
        </Field>
        <Field label="Notas internas">
          <div className="login-tray rounded px-4 py-2.5">
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Notas para el equipo..."
              rows={3}
              className="w-full bg-transparent text-sm outline-none resize-none"
              style={{ color: 'var(--on-surface, #00113a)' }}
            />
          </div>
        </Field>
      </div>

      {error && (
        <p className="text-sm font-medium px-4 py-3 rounded" style={{ background: '#ffdad6', color: '#93000a' }}>
          {error}
        </p>
      )}

      <div className="flex gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 rounded text-sm font-bold transition-all hover:opacity-80"
          style={{ background: 'var(--surface-container-low, #f2f4f6)', color: 'var(--primary-val, #00113a)' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 rounded text-sm font-bold transition-all hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)', color: '#ffffff' }}
        >
          {loading ? 'Guardando...' : 'Guardar turno'}
        </button>
      </div>
    </form>
  )
}
