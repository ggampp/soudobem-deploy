export type Dimensions = {
  confianca: number
  empatia: number
  etica: number
  cooperacao: number
  responsabilidade: number
}

export function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function avg(nums: number[]) {
  if (!nums.length) return 0
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

export function avgDimensions(d: Dimensions) {
  return avg([d.confianca, d.empatia, d.etica, d.cooperacao, d.responsabilidade])
}

export function sealFromScore(score: number) {
  if (score >= 85) return 'Exemplar'
  if (score >= 75) return 'Confiável'
  if (score >= 60) return 'Em evolução'
  return 'Iniciante'
}

export function computeScore(dims: Dimensions, methodAvg: number, relationsAvg: number | null) {
  const dim = avgDimensions(dims)
  const rel = relationsAvg === null ? dim : relationsAvg
  return clamp(dim * 0.55 + methodAvg * 0.25 + rel * 0.2)
}
