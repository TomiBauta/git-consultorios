import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function WhatsAppPage() {
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('whatsapp_conversations')
    .select(`
      id, phone_number, status, created_at, updated_at,
      patients (first_name, last_name)
    `)
    .order('updated_at', { ascending: false })
    .limit(50)

  const STATUS_STYLES: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    escalated: 'bg-red-100 text-red-700',
    closed:    'bg-gray-100 text-gray-500',
  }
  const STATUS_LABELS: Record<string, string> = {
    active: 'Activa', escalated: 'Escalada', closed: 'Cerrada',
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[#0F172A]" style={{ fontFamily: 'Poppins, sans-serif' }}>WhatsApp</h1>
        <p className="text-sm text-[#64748B] mt-1">Conversaciones del agente de IA</p>
      </div>

      {!conversations || conversations.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl text-center py-14 text-[#94A3B8]">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm font-medium">Sin conversaciones todavía</p>
          <p className="text-xs mt-1">Las conversaciones aparecerán aquí cuando los pacientes escriban por WhatsApp</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
          {conversations.map((conv: any) => {
            const patient = conv.patients as any
            const timeAgo = new Date(conv.updated_at).toLocaleDateString('es-AR', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            })
            return (
              <Link key={conv.id} href={`/whatsapp/${conv.id}`}>
                <div className="flex items-center gap-4 px-4 py-4 border-b border-[#F8FAFC] last:border-b-0 hover:bg-[#F8FAFC] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[#E0F7FB] flex items-center justify-center text-[#0891B2] font-semibold shrink-0">
                    {patient ? `${patient.first_name[0]}${patient.last_name[0]}` : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#0F172A]">
                      {patient ? `${patient.first_name} ${patient.last_name}` : conv.phone_number}
                    </p>
                    <p className="text-xs text-[#94A3B8]">{conv.phone_number}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[conv.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[conv.status] ?? conv.status}
                    </span>
                    <p className="text-xs text-[#94A3B8]">{timeAgo}</p>
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
