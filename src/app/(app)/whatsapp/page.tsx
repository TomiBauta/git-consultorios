import { createClient } from '@/lib/supabase/server'
import WhatsAppClient from './WhatsAppClient'

export default async function WhatsAppPage() {
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('whatsapp_conversations')
    .select('id, phone_number, status, updated_at, patients(first_name, last_name, dni)')
    .order('updated_at', { ascending: false })
    .limit(50)

  return (
    <WhatsAppClient conversations={(conversations ?? []) as any} />
  )
}
