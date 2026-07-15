/** Validadores reutilizáveis (on blur / submit) */

export type FieldErrors = Record<string, string | undefined>

export function required(value: string, label = 'Campo') {
  if (!value.trim()) return `${label} é obrigatório.`
  return undefined
}

export function emailOptional(value: string) {
  const v = value.trim()
  if (!v) return undefined
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Informe um e-mail válido.'
  return undefined
}

export function emailRequired(value: string) {
  const v = value.trim()
  if (!v) return 'E-mail é obrigatório.'
  return emailOptional(v)
}

export function minLength(value: string, min: number, label = 'Campo') {
  if (value.trim().length < min) return `${label} deve ter ao menos ${min} caracteres.`
  return undefined
}

export function maxLength(value: string, max: number, label = 'Campo') {
  if (value.trim().length > max) return `${label} deve ter no máximo ${max} caracteres.`
  return undefined
}

export function positiveNumber(value: number | string, label = 'Valor') {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n <= 0) return `${label} deve ser um número positivo.`
  return undefined
}

export function urlOptional(value: string) {
  const v = value.trim()
  if (!v) return undefined
  try {
    // aceita com ou sem protocolo
    const u = v.startsWith('http') ? v : `https://${v}`
    // eslint-disable-next-line no-new
    new URL(u)
    return undefined
  } catch {
    return 'Informe uma URL válida.'
  }
}

export function firstError(errors: FieldErrors) {
  return Object.values(errors).find(Boolean)
}

export function hasErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean)
}
