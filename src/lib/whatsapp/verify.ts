import { createHmac } from 'crypto'

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) return false
  const expected = createHmac('sha256', appSecret).update(payload).digest('hex')
  return `sha256=${expected}` === signature
}
