'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

type ObraSocial = { id: string; name: string }

export default function NuevoPacienteForm({ obrasSociales }: { obrasSociales: ObraSocial[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    first_name: '', last_name: '', dni: '', birth_date: '', sex: '',
    phone: '', phone_whatsapp: '', email: '', address: '',
    obra_social_id: '', obra_social_number: '', obra_social_plan: '',
    blood_type: '', allergies: '', allergies_detail: '', background_notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const allergiesArray = form.allergies
      ? form.allergies.split(',').map(a => a.trim()).filter(Boolean)
      : []

    const { data, error: err } = await supabase.from('patients').insert({
      first_name:         form.first_name.trim(),
      last_name:          form.last_name.trim(),
      dni:                form.dni.trim() || null,
      birth_date:         form.birth_date || null,
      sex:                form.sex || null,
      phone:              form.phone.trim() || null,
      phone_whatsapp:     form.phone_whatsapp.trim() || form.phone.trim() || null,
      email:              form.email.trim() || null,
      address:            form.address.trim() || null,
      obra_social_id:     form.obra_social_id || null,
      obra_social_number: form.obra_social_number.trim() || null,
      obra_social_plan:   form.obra_social_plan.trim() || null,
      blood_type:         form.blood_type || null,
      allergies:          allergiesArray,
      allergies_detail:   form.allergies_detail.trim() || null,
      background_notes:   form.background_notes.trim() || null,
      created_by:         user!.id,
    }).select('id').single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/pacientes/${data.id}/historia`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Datos personales */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">Nombre <span className="text-red-500">*</span></Label>
              <Input id="first_name" required value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Nombre" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Apellido <span className="text-red-500">*</span></Label>
              <Input id="last_name" required value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Apellido" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dni">DNI</Label>
              <Input id="dni" value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="12345678" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Fecha de nacimiento</Label>
              <Input id="birth_date" type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sexo</Label>
              <select value={form.sex} onChange={e => set('sex', e.target.value)}
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
                <option value="">Sin especificar</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Grupo sanguíneo</Label>
              <select value={form.blood_type} onChange={e => set('blood_type', e.target.value)}
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
                <option value="">Desconocido</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacto */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Contacto</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+54 9 11 ..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone_whatsapp">WhatsApp (si es distinto)</Label>
              <Input id="phone_whatsapp" value={form.phone_whatsapp} onChange={e => set('phone_whatsapp', e.target.value)} placeholder="+54 9 11 ..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@ejemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Calle y número" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Obra social */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Cobertura médica</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label>Obra social</Label>
              <select value={form.obra_social_id} onChange={e => set('obra_social_id', e.target.value)}
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
                <option value="">Sin obra social / Particular</option>
                {obrasSociales.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="obra_social_number">Número de afiliado</Label>
              <Input id="obra_social_number" value={form.obra_social_number} onChange={e => set('obra_social_number', e.target.value)} placeholder="Nro. afiliado" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="obra_social_plan">Plan</Label>
              <Input id="obra_social_plan" value={form.obra_social_plan} onChange={e => set('obra_social_plan', e.target.value)} placeholder="Ej: 210, Gold, etc." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Antecedentes médicos */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Antecedentes médicos</h2>
          <div className="space-y-1.5">
            <Label htmlFor="allergies">Alergias (separadas por coma)</Label>
            <Input id="allergies" value={form.allergies} onChange={e => set('allergies', e.target.value)}
              placeholder="Ej: Penicilina, AINE, Látex" />
            <p className="text-xs text-[#94A3B8]">Se mostrarán como advertencia en toda la historia clínica</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="allergies_detail">Detalle de alergias</Label>
            <Textarea id="allergies_detail" value={form.allergies_detail} onChange={e => set('allergies_detail', e.target.value)}
              placeholder="Descripción de reacciones, severidad, etc." rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="background_notes">Antecedentes generales</Label>
            <Textarea id="background_notes" value={form.background_notes} onChange={e => set('background_notes', e.target.value)}
              placeholder="Enfermedades crónicas, cirugías previas, medicación habitual..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Cancelar</Button>
        <Button type="submit" disabled={loading} className="flex-1 bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white">
          {loading ? 'Guardando...' : 'Guardar paciente'}
        </Button>
      </div>
    </form>
  )
}
