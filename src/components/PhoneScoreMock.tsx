import type { CSSProperties } from 'react'

/** Mock de celular com Score do Bem — UI real, sem imagem genérica */

const dims = [
  { label: 'Confiança', value: 82 },
  { label: 'Empatia', value: 76 },
  { label: 'Ética', value: 88 },
  { label: 'Cooperação', value: 71 },
  { label: 'Responsabilidade', value: 79 },
] as const

const SCORE = 742
const MAX = 1000
const pct = SCORE / MAX

export function PhoneScoreMock() {
  const r = 54
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct)

  return (
    <div className="phone-score-stage" aria-hidden={false}>
      <div className="phone-score-glow" aria-hidden />
      <div className="phone-score-device" role="img" aria-label="Celular mostrando Score do Bem 742 de 1000, selo Confiável">
        {/* Dynamic island / notch */}
        <div className="phone-score-notch" aria-hidden />

        <div className="phone-score-screen">
          <header className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-[10px] font-extrabold shadow-sm">
                SB
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold leading-tight truncate">Sou do Bem</p>
                <p className="text-[9px] text-muted-foreground font-medium">Score de atitudes</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-100 text-amber-950 px-2 py-0.5 text-[9px] font-bold shrink-0">
              Confiável
            </span>
          </header>

          <div className="phone-score-ring-wrap mt-4">
            <svg className="phone-score-ring" viewBox="0 0 128 128" aria-hidden>
              <circle className="phone-score-ring-track" cx="64" cy="64" r={r} />
              <circle
                className="phone-score-ring-value"
                cx="64"
                cy="64"
                r={r}
                style={
                  {
                    '--ring-c': c,
                    '--ring-offset': offset,
                  } as CSSProperties
                }
              />
            </svg>
            <div className="phone-score-ring-label">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Score</p>
              <p className="text-3xl font-extrabold tabular-nums tracking-tight leading-none">{SCORE}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">de {MAX}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1.5">
            {[
              { v: '128', l: 'GC' },
              { v: '12', l: 'dias' },
              { v: '5', l: 'dim.' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-muted/80 px-1.5 py-2 text-center">
                <p className="text-sm font-extrabold tabular-nums leading-none">{s.v}</p>
                <p className="text-[8px] text-muted-foreground font-semibold mt-1 uppercase tracking-wide">
                  {s.l}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {dims.map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-muted-foreground font-medium">{d.label}</span>
                  <span className="font-bold tabular-nums">{d.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="phone-score-bar h-full rounded-full bg-primary"
                    style={{ ['--bar-w' as string]: `${d.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-center text-[9px] text-muted-foreground leading-snug px-1">
            Reputação por atitudes reais — não por curtidas.
          </p>
        </div>

        {/* Home indicator */}
        <div className="phone-score-home" aria-hidden />
      </div>
    </div>
  )
}
