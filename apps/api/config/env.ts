import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV:      z.enum(['development', 'test', 'production']).default('development'),
  PORT:          z.coerce.number().default(3000),
  LOG_LEVEL:     z.enum(['trace','debug','info','warn','error']).default('info'),
  DATABASE_URL:  z.string().url(),
  REDIS_URL:     z.string().url().default('redis://localhost:6379'),
  JWT_SECRET:    z.string().min(32),
  CORS_ORIGIN:   z.string().default('*'),

  // Public base URL for share links (e.g. https://familycart.example.com)
  // If empty, share links will be derived from the request Host header.
  APP_URL:       z.string().default(''),

  // Host machine LAN IP (auto-detected by start.sh)
  // Used for QR login codes so phones on the same Wi-Fi can reach the API.
  HOST_LAN_IP:   z.string().default(''),

  // Twilio
  TWILIO_SID:    z.string(),
  TWILIO_TOKEN:  z.string(),
  TWILIO_FROM:   z.string(),

  // S3 / Cloudflare R2
  S3_ENDPOINT:   z.string().url().or(z.literal('')),
  S3_BUCKET:     z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_PUBLIC_URL: z.string().url().or(z.literal('')),

  // OpenAI (leave blank to disable AI image search)
  OPENAI_API_KEY: z.string().default(''),
})

export const env = EnvSchema.parse(process.env)
