'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, UserPlus, Filter,
  ChevronLeft, ChevronRight,
  ArrowRight, Plus,
} from 'lucide-react'

export type PatientRow = {
  id: string
  first_name: string
  last_name: string
  dni: string | null
  birth_date: string | null
  phone: string | null
  email: string | null
  obra_social: string | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#d8e2ff', text: 'var(--primary-val)' },
  { bg: '#d9e2fc', text: '#555e74' },
  { bg: 'rgba(12,103,128,0.12)', text: '#0c6780' },
  { bg: '#e3e2e7', text: 'var(--on-surface-variant)' },
]
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}
function calcAge(dob: string | null) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PAGE_SIZE = 12

// ── Main component ────────────────────────────────────────────────────────────
export default function PacientesClient({
  patients,
  totalCount,
}: {
  patients: PatientRow[]
  totalCount: number
}) {
  const supabase = createClient()
  const router = useRouter()

  const [search, setSearch]           = useState('')
  const [obraFilter, setObraFilter]   = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage]               = useState(1)
  const [selected, setSelected]       = useState<PatientRow | null>(patients[0] ?? null)
  const [appts, setAppts]             = useState<any[]>([])
  const [loadingAppts, setLoading]    = useState(false)

  // Unique obras sociales from loaded patients
  const obrasOptions = Array.from(
    new Set(patients.map(p => p.obra_social).filter(Boolean) as string[])
  ).sort()

  // Active filter count
  const activeFilters = (obraFilter ? 1 : 0)

  // Client-side filter
  const filtered = patients.filter(p => {
    const matchSearch = search.length < 2 ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (p.dni ?? '').includes(search) ||
      (p.obra_social ?? '').toLowerCase().includes(search.toLowerCase())
    const matchObra = !obraFilter || p.obra_social === obraFilter
    return matchSearch && matchObra
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Fetch appointments for selected patient
  const loadAppts = useCallback(async (patientId: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('appointments')
      .select('id, scheduled_at, status, reason, specialty')
      .eq('patient_id', patientId)
      .order('scheduled_at', { ascending: false })
      .limit(5)
    setAppts(data ?? [])
    setLoading(false)
  }, [supabase])

  function selectPatient(p: PatientRow) {
    setSelected(p)
    loadAppts(p.id)
  }

  // Load first patient on mount
  useEffect(() => {
    if (patients[0]) loadAppts(patients[0].id)
  }, [])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, obraFilter])

  return (
    <div className="flex h-full -m-8 overflow-hidden">

      {/* ════ LEFT — Patient Directory ════ */}
      <section
        className="flex-1 flex flex-col p-8 overflow-hidden min-w-0"
        style={{ borderRight: '1px solid rgba(196,198,208,0.1)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-end mb-8 shrink-0">
          <div>
            <h2
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: 'var(--primary-val)', letterSpacing: '-0.02em' }}
            >
              Directorio de Pacientes
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              Gestiona y consulta el historial de tus{' '}
              <span className="font-semibold">{totalCount.toLocaleString('es-AR')}</span>{' '}
              pacientes registrados.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(f => !f)}
              className="px-4 py-2.5 font-bold rounded flex items-center gap-2 text-sm transition-all hover:opacity-80 relative"
              style={{
                background: showFilters || activeFilters > 0 ? 'var(--primary-val)' : '#e3e2e7',
                color: showFilters || activeFilters > 0 ? 'var(--surface-container-lowest)' : 'var(--primary-val)',
              }}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {activeFilters > 0 && (
                <span
                  className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center"
                  style={{ background: '#0c6780', color: '#fff' }}
                >
                  {activeFilters}
                </span>
              )}
            </button>
            <Link href="/pacientes/nuevo">
              <button
                className="px-4 py-2.5 text-white font-bold rounded flex items-center gap-2 text-sm transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)' }}
              >
                <UserPlus className="w-4 h-4" />
                Nuevo Paciente
              </button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--on-surface-variant)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar pacientes por nombre, DNI o patología..."
            className="w-full rounded-full py-2.5 pl-10 pr-4 text-sm border-none outline-none transition-all"
            style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
          />
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div
            className="mb-4 rounded p-4 flex flex-wrap items-end gap-4 shrink-0"
            style={{
              background: 'var(--surface-container-lowest, var(--surface-container-lowest))',
              border: '1px solid var(--outline-variant, rgba(61,74,92,0.15))',
            }}
          >
            {/* Nombre / Apellido — same as search but labeled */}
            <div className="flex-1 min-w-48 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                Nombre o Apellido
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--on-surface-variant)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full rounded pl-9 pr-4 py-2 text-sm outline-none"
                  style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
                />
              </div>
            </div>

            {/* Obra social */}
            <div className="flex-1 min-w-48 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                Obra Social
              </label>
              <select
                value={obraFilter}
                onChange={e => setObraFilter(e.target.value)}
                className="w-full rounded px-3 py-2 text-sm outline-none appearance-none"
                style={{ background: 'var(--surface-container-low)', color: obraFilter ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}
              >
                <option value="">Todas</option>
                {obrasOptions.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Clear */}
            {(search || obraFilter) && (
              <button
                onClick={() => { setSearch(''); setObraFilter('') }}
                className="px-4 py-2 rounded text-sm font-bold transition-all hover:opacity-80 shrink-0"
                style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}
              >
                Limpiar
              </button>
            )}

            {/* Result count */}
            <p className="text-xs ml-auto self-end pb-0.5 shrink-0" style={{ color: 'var(--on-surface-variant)' }}>
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Table */}
        <div className="rounded overflow-hidden flex flex-col flex-1 min-h-0" style={{ background: 'var(--surface-container-low)' }}>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-10" style={{ background: 'var(--surface-container-low)' }}>
                <tr style={{ color: 'var(--on-surface-variant)' }}>
                  {['Nombre del Paciente', 'Última Visita', 'Obra Social', 'Estado', ''].map(col => (
                    <th key={col} className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((patient, i) => {
                  const isSelected = selected?.id === patient.id
                  const initials   = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase()
                  const av         = avatarColor(patient.last_name)
                  const isEven     = i % 2 === 0

                  return (
                    <tr
                      key={patient.id}
                      onClick={() => selectPatient(patient)}
                      className="cursor-pointer transition-colors"
                      style={{ background: isSelected ? 'var(--surface-container)' : isEven ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)' }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-container-low)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isEven ? 'var(--surface-container-lowest)' : 'var(--surface-container-low)' }}
                    >
                      {/* Patient name + phone */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                            style={{ background: av.bg, color: av.text }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ color: 'var(--on-surface)' }}>
                              {patient.last_name}, {patient.first_name}
                            </p>
                            <p className="text-[11px]" style={{ color: 'var(--on-surface-variant)' }}>
                              {patient.dni ? `DNI: ${patient.dni}` : patient.phone ?? ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Última visita — placeholder, requires join */}
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--on-surface-variant)' }}>—</td>

                      {/* Obra social */}
                      <td className="px-6 py-4">
                        {patient.obra_social ? (
                          <span
                            className="px-3 py-1 text-[10px] font-bold rounded-full uppercase"
                            style={{ background: 'rgba(12,103,128,0.15)', color: '#0c6780' }}
                          >
                            {patient.obra_social}
                          </span>
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 text-[10px] font-bold rounded-full uppercase"
                          style={{ background: 'rgba(12,103,128,0.12)', color: '#0c6780' }}
                        >
                          Activo
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/pacientes/${patient.id}`}
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                          style={{ background: 'var(--surface-container)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#d8e2ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-container)')}
                        >
                          <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--primary-val)' }} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}

                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm" style={{ color: 'var(--on-surface-variant)', background: '#fff' }}>
                      No se encontraron pacientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="px-6 py-4 flex justify-between items-center shrink-0"
            style={{ borderTop: '1px solid rgba(196,198,208,0.1)', background: 'var(--surface-container-low)' }}
          >
            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              {filtered.length === 0
                ? 'Sin resultados'
                : `Mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} de ${filtered.length} pacientes`
              }
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: page === p ? 'var(--primary-val)' : 'transparent',
                    color: page === p ? '#fff' : 'var(--on-surface-variant)',
                  }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ════ RIGHT — Patient Detail Panel ════ */}
      <aside
        className="w-96 shrink-0 p-8 overflow-y-auto"
        style={{ background: 'var(--surface)' }}
      >
        {!selected ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <div className="w-12 h-12 rounded bg-[#f2f4f6] flex items-center justify-center mx-auto mb-4 text-2xl">
                👤
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                Seleccioná un paciente
              </p>
            </div>
          </div>
        ) : (() => {
          const initials = `${selected.first_name[0]}${selected.last_name[0]}`.toUpperCase()
          const av       = avatarColor(selected.last_name)
          const age      = calcAge(selected.birth_date)

          return (
            <div
              className="rounded-3xl p-6"
              style={{
                background: 'var(--surface-container-lowest)',
                boxShadow: '0px 10px 30px rgba(0,26,65,0.03)',
                border: '1px solid rgba(196,198,208,0.1)',
              }}
            >
              {/* Avatar + name */}
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold border-4 border-white shadow-sm"
                    style={{ background: av.bg, color: av.text }}
                  >
                    {initials}
                  </div>
                  <span
                    className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-white"
                    style={{ background: '#0c6780' }}
                  />
                </div>
                <h3
                  className="text-2xl font-extrabold tracking-tight"
                  style={{ color: 'var(--primary-val)', letterSpacing: '-0.02em' }}
                >
                  {selected.first_name} {selected.last_name}
                </h3>
                {selected.obra_social && (
                  <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>{selected.obra_social}</p>
                )}

                {/* CTA buttons */}
                <div className="flex gap-2 mt-6 w-full">
                  <Link href={`/pacientes/${selected.id}`} className="flex-1">
                    <button
                      className="w-full py-3 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)' }}
                    >
                      Ver Historia Clínica
                    </button>
                  </Link>
                  <Link href={`/agenda/nuevo?patient=${selected.id}`}>
                    <button
                      className="p-3 rounded transition-all hover:opacity-80"
                      style={{ background: '#e2e5e9', color: 'var(--primary-val)' }}
                      title="Nuevo turno"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>

              {/* Personal data grid */}
              <div className="rounded p-4 mb-5" style={{ background: 'var(--surface-container-low)' }}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
                    Datos Personales
                  </h4>
                  <Link href={`/pacientes/${selected.id}`}>
                    <ArrowRight className="w-4 h-4" style={{ color: 'var(--primary-val)' }} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Edad',       value: age !== null ? `${age} años` : '—' },
                    { label: 'DNI',        value: selected.dni ?? '—' },
                    { label: 'Teléfono',   value: selected.phone ?? '—' },
                    { label: 'Nacimiento', value: fmtDate(selected.birth_date) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--on-surface-variant)' }}>{label}</p>
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--on-surface)' }}>{value}</p>
                    </div>
                  ))}
                  {selected.email && (
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--on-surface-variant)' }}>Email</p>
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--on-surface)' }}>{selected.email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment timeline */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 px-1" style={{ color: 'var(--on-surface-variant)' }}>
                  Últimos Turnos
                </h4>

                {loadingAppts ? (
                  <p className="text-xs px-1" style={{ color: 'var(--on-surface-variant)' }}>Cargando...</p>
                ) : appts.length === 0 ? (
                  <p className="text-xs px-1" style={{ color: 'var(--on-surface-variant)' }}>Sin turnos registrados</p>
                ) : (
                  <div className="relative pl-6 space-y-5">
                    {/* Timeline line */}
                    <div
                      className="absolute left-[11px] top-2 bottom-2 w-[2px]"
                      style={{ background: 'rgba(196,198,208,0.3)' }}
                    />
                    {appts.map((appt, i) => (
                      <div key={appt.id} className="relative">
                        <span
                          className="absolute -left-[19.5px] top-1 w-[9px] h-[9px] rounded-full ring-4 ring-white"
                          style={{ background: i === 0 ? 'var(--primary-val)' : '#c4c6d0' }}
                        />
                        <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--on-surface-variant)' }}>
                          {new Date(appt.scheduled_at).toLocaleDateString('es-AR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          }).toUpperCase()}
                        </p>
                        <p className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>
                          {appt.reason ?? appt.specialty ?? 'Consulta'}
                        </p>
                        <p className="text-[11px] mt-0.5 capitalize" style={{ color: 'var(--on-surface-variant)' }}>
                          {appt.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <Link href={`/pacientes/${selected.id}`}>
                <button
                  className="w-full mt-8 py-3 font-bold rounded text-sm transition-all hover:bg-[#00113a]/5"
                  style={{ border: '2px solid rgba(0,36,83,0.1)', color: 'var(--primary-val)', background: 'transparent' }}
                >
                  Ver Historia Completa →
                </button>
              </Link>
            </div>
          )
        })()}
      </aside>
    </div>
  )
}
