'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function DoctorAvailabilityManager({
  doctorId, existing,
}: {
  doctorId: string; existing: any[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [day, setDay]           = useState('1')
  const [start, setStart]       = useState('08:00')
  const [end, setEnd]           = useState('13:00')
  const [slot, setSlot]         = useState('30')
  const [loading, setLoading]   = useState(false)

  async function handleAdd() {
    setLoading(true)
    await supabase.from('doctor_availability').insert({
      doctor_id:    doctorId,
      day_of_week:  parseInt(day),
      start_time:   start,
      end_time:     end,
      slot_duration: parseInt(slot),
    })
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    await supabase.from('doctor_availability').update({ is_active: false }).eq('id', id)
    router.refresh()
  }

  return (
    <div className="mt-3">
      {showForm ? (
        <div className="border border-[#E2E8F0] rounded-xl p-4 bg-[#FAFCFF] space-y-3">
          <p className="text-sm font-medium text-[#334155]">Agregar horario</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Día</Label>
              <select value={day} onChange={e => setDay(e.target.value)}
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white">
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input type="time" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input type="time" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Duración del turno</Label>
              <select value={slot} onChange={e => setSlot(e.target.value)}
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white">
                <option value="15">15 minutos</option>
                <option value="20">20 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={loading} onClick={handleAdd} className="bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white">
              {loading ? '...' : 'Guardar'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="text-sm text-[#0891B2] hover:underline mt-1">
          + Agregar horario
        </button>
      )}

      {existing.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {existing.map(a => (
            <div key={a.id} className="flex items-center gap-1 text-xs px-2 py-1 bg-white border border-[#E2E8F0] rounded-lg">
              <span>{DAYS[a.day_of_week]} {a.start_time.slice(0,5)}–{a.end_time.slice(0,5)}</span>
              <button onClick={() => handleDelete(a.id)} className="text-[#94A3B8] hover:text-red-500 ml-1">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
