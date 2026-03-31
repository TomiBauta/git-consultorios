import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología', gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología', clinica_medica: 'Clínica Médica',
}
const DX_TYPE: Record<string, string> = { definitivo: 'Definitivo', presuntivo: 'Presuntivo', cronico: 'Crónico' }
const TX_TYPE: Record<string, string> = { medicamento: '💊', procedimiento: '🔬', indicacion: '📋', derivacion: '➡️' }

export default async function ConsultaPage({ params }: { params: Promise<{ patientId: string; consultationId: string }> }) {
  const { patientId, consultationId } = await params
  const supabase = await createClient()

  const { data: c } = await supabase
    .from('consultations')
    .select(`*, profiles!consultations_doctor_id_fkey(full_name),
      diagnoses(id, icd10_code, icd10_description, type, is_primary, notes),
      treatments(id, type, name, dosage, frequency, duration, instructions, is_active)`)
    .eq('id', consultationId)
    .single()

  if (!c) notFound()

  const doctor = (c as any).profiles as any
  const diagnoses = (c as any).diagnoses ?? []
  const treatments = (c as any).treatments ?? []

  const vitals = [
    c.weight_kg    && `Peso: ${c.weight_kg} kg`,
    c.height_cm    && `Talla: ${c.height_cm} cm`,
    c.blood_pressure && `T/A: ${c.blood_pressure}`,
    c.heart_rate   && `FC: ${c.heart_rate} lpm`,
    c.temperature  && `Temp: ${c.temperature}°C`,
    c.glucose      && `Glucemia: ${c.glucose} mg/dL`,
  ].filter(Boolean)

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-[#F0F9FF] text-[#0891B2] rounded-full font-medium">
              {SPECIALTY_LABELS[c.specialty] ?? c.specialty}
            </span>
            {c.is_draft && <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Borrador</span>}
          </div>
          <p className="text-lg font-semibold text-[#0F172A] mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {new Date(c.consulted_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-sm text-[#64748B]">{doctor?.full_name}</p>
        </div>
      </div>

      {/* Signos vitales */}
      {vitals.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {vitals.map((v, i) => (
            <span key={i} className="text-xs px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#334155]">{v}</span>
          ))}
        </div>
      )}

      {/* SOAP */}
      {[
        { label: 'Motivo de consulta', value: c.reason },
        { label: 'Subjetivo — Anamnesis', value: c.subjective },
        { label: 'Objetivo — Examen físico', value: c.objective },
        { label: 'Evaluación', value: c.assessment },
        { label: 'Plan terapéutico', value: c.plan },
      ].filter(s => s.value).map(s => (
        <div key={s.label} className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-2">{s.label}</p>
          <p className="text-sm text-[#334155] whitespace-pre-wrap">{s.value}</p>
        </div>
      ))}

      {/* Diagnósticos */}
      {diagnoses.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-3">Diagnósticos CIE-10</p>
          <div className="space-y-2">
            {diagnoses.map((d: any) => (
              <div key={d.id} className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-[#0891B2] w-16 shrink-0">{d.icd10_code}</span>
                <span className="text-sm text-[#334155] flex-1">{d.icd10_description}</span>
                <span className="text-xs text-[#94A3B8]">{DX_TYPE[d.type] ?? d.type}</span>
                {d.is_primary && <span className="text-xs text-[#0891B2] font-medium">Principal</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tratamientos */}
      {treatments.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
          <p className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-3">Tratamientos</p>
          <div className="space-y-2">
            {treatments.map((t: any) => (
              <div key={t.id} className="flex items-start gap-2 py-1">
                <span className="text-base shrink-0 mt-0.5">{TX_TYPE[t.type] ?? '•'}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0F172A]">
                    {t.name}{t.dosage ? ` ${t.dosage}` : ''}
                  </p>
                  {(t.frequency || t.duration) && (
                    <p className="text-xs text-[#64748B]">
                      {[t.frequency, t.duration].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {t.instructions && <p className="text-xs text-[#94A3B8]">{t.instructions}</p>}
                </div>
                {!t.is_active && <span className="text-xs text-[#94A3B8]">Inactivo</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
