import type { MethodPillar, Relation, ScoreDimensions, UserProfile } from '../types'
import { average, clamp } from './format'

export function avgDimensions(d: ScoreDimensions): number {
  return average([d.confianca, d.empatia, d.etica, d.cooperacao, d.responsabilidade])
}

export function methodAverage(method: MethodPillar[]): number {
  if (!method.length) return 0
  return average(method.map((p) => p.progress))
}

export function relationsAverage(relations: Relation[]): number | null {
  if (!relations.length) return null
  return average(relations.map((r) => r.score))
}

/** Score único: 55% dimensões + 25% método + 20% relações (ou fallback dimensões) */
export function computeScore(user: Pick<UserProfile, 'dimensions' | 'method' | 'relations'>): number {
  const dim = avgDimensions(user.dimensions)
  const met = methodAverage(user.method)
  const rel = relationsAverage(user.relations)
  const relPart = rel === null ? dim : rel
  return clamp(Math.round(dim * 0.55 + met * 0.25 + relPart * 0.2))
}

export function sealFromScore(score: number): string {
  if (score >= 85) return 'Exemplar'
  if (score >= 75) return 'Confiável'
  if (score >= 60) return 'Em evolução'
  return 'Iniciante'
}

export function applyDimensionBoost(
  dims: ScoreDimensions,
  key: keyof ScoreDimensions,
  amount: number,
): ScoreDimensions {
  return { ...dims, [key]: clamp(dims[key] + amount) }
}

export function blendDimensions(base: ScoreDimensions, evalDims: ScoreDimensions, weight = 0.15): ScoreDimensions {
  const keys: (keyof ScoreDimensions)[] = [
    'confianca',
    'empatia',
    'etica',
    'cooperacao',
    'responsabilidade',
  ]
  const next = { ...base }
  for (const k of keys) {
    next[k] = clamp(Math.round(base[k] * (1 - weight) + evalDims[k] * weight))
  }
  return next
}

export function withRecalculatedScore(user: UserProfile): UserProfile {
  const score = computeScore(user)
  return {
    ...user,
    score,
    seal: sealFromScore(score),
  }
}
