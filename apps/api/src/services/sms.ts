import twilio from 'twilio'
import { env } from '../../config/env'

let client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (!env.TWILIO_SID || !env.TWILIO_TOKEN) return null
  if (!client) client = twilio(env.TWILIO_SID, env.TWILIO_TOKEN)
  return client
}

export const sms = {
  send: async (to: string, body: string) => {
    const tw = getClient()
    if (env.NODE_ENV === 'development' || !tw) {
      console.log(`[SMS → ${to}] ${body}`)
      return
    }
    await tw.messages.create({ to, from: env.TWILIO_FROM, body })
  },
}
