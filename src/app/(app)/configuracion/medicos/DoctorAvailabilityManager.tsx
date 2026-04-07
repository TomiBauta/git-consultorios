'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// 0=Dom ... 6=Sáb — mostrar Lun a Dom
const WEEK = [
  { dow: 1, label: 'Lun' },
  { dow: 2, label: 'Mar' },
  { dow: 3, label: 'Mié' },
  { dow: 4, label: 'Jue' },
  { dow: 5, label: 'Vie' },
  { dow: 6, label: 'Sáb' },
  { dow: 0, label: 'Dom' },
]

type AvailRow = {
  id: string | null  // null = no existe todavía
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration: number
  enabled: boolean
}

type Block = { id: string; starts_at: string; ends_at: string; reason: string }

function toInput(t: string) { return t.slice(0, 5) } // "09:00:00" -> "09:00"
function toDb(t: string)    { return t.length === 5 ? t + ':00' : t }

export default function DoctorAvailabilityManager({
  doctorId,
  existing,
  blocks: initialBlocks,
}: {
  doctorId: string
  existing: { id: string; day_of_week: number; start_time: string; end_time: string; slot_duration: number }[]
  blocks: Block[]
}) {
  const router = useRouter()
  const supabase = createClient()

  // Inicializar grilla — un slot por día de la semana
  const [rows, setRows] = useState<AvailRow[]>(() =>
    WEEK.map(({ dow }) => {
      const found = existing.find(e => e.day_of_week === dow)
      return {
        id: found?.id ?? null,
        day_of_week: dow,
        start_time: found ? toInput(found.start_time) : '08:00',
        end_time:   found ? toInput(found.end_time)   : '13:00',
        slot_duration: found?.slot_duration ?? 30,
        enabled: !!found,
      }
    })
  )

  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  // Bloques / ausencias
  const [blocks, setBlocks]       = useState<Block[]>(initialBlocks)
  const [showBlock, setShowBlock]  = useState(false)
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd]     = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockSaving, setBlockSaving] = useState(false)

  function update(dow: number, field: keyof AvailRow, value: string | number | boolean) {
    setRows(prev => prev.map(r => r.day_of_week === dow ? { ...r, [field]: value } : r))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)

    // Días habilitados: upsert
    const toUpsert = rows
      .filter(r => r.enabled)
      .map(r => ({
        ...(r.id ? { id: r.id } : {}),
        doctor_id:    doctorId,
        day_of_week:  r.day_of_week,
        start_time:   toDb(r.start_time),
        end_time:     toDb(r.end_time),
        slot_duration: r.slot_duration,
        is_active:    true,
      }))

    // Días deshabilitados: marcar inactivos si tenían fila
    const toDisable = rows
      .filter(r => !r.enabled && r.id)
      .map(r => r.id as string)

    if (toUpsert.length > 0) {
      await supabase.from('doctor_availability').upsert(toUpsert, { onConflict: 'id' })
    }
    for (const id of toDisable) {
      await supabase.from('doctor_availability').update({ is_active: false }).eq('id', id)
    }
    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  async function handleAddBlock() {
    if (!blockStart || !blockEnd) return
    setBlockSaving(true)
    const { data } = await supabase
      .from('doctor_blocks')
      .insert({
        doctor_id: doctorId,
        starts_at: blockStart + 'T00:00:00',
        ends_at:   blockEnd   + 'T23:59:59',
        reason:    blockReason.trim() || null,
      })
      .select('id, starts_at, ends_at, reason')
      .single()
    if (data) setBlocks(prev => [...prev, data as Block])
    setBlockStart('')
    setBlockEnd('')
    setBlockReason('')
    setShowBlock(false)
    setBlockSaving(false)
  }

  async function handleDeleteBlock(id: string) {
    await supabase.from('doctor_blocks').delete().eq('id', id)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  const enabledCount = rows.filter(r => r.enabled).length

  return (
    <div className="space-y-5 mt-4">
      {/* Grilla semanal */}
      <div>
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Horarios de atención</p>
        <div className="space-y-2">
          {WEEK.map(({ dow, label }) => {
            const row = rows.find(r => r.day_of_week === dow)!
            return (
              <div
                key={dow}
                className={[
                  'flex items-center gap-3 px-4 py-3 rounded border-2 transition-all',
                  row.enabled
                    ? 'border-[#BFDBFE] bg-[#EFF6FF]'
                    : 'border-[#F1F5F9] bg-[#FAFAFA]',
                ].join(' ')}
              >
                {/* Toggle día */}
                <button
                  onClick={() => update(dow, 'enabled', !row.enabled)}
                  className={[
                    'w-10 h-6 rounded-full transition-colors shrink-0 relative',
                    row.enabled ? 'bg-[#1B3A6B]' : 'bg-[#CBD5E1]',
                  ].join(' ')}
                >
                  <span className={[
                    'absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-[#1a2235] shadow transition-all',
                    row.enabled ? 'left-5' : 'left-1',
                  ].join(' ')} />
                </button>

                {/* Nombre día */}
                <span className={[
                  'w-8 text-sm font-semibold shrink-0',
                  row.enabled ? 'text-[#1B3A6B]' : 'text-[#94A3B8]',
                ].join(' ')}>
                  {label}
                </span>

                {/* Campos horario */}
                {row.enabled ? (
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <Input
                      type="time"
                      value={row.start_time}
                      onChange={e => update(dow, 'start_time', e.target.value)}
                      className="w-28 h-8 text-sm"
                    />
                    <span className="text-[#94A3B8] text-sm">a</span>
                    <Input
                      type="time"
                      value={row.end_time}
                      onChange={e => update(dow, 'end_time', e.target.value)}
                      className="w-28 h-8 text-sm"
                    />
                    <select
                      value={row.slot_duration}
                      onChange={e => update(dow, 'slot_duration', parseInt(e.target.value))}
                      className="h-8 text-sm border border-[#E2E8F0] rounded-lg px-2 bg-white dark:bg-[#1a2235] text-[#334155]"
                    >
                      <option value={15}>15 min</option>
                      <option value={20}>20 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>60 min</option>
                    </select>
                    {/* Preview cantidad de turnos */}
                    {(() => {
                      const [sh, sm] = row.start_time.split(':').map(Number)
                      const [eh, em] = row.end_time.split(':').map(Number)
                      const total = Math.max(0, Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / row.slot_duration))
                      return total > 0 ? (
                        <span className="text-xs text-[#64748B]">· {total} turnos</span>
                      ) : null
                    })()}
                  </div>
                ) : (
                  <span className="text-sm text-[#CBD5E1]">Sin atención</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3 mt-3">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white"
          >
            {saving ? 'Guardando...' : 'Guardar horarios'}
          </Button>
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Guardado
            </span>
          )}
          {enabledCount > 0 && (
            <span className="text-xs text-[#64748B]">
              {enabledCount} día{enabledCount !== 1 ? 's' : ''} activo{enabledCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Bloqueos / ausencias */}
      <div className="border-t border-[#F1F5F9] pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
            Bloqueos / Ausencias
          </p>
          <button
            onClick={() => setShowBlock(v => !v)}
            className="text-xs text-[#0891B2] hover:underline"
          >
            + Agregar bloqueo
          </button>
        </div>

        {showBlock && (
          <div className="bg-orange-50 border border-orange-200 rounded p-4 space-y-3 mb-3">
            <p className="text-xs font-medium text-orange-800">
              Los turnos dentro del rango quedará bloqueados para nuevas reservas online.
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs text-[#64748B]">Desde</label>
                <Input
                  type="date"
                  value={blockStart}
                  onChange={e => setBlockStart(e.target.value)}
                  className="h-8 text-sm w-36"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#64748B]">Hasta</label>
                <Input
                  type="date"
                  value={blockEnd}
                  onChange={e => setBlockEnd(e.target.value)}
                  min={blockStart}
                  className="h-8 text-sm w-36"
                />
              </div>
              <div className="space-y-1 flex-1 min-w-32">
                <label className="text-xs text-[#64748B]">Motivo (opcional)</label>
                <Input
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder="Ej: Vacaciones, Congreso..."
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!blockStart || !blockEnd || blockSaving}
                onClick={handleAddBlock}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {blockSaving ? '...' : 'Agregar bloqueo'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowBlock(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {blocks.length === 0 ? (
          <p className="text-sm text-[#94A3B8]">Sin bloqueos configurados</p>
        ) : (
          <div className="space-y-2">
            {blocks.map(b => {
              const start = b.starts_at.split('T')[0]
              const end   = b.ends_at.split('T')[0]
              const label = start === end ? start : `${start} → ${end}`
              return (
                <div key={b.id} className="flex items-center justify-between px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-orange-800">{label}</span>
                    {b.reason && <span className="text-xs text-orange-600 ml-2">· {b.reason}</span>}
                  </div>
                  <button
                    onClick={() => handleDeleteBlock(b.id)}
                    className="text-xs text-orange-400 hover:text-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
