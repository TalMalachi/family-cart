import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV:      z.enum(['development', 'test', 'production']).default('development'),
  PORT:          z.coerce.number().default(3000),
  LOG_LEVEL:     z.enum(['trace','debug','info','warn','error']).default('info'),
  DATABASE_URL:  z.string().url(),
  REDIS_URL:     z.string().url().default('redis://localhost:6379'),
  JWT_SECRET:    z.string().min(32),
  CORS_ORIGIN:   z.string().default('*'),

  // Twilio
  TWILIO_SID:    z.string(),
  TWILIO_TOKEN:  z.string(),
  TWILIO_FROM:   z.string(),

  // S3 / Cloudflare R2
  S3_ENDPOINT:   z.string().url(),
  S3_BUCKET:     z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_PUBLIC_URL: z.string().url(),
})

export const env = EnvSchema.parse(process.env)
