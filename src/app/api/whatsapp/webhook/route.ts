import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyWebhookSignature } from '@/lib/whatsapp/verify'

// GET: verificación del webhook por Meta
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST: mensajes entrantes
export async function POST(request: NextRequest) {
  // Verificar firma HMAC (si el secret está configurado)
  if (process.env.WHATSAPP_APP_SECRET) {
    const signature = request.headers.get('x-hub-signature-256') ?? ''
    const body = await request.text()
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    // Re-parsear body ya que lo leímos como text
    try {
      const payload = JSON.parse(body)
      return handlePayload(payload)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
  }

  const payload = await request.json()
  // ACK inmediato a WhatsApp (obligatorio < 15s)
  handlePayload(payload) // fire-and-forget
  return NextResponse.json({ status: 'ok' }, { status: 200 })
}

async function handlePayload(payload: any) {
  try {
    const entry = payload?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (value?.statuses) {
      // Es un status update (delivered, read), ignorar
      return NextResponse.json({ status: 'ok' })
    }

    const messages = value?.messages
    if (!messages || messages.length === 0) return NextResponse.json({ status: 'ok' })

    const msg = messages[0]
    if (msg.type !== 'text') return NextResponse.json({ status: 'ok' }) // solo texto por ahora

    const phoneNumber = msg.from
    const messageText = msg.text?.body ?? ''
    const waMessageId = msg.id

    const supabase = createServiceClient()

    // Obtener o crear conversación
    let { data: conversation } = await supabase
      .from('whatsapp_conversations')
      .select('id, status')
      .eq('phone_number', phoneNumber)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('whatsapp_conversations')
        .insert({ phone_number: phoneNumber, status: 'active' })
        .select('id, status')
        .single()
      conversation = newConv
    }

    if (!conversation) return NextResponse.json({ error: 'Could not create conversation' }, { status: 500 })

    // Si está escalada, no procesar con el agente
    if (conversation.status === 'escalated') {
      return NextResponse.json({ status: 'escalated' })
    }

    // Evitar procesar mensajes duplicados
    const { data: existing } = await supabase
      .from('whatsapp_messages')
      .select('id')
      .eq('wa_message_id', waMessageId)
      .single()

    if (existing) return NextResponse.json({ status: 'duplicate' })

    // Procesar con el agente en background
    const { runAgent } = await import('@/lib/anthropic/agent')
    runAgent(conversation.id, phoneNumber, messageText).catch(console.error)

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
