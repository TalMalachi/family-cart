import twilio from 'twilio'
import { env } from '../../config/env'

const client = twilio(env.TWILIO_SID, env.TWILIO_TOKEN)

export const sms = {
  send: async (to: string, body: string) => {
    if (env.NODE_ENV === 'development') {
      console.log(`[SMS → ${to}] ${body}`)
      return
    }
    await client.messages.create({ to, from: env.TWILIO_FROM, body })
  },
}
