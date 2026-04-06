import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  doctor_id:    z.string().uuid(),
  scheduled_at: z.string().datetime(),
  full_name:    z.string().min(2).max(160),
  dni:          z.string().max(20).optional().default(''),
  phone:        z.string().min(6).max(25),
  reason:       z.string().max(300).optional().default(''),
})

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { full_name, doctor_id, scheduled_at, dni, phone, reason } = parsed.data

  // Separar nombre y apellido (última palabra = apellido)
  const parts = full_name.trim().split(/\s+/)
  const last_name  = parts.length > 1 ? parts[parts.length - 1] : parts[0]
  const first_name = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]

  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('book_appointment_public', {
    p_doctor_id:    doctor_id,
    p_scheduled_at: scheduled_at,
    p_first_name:   first_name,
    p_last_name:    last_name,
    p_dni:          dni,
    p_phone:        phone,
    p_reason:       reason,
  })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
