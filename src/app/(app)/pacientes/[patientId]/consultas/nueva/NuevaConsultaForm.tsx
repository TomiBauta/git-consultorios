'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología', gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología', clinica_medica: 'Clínica Médica',
}

type DiagnosisRow = { icd10_code: string; icd10_description: string; type: string; is_primary: boolean }
type TreatmentRow = { type: string; name: string; dosage: string; frequency: string; duration: string; instructions: string }

export default function NuevaConsultaForm({
  patient, profile, appointmentId, defaultSpecialty, defaultReason,
}: {
  patient: any; profile: any; appointmentId: string | null
  defaultSpecialty: string; defaultReason: string
}) {
  const router = useRouter()
  const params = useParams()
  const patientId = params.patientId as string
  const supabase = createClient()

  const [specialty, setSpecialty] = useState(defaultSpecialty)
  const [reason, setReason]       = useState(defaultReason)
  const [subjective, setSubj]     = useState('')
  const [objective, setObj]       = useState('')
  const [assessment, setAssess]   = useState('')
  const [plan, setPlan]           = useState('')
  // Signos vitales
  const [weight, setWeight]       = useState('')
  const [height, setHeight]       = useState('')
  const [bp, setBp]               = useState('')
  const [hr, setHr]               = useState('')
  const [temp, setTemp]           = useState('')
  const [glucose, setGlucose]     = useState('')
  // Diagnósticos
  const [diagnoses, setDiagnoses] = useState<DiagnosisRow[]>([])
  const [dxSearch, setDxSearch]   = useState('')
  const [dxResults, setDxResults] = useState<any[]>([])
  // Tratamientos
  const [treatments, setTreatments] = useState<TreatmentRow[]>([])
  const [showTxForm, setShowTxForm]  = useState(false)
  const [newTx, setNewTx]            = useState<TreatmentRow>({ type: 'medicamento', name: '', dosage: '', frequency: '', duration: '', instructions: '' })

  const [loading, setLoading]     = useState(false)
  const [isDraft, setIsDraft]     = useState(false)
  const [error, setError]         = useState('')

  // Buscar ICD-10
  async function searchDx(q: string) {
    setDxSearch(q)
    if (q.length < 2) { setDxResults([]); return }
    const { data } = await supabase
      .from('icd10_catalog')
      .select('code, description')
      .or(`code.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(8)
    setDxResults((data ?? []).map((d: any) => ({ icd10_code: d.code, icd10_description: d.description })))
  }

  function addDiagnosis(dx: any) {
    if (diagnoses.find(d => d.icd10_code === dx.icd10_code)) return
    setDiagnoses(prev => [...prev, {
      icd10_code: dx.icd10_code,
      icd10_description: dx.icd10_description,
      type: 'definitivo',
      is_primary: prev.length === 0,
    }])
    setDxSearch(''); setDxResults([])
  }

  function removeDiagnosis(code: string) {
    setDiagnoses(prev => {
      const filtered = prev.filter(d => d.icd10_code !== code)
      if (filtered.length > 0 && !filtered.some(d => d.is_primary)) {
        filtered[0].is_primary = true
      }
      return filtered
    })
  }

  function addTreatment() {
    if (!newTx.name.trim()) return
    setTreatments(prev => [...prev, { ...newTx }])
    setNewTx({ type: 'medicamento', name: '', dosage: '', frequency: '', duration: '', instructions: '' })
    setShowTxForm(false)
  }

  async function handleSubmit(draft: boolean) {
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()

    const { data: consultation, error: err } = await supabase
      .from('consultations')
      .insert({
        patient_id:     patientId,
        appointment_id: appointmentId,
        doctor_id:      user!.id,
        specialty:      specialty || profile?.specialty || '',
        reason:         reason || null,
        subjective:     subjective || null,
        objective:      objective || null,
        assessment:     assessment || null,
        plan:           plan || null,
        weight_kg:      weight ? parseFloat(weight) : null,
        height_cm:      height ? parseFloat(height) : null,
        blood_pressure: bp || null,
        heart_rate:     hr ? parseInt(hr) : null,
        temperature:    temp ? parseFloat(temp) : null,
        glucose:        glucose ? parseFloat(glucose) : null,
        is_draft:       draft,
      })
      .select('id').single()

    if (err || !consultation) { setError(err?.message ?? 'Error'); setLoading(false); return }

    // Insertar diagnósticos
    if (diagnoses.length > 0) {
      await supabase.from('diagnoses').insert(
        diagnoses.map(d => ({ ...d, consultation_id: consultation.id }))
      )
    }

    // Insertar tratamientos
    if (treatments.length > 0) {
      await supabase.from('treatments').insert(
        treatments.map(t => ({
          consultation_id: consultation.id,
          patient_id:      patientId,
          type:            t.type,
          name:            t.name,
          dosage:          t.dosage || null,
          frequency:       t.frequency || null,
          duration:        t.duration || null,
          instructions:    t.instructions || null,
          is_active:       true,
        }))
      )
    }

    // Marcar turno como atendido si corresponde
    if (appointmentId) {
      await supabase.from('appointments').update({ status: 'atendido' }).eq('id', appointmentId)
    }

    router.push(`/pacientes/${patientId}/consultas/${consultation.id}`)
    router.refresh()
  }

  const showGlucose = specialty === 'diabetologia' || specialty === 'clinica_medica'

  return (
    <div className="space-y-5">
      {/* Especialidad */}
      {profile?.role !== 'doctor' && (
        <Card className="border-[#E2E8F0]">
          <CardContent className="pt-5 space-y-1.5">
            <Label>Especialidad</Label>
            <select value={specialty} onChange={e => setSpecialty(e.target.value)}
              className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 bg-white text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#0891B2]">
              <option value="">Seleccioná especialidad</option>
              {Object.entries(SPECIALTY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Signos vitales */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Signos vitales</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Peso (kg)</Label>
              <Input value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" type="number" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Talla (cm)</Label>
              <Input value={height} onChange={e => setHeight(e.target.value)} placeholder="170" type="number" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">T/A</Label>
              <Input value={bp} onChange={e => setBp(e.target.value)} placeholder="120/80" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">FC (lpm)</Label>
              <Input value={hr} onChange={e => setHr(e.target.value)} placeholder="72" type="number" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Temperatura (°C)</Label>
              <Input value={temp} onChange={e => setTemp(e.target.value)} placeholder="36.5" type="number" step="0.1" />
            </div>
            {showGlucose && (
              <div className="space-y-1.5">
                <Label className="text-xs">Glucemia (mg/dL)</Label>
                <Input value={glucose} onChange={e => setGlucose(e.target.value)} placeholder="100" type="number" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SOAP */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-4">
          <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Consulta (SOAP)</h2>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo de consulta</Label>
            <Input id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="¿Por qué consulta el paciente?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subjective">Subjetivo — Anamnesis</Label>
            <Textarea id="subjective" value={subjective} onChange={e => setSubj(e.target.value)}
              placeholder="Síntomas referidos por el paciente, evolución, antecedentes relevantes..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="objective">Objetivo — Examen físico</Label>
            <Textarea id="objective" value={objective} onChange={e => setObj(e.target.value)}
              placeholder="Hallazgos al examen físico, resultados de estudios..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assessment">Evaluación — Impresión diagnóstica</Label>
            <Textarea id="assessment" value={assessment} onChange={e => setAssess(e.target.value)}
              placeholder="Interpretación clínica..." rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan">Plan terapéutico</Label>
            <Textarea id="plan" value={plan} onChange={e => setPlan(e.target.value)}
              placeholder="Plan de tratamiento, indicaciones, derivaciones, próximo control..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Diagnósticos ICD-10 */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-3">
          <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Diagnósticos CIE-10</h2>
          <div className="relative">
            <Input
              value={dxSearch}
              onChange={e => searchDx(e.target.value)}
              placeholder="Buscar por código o descripción (ej: E11, diabetes...)"
            />
            {dxResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-[#E2E8F0] rounded shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                {dxResults.map((dx: any) => (
                  <button key={dx.icd10_code} type="button" onClick={() => addDiagnosis(dx)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F8FAFC] border-b border-[#F1F5F9] last:border-b-0 transition-colors">
                    <span className="text-xs font-mono font-semibold text-[#0891B2]">{dx.icd10_code}</span>
                    <span className="text-sm text-[#334155] ml-2">{dx.icd10_description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {diagnoses.length > 0 && (
            <div className="space-y-2">
              {diagnoses.map(d => (
                <div key={d.icd10_code} className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] rounded-lg">
                  <span className="text-xs font-mono font-semibold text-[#0891B2] w-16 shrink-0">{d.icd10_code}</span>
                  <span className="text-sm text-[#334155] flex-1 truncate">{d.icd10_description}</span>
                  <select value={d.type} onChange={e => setDiagnoses(prev => prev.map(x => x.icd10_code === d.icd10_code ? {...x, type: e.target.value} : x))}
                    className="text-xs border border-[#E2E8F0] rounded px-1 py-0.5 bg-white">
                    <option value="definitivo">Definitivo</option>
                    <option value="presuntivo">Presuntivo</option>
                    <option value="cronico">Crónico</option>
                  </select>
                  {d.is_primary && <span className="text-xs text-[#0891B2] font-medium">Principal</span>}
                  <button type="button" onClick={() => removeDiagnosis(d.icd10_code)} className="text-[#94A3B8] hover:text-red-500 text-sm">✕</button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-[#94A3B8]">
            ¿No encontrás el código? Los códigos CIE-10 se cargan desde el panel de administración.
          </p>
        </CardContent>
      </Card>

      {/* Tratamientos */}
      <Card className="border-[#E2E8F0]">
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm text-[#64748B] uppercase tracking-wide">Tratamientos y prescripciones</h2>
            <button type="button" onClick={() => setShowTxForm(true)} className="text-sm text-[#0891B2] hover:underline">+ Agregar</button>
          </div>
          {showTxForm && (
            <div className="border border-[#E2E8F0] rounded p-4 space-y-3 bg-[#FAFCFF]">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <select value={newTx.type} onChange={e => setNewTx(t => ({...t, type: e.target.value}))}
                    className="w-full text-sm border border-[#E2E8F0] rounded-lg px-2 py-1.5 bg-white">
                    <option value="medicamento">Medicamento</option>
                    <option value="procedimiento">Procedimiento</option>
                    <option value="indicacion">Indicación</option>
                    <option value="derivacion">Derivación</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nombre *</Label>
                  <Input value={newTx.name} onChange={e => setNewTx(t => ({...t, name: e.target.value}))} placeholder="Ej: Metformina" />
                </div>
                {newTx.type === 'medicamento' && <>
                  <div className="space-y-1">
                    <Label className="text-xs">Dosis</Label>
                    <Input value={newTx.dosage} onChange={e => setNewTx(t => ({...t, dosage: e.target.value}))} placeholder="500mg" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Frecuencia</Label>
                    <Input value={newTx.frequency} onChange={e => setNewTx(t => ({...t, frequency: e.target.value}))} placeholder="Cada 8 horas" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duración</Label>
                    <Input value={newTx.duration} onChange={e => setNewTx(t => ({...t, duration: e.target.value}))} placeholder="30 días" />
                  </div>
                </>}
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs">Instrucciones</Label>
                  <Input value={newTx.instructions} onChange={e => setNewTx(t => ({...t, instructions: e.target.value}))} placeholder="Con las comidas, en ayunas..." />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={addTreatment} className="bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white">Agregar</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowTxForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}
          {treatments.length > 0 && (
            <div className="space-y-2">
              {treatments.map((t, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] rounded-lg">
                  <span className="text-xs px-1.5 py-0.5 bg-white border border-[#E2E8F0] rounded text-[#64748B] capitalize">{t.type}</span>
                  <span className="text-sm font-medium text-[#0F172A] flex-1">{t.name}</span>
                  {t.dosage && <span className="text-xs text-[#64748B]">{t.dosage}</span>}
                  {t.frequency && <span className="text-xs text-[#94A3B8]">{t.frequency}</span>}
                  <button type="button" onClick={() => setTreatments(prev => prev.filter((_, j) => j !== i))}
                    className="text-[#94A3B8] hover:text-red-500 text-sm">✕</button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        <Button type="button" variant="outline" disabled={loading} onClick={() => handleSubmit(true)}>
          Guardar borrador
        </Button>
        <Button type="button" disabled={loading} onClick={() => handleSubmit(false)}
          className="flex-1 bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white">
          {loading ? 'Guardando...' : 'Guardar consulta'}
        </Button>
      </div>
    </div>
  )
}
