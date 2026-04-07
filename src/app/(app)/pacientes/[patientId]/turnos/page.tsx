import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/agenda/StatusBadge'

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología', gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología', clinica_medica: 'Clínica Médica',
}

export default async function TurnosPacientePage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params
  const supabase = await createClient()

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, profiles!appointments_doctor_id_fkey(full_name)')
    .eq('patient_id', patientId)
    .order('scheduled_at', { ascending: false })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-[#0F172A]">Turnos</h2>
        <Link href="/agenda/nuevo" className="text-sm text-[#0891B2] hover:underline">+ Nuevo turno</Link>
      </div>
      {!appointments || appointments.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded text-center py-14 text-[#94A3B8]">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">Sin turnos registrados</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded overflow-hidden">
          {appointments.map((a: any) => {
            const doctor = a.profiles as any
            const d = new Date(a.scheduled_at)
            return (
              <Link key={a.id} href={`/agenda/${a.id}`}>
                <div className="flex items-center gap-4 px-4 py-3 border-b border-[#F8FAFC] last:border-b-0 hover:bg-[#F8FAFC] transition-colors">
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-medium text-[#334155]">
                      {d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#334155] truncate">{doctor?.full_name}</p>
                    <p className="text-xs text-[#94A3B8]">{SPECIALTY_LABELS[a.specialty] ?? a.specialty}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
