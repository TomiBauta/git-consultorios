import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params
  const supabase = await createClient()

  const { data: conv } = await supabase
    .from('whatsapp_conversations')
    .select('*, patients(first_name, last_name, dni)')
    .eq('id', conversationId)
    .single()

  if (!conv) notFound()

  const { data: messages } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const patient = (conv as any).patients as any

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2 text-sm text-[#64748B]">
        <Link href="/whatsapp" className="hover:text-[#1B3A6B]">← WhatsApp</Link>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E0F7FB] flex items-center justify-center text-[#0891B2] font-semibold">
            {patient ? `${patient.first_name[0]}${patient.last_name[0]}` : '?'}
          </div>
          <div>
            <p className="font-medium text-[#0F172A]">
              {patient ? `${patient.first_name} ${patient.last_name}` : 'Paciente no identificado'}
            </p>
            <p className="text-xs text-[#94A3B8]">{(conv as any).phone_number}</p>
          </div>
        </div>
        {(conv as any).status === 'escalated' && (
          <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ⚠️ Escalada: {(conv as any).escalated_reason}
          </div>
        )}
      </div>

      {/* Mensajes */}
      <div className="space-y-2">
        {messages?.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
              msg.direction === 'outbound'
                ? 'bg-[#1B3A6B] text-white rounded-br-sm'
                : 'bg-white border border-[#E2E8F0] text-[#334155] rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-white/60' : 'text-[#94A3B8]'}`}>
                {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                {msg.tokens_used ? ` · ${msg.tokens_used} tokens` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
