import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Tenta vários caminhos: raiz do monorepo, cwd, /app (docker)
const candidates = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  '/app/.env',
]

for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: false })
  }
}
// variáveis do container/compose têm prioridade se já existirem
dotenv.config({ override: false })

function trimKey(v: string | undefined) {
  if (!v) return ''
  // remove aspas acidentais e espaços
  return v.trim().replace(/^["']|["']$/g, '')
}

export const env = {
  PORT: Number(process.env.PORT || 3001),
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://soudobem:soudobem@localhost:5432/soudobem',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-soudobem-secret-change-me',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  OPENROUTER_API_KEY: trimKey(process.env.OPENROUTER_API_KEY),
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
  OPENROUTER_SITE_URL: process.env.OPENROUTER_SITE_URL || 'http://localhost:5173',
  OPENROUTER_SITE_NAME: process.env.OPENROUTER_SITE_NAME || 'Sou do Bem Local',
}
