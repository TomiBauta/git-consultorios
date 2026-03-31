const WA_BASE = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`

export async function sendWhatsAppMessage(to: string, text: string) {
  const res = await fetch(WA_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error: ${err}`)
  }
  return res.json()
}
