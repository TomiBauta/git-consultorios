import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología', gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología', clinica_medica: 'Clínica Médica',
}

export default async function HistoriaPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params
  const supabase = await createClient()

  const { data: consultations } = await supabase
    .from('consultations')
    .select(`
      id, consulted_at, specialty, reason, assessment, is_draft,
      profiles!consultations_doctor_id_fkey (full_name),
      diagnoses (icd10_code, icd10_description, is_primary, type),
      treatments (name, type, dosage, frequency, is_active)
    `)
    .eq('patient_id', patientId)
    .order('consulted_at', { ascending: false })

  const { data: patient } = await supabase
    .from('patients')
    .select('background_notes, allergies_detail')
    .eq('id', patientId)
    .single()

  return (
    <div className="space-y-4">
      {/* Antecedentes */}
      {patient?.background_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-1">Antecedentes generales</p>
          <p className="text-sm text-amber-900">{patient.background_notes}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-[#0F172A]">Historia clínica</h2>
        <Link href={`/pacientes/${patientId}/consultas/nueva`}>
          <button className="text-sm bg-[#1B3A6B] hover:bg-[#2D5AA0] text-white px-4 py-2 rounded-lg transition-colors">
            + Nueva consulta
          </button>
        </Link>
      </div>

      {/* Timeline */}
      {!consultations || consultations.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl text-center py-14 text-[#94A3B8]">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">No hay consultas registradas</p>
          <Link href={`/pacientes/${patientId}/consultas/nueva`} className="text-sm text-[#0891B2] hover:underline mt-2 inline-block">
            Registrar primera consulta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((c: any) => {
            const doctor = c.profiles as any
            const primaryDx = c.diagnoses?.find((d: any) => d.is_primary) ?? c.diagnoses?.[0]
            const activeTreatments = c.treatments?.filter((t: any) => t.is_active && t.type === 'medicamento') ?? []

            return (
              <Link key={c.id} href={`/pacientes/${patientId}/consultas/${c.id}`}>
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#BFDBFE] hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 bg-[#F0F9FF] text-[#0891B2] rounded-full">
                          {SPECIALTY_LABELS[c.specialty] ?? c.specialty}
                        </span>
                        {c.is_draft && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Borrador</span>
                        )}
                        <span className="text-xs text-[#94A3B8]">
                          {new Date(c.consulted_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-[#0F172A] mt-2">
                        {primaryDx ? `${primaryDx.icd10_code} · ${primaryDx.icd10_description}` : c.reason ?? 'Sin diagnóstico principal'}
                      </p>
                      {c.assessment && (
                        <p className="text-sm text-[#64748B] mt-1 line-clamp-2">{c.assessment}</p>
                      )}
                      {activeTreatments.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {activeTreatments.slice(0, 3).map((t: any, i: number) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-[#64748B]">
                              {t.name}{t.dosage ? ` ${t.dosage}` : ''}
                            </span>
                          ))}
                          {activeTreatments.length > 3 && (
                            <span className="text-xs text-[#94A3B8]">+{activeTreatments.length - 3} más</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[#94A3B8]">{doctor?.full_name?.replace('Dr. ', '').replace('Dra. ', '')}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
