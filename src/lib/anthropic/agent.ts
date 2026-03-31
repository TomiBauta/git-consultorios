import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/service'
import { agentTools } from './tools'
import { sendWhatsAppMessage } from '@/lib/whatsapp/client'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SPECIALTY_LABELS: Record<string, string> = {
  oftalmologia: 'Oftalmología',
  gastroenterologia: 'Gastroenterología',
  diabetologia: 'Diabetología',
  clinica_medica: 'Clínica Médica',
}

const SYSTEM_PROMPT = `Sos el asistente virtual de DIT Consultorios Médicos (Buenos Aires, Argentina).
Especialidades: Oftalmología, Gastroenterología, Diabetología y Clínica Médica.
Médicos: Dr. Mariano Martinez Canter (Oftalmología), Dra. Anabella Sacchi Falcone (Gastroenterología), Dr. Nicolas Miguel Raso (Diabetología).

Tu trabajo es:
1. Identificar al paciente por su número de WhatsApp o DNI.
2. Ayudarlo a consultar, confirmar, modificar o cancelar turnos.
3. Informar sobre disponibilidad horaria.
4. Escalar a un humano si la consulta está fuera de tu alcance.

Reglas importantes:
- Respondé siempre en español argentino, con trato de "vos".
- Sé amable, conciso y profesional.
- Nunca inventes información médica ni des diagnósticos.
- Si el paciente no está registrado en el sistema, pedile su nombre completo y DNI para que la recepción lo registre.
- Para confirmar acciones importantes (crear/cancelar turno), siempre pedí confirmación al paciente.
- Horario de atención: lunes a sábado. Para consultas urgentes fuera de horario, derivá al guardia más cercana.
- Usá las tools para todas las acciones concretas (no las simules).`

// ── Ejecutores de tools ──────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, string>, conversationId: string) {
  const supabase = createServiceClient()

  if (name === 'identify_patient') {
    const { phone, dni } = input
    let query = supabase.from('patients').select('id, first_name, last_name, dni').is('deleted_at', null)

    if (phone) {
      const normalized = phone.replace(/\D/g, '')
      query = query.or(`phone_whatsapp.ilike.%${normalized}%,phone.ilike.%${normalized}%`)
    }
    if (dni) query = query.eq('dni', dni)

    const { data } = await query.limit(1).single()

    if (data) {
      // Vincular paciente a la conversación
      await supabase.from('whatsapp_conversations')
        .update({ patient_id: data.id })
        .eq('id', conversationId)
      return { found: true, patient_id: data.id, name: `${data.first_name} ${data.last_name}`, dni: data.dni }
    }
    return { found: false }
  }

  if (name === 'check_availability') {
    const { specialty, date_from, date_to, doctor_id } = input

    // Obtener médicos de esa especialidad
    let doctorsQuery = supabase.from('profiles').select('id, full_name').eq('role', 'doctor').eq('specialty', specialty).eq('is_active', true)
    if (doctor_id) doctorsQuery = doctorsQuery.eq('id', doctor_id)
    const { data: doctors } = await doctorsQuery

    if (!doctors || doctors.length === 0) return { slots: [], message: 'No hay médicos disponibles para esa especialidad.' }

    // Obtener disponibilidad semanal
    const { data: availability } = await supabase
      .from('doctor_availability')
      .select('*')
      .in('doctor_id', doctors.map(d => d.id))
      .eq('is_active', true)

    if (!availability || availability.length === 0) return { slots: [], message: 'No hay horarios configurados para esa especialidad.' }

    // Obtener turnos ya ocupados en el rango
    const { data: taken } = await supabase
      .from('appointments')
      .select('doctor_id, scheduled_at, duration_mins')
      .in('doctor_id', doctors.map(d => d.id))
      .gte('scheduled_at', `${date_from}T00:00:00`)
      .lte('scheduled_at', `${date_to}T23:59:59`)
      .neq('status', 'cancelado')

    // Calcular slots libres
    const slots: { date: string; time: string; doctor: string; doctor_id: string }[] = []
    const from = new Date(date_from)
    const to = new Date(date_to)

    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay()
      const dayAvails = availability.filter(a => a.day_of_week === dow)

      for (const avail of dayAvails) {
        const doctor = doctors.find(doc => doc.id === avail.doctor_id)
        if (!doctor) continue

        const [sh, sm] = avail.start_time.split(':').map(Number)
        const [eh, em] = avail.end_time.split(':').map(Number)
        const slotMins = avail.slot_duration

        for (let mins = sh * 60 + sm; mins < eh * 60 + em; mins += slotMins) {
          const slotDate = new Date(d)
          slotDate.setHours(Math.floor(mins / 60), mins % 60, 0, 0)

          const isTaken = (taken ?? []).some(t => {
            const ta = new Date(t.scheduled_at)
            return t.doctor_id === avail.doctor_id &&
              Math.abs(ta.getTime() - slotDate.getTime()) < (t.duration_mins ?? 30) * 60000
          })

          if (!isTaken && slotDate > new Date()) {
            slots.push({
              date: slotDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
              time: slotDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
              doctor: doctor.full_name,
              doctor_id: doctor.id,
              iso: slotDate.toISOString(),
            } as any)
          }
        }
      }
    }

    return { slots: slots.slice(0, 10), total: slots.length }
  }

  if (name === 'get_patient_appointments') {
    const { patient_id } = input
    const { data } = await supabase
      .from('appointments')
      .select('id, scheduled_at, specialty, status, profiles!appointments_doctor_id_fkey(full_name)')
      .eq('patient_id', patient_id)
      .gte('scheduled_at', new Date().toISOString())
      .neq('status', 'cancelado')
      .order('scheduled_at')
      .limit(5)

    return {
      appointments: (data ?? []).map((a: any) => ({
        id: a.id,
        date: new Date(a.scheduled_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        time: new Date(a.scheduled_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        specialty: SPECIALTY_LABELS[a.specialty] ?? a.specialty,
        doctor: (a.profiles as any)?.full_name,
        status: a.status,
      }))
    }
  }

  if (name === 'create_appointment') {
    const { patient_id, doctor_id, specialty, scheduled_at, reason } = input
    const { data, error } = await supabase.from('appointments').insert({
      patient_id, doctor_id, specialty,
      scheduled_at: new Date(scheduled_at).toISOString(),
      status: 'confirmado',
      reason: reason ?? null,
    }).select('id').single()

    if (error) return { success: false, error: error.message }
    return { success: true, appointment_id: data.id }
  }

  if (name === 'cancel_appointment') {
    const { appointment_id, reason } = input
    const { error } = await supabase.from('appointments').update({
      status: 'cancelado',
      cancelled_reason: reason ?? 'Cancelado por el paciente via WhatsApp',
    }).eq('id', appointment_id)

    return { success: !error, error: error?.message }
  }

  if (name === 'reschedule_appointment') {
    const { appointment_id, new_scheduled_at } = input
    const { error } = await supabase.from('appointments').update({
      scheduled_at: new Date(new_scheduled_at).toISOString(),
      status: 'confirmado',
    }).eq('id', appointment_id)

    return { success: !error, error: error?.message }
  }

  if (name === 'escalate_to_human') {
    const { reason } = input
    await supabase.from('whatsapp_conversations').update({
      status: 'escalated',
      escalated_at: new Date().toISOString(),
      escalated_reason: reason,
    }).eq('id', conversationId)

    return { escalated: true }
  }

  return { error: `Tool desconocida: ${name}` }
}

// ── Loop principal del agente ────────────────────────────────────────────────

export async function runAgent(conversationId: string, phoneNumber: string, inboundText: string) {
  const supabase = createServiceClient()

  // Cargar historial de la conversación (últimos 20 mensajes)
  const { data: history } = await supabase
    .from('whatsapp_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  const messages: Anthropic.MessageParam[] = (history ?? [])
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Agregar el mensaje nuevo
  messages.push({ role: 'user', content: inboundText })

  // Guardar mensaje entrante
  await supabase.from('whatsapp_messages').insert({
    conversation_id: conversationId,
    direction: 'inbound',
    role: 'user',
    content: inboundText,
  })

  // Loop agentico con tool_use
  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: agentTools,
    messages,
  })

  let totalTokens = response.usage.input_tokens + response.usage.output_tokens

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUseBlocks) {
      const result = await executeTool(toolUse.name, toolUse.input as Record<string, string>, conversationId)
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) })
    }

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })

    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: agentTools,
      messages,
    })

    totalTokens += response.usage.input_tokens + response.usage.output_tokens
  }

  // Extraer respuesta de texto final
  const textBlock = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
  const replyText = textBlock?.text ?? 'Lo siento, no pude procesar tu consulta. Comunicate con nosotros al consultorio.'

  // Guardar respuesta
  await supabase.from('whatsapp_messages').insert({
    conversation_id: conversationId,
    direction: 'outbound',
    role: 'assistant',
    content: replyText,
    tokens_used: totalTokens,
    model_used: 'claude-sonnet-4-6',
  })

  // Actualizar timestamp conversación
  await supabase.from('whatsapp_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)

  // Enviar respuesta por WhatsApp
  await sendWhatsAppMessage(phoneNumber, replyText)

  return replyText
}
