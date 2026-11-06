import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  MIDTRANS_SERVER_KEY: z.string().optional(),
  INTERNAL_SERVICE_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  ORDER_EXPIRY_MINUTES: z.coerce.number().int().min(1).default(30),
  ORDER_SWEEP_INTERVAL_MS: z.coerce.number().int().min(10_000).default(300_000),
  BULLMQ_ENABLED: z.enum(['true', 'false']).default('true'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format())
  throw new Error('Environment variable validation failed')
}

export const config = parsed.data
