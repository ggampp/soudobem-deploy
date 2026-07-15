import { useApp } from '../context/AppContext'
import { scoreHistory as seedHistory } from '../data/seed'
import { Badge, Card, PageHeader, ProgressBar } from '../components/ui'
import { formatRelative } from '../lib/format'
import { avgDimensions, methodAverage, relationsAverage } from '../lib/score'

const dimMeta = [
  { key: 'confianca' as const, label: 'Confiança', desc: 'Quanto as pessoas confiam em você.', weight: 'avaliações + combinações' },
  { key: 'empatia' as const, label: 'Empatia', desc: 'Capacidade de se conectar com o outro.', weight: 'desafios + escuta' },
  { key: 'etica' as const, label: 'Ética', desc: 'Integridade nos seus atos.', weight: 'mediações + certificação' },
  { key: 'cooperacao' as const, label: 'Cooperação', desc: 'Construir junto, somar com o outro.', weight: 'fundo + comunidade' },
  { key: 'responsabilidade' as const, label: 'Responsabilidade', desc: 'Coerência entre palavra e ação.', weight: 'acordos cumpridos' },
]

export function Score() {
  const { user } = useApp()
  if (!user) return null

  const dim = user.scoreBreakdown?.dimensionsAvg ?? avgDimensions(user.dimensions)
  const met = user.scoreBreakdown?.methodAvg ?? methodAverage(user.method)
  const rel = user.scoreBreakdown?.relationsAvg ?? relationsAverage(user.relations)
  const formula = user.scoreBreakdown?.formula ?? 'Score = 55% dimensões + 25% método + 20% relações'

  const history =
    user.scoreHistory && user.scoreHistory.length > 1
      ? user.scoreHistory.map((h) => ({
          label: new Date(h.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          score: h.score as number,
        }))
      : seedHistory.map((p) => ({ label: p.month, score: p.score }))

  const max = 100
  const events = user.scoreEvents || []

  return (
    <div>
      <PageHeader
        kicker="Score do Bem"
        title={`${user.score} / 100 · ${user.seal}`}
        description="Reputação comportamental calculada no servidor a cada ação relevante — transparente e auditável."
      />

      <Card className="mb-6 bg-gradient-to-br from-primary/20 to-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Como o Score funciona</p>
        <p className="mt-2 font-bold text-lg">{formula}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-2xl bg-card/80 border border-border p-3">
            <p className="font-extrabold text-2xl">{dim}</p>
            <p className="text-muted-foreground">Dimensões × 55%</p>
            <p className="text-xs mt-1">= {Math.round(dim * 0.55)} pts</p>
          </div>
          <div className="rounded-2xl bg-card/80 border border-border p-3">
            <p className="font-extrabold text-2xl">{met}%</p>
            <p className="text-muted-foreground">Método × 25%</p>
            <p className="text-xs mt-1">= {Math.round(met * 0.25)} pts</p>
          </div>
          <div className="rounded-2xl bg-card/80 border border-border p-3">
            <p className="font-extrabold text-2xl">{rel === null ? '—' : rel}</p>
            <p className="text-muted-foreground">Relações × 20%</p>
            <p className="text-xs mt-1">
              = {rel === null ? Math.round(dim * 0.2) + ' (fallback dims)' : Math.round(rel * 0.2) + ' pts'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <Badge tone="gold">85+ Exemplar</Badge>
          <Badge tone="success">75+ Confiável</Badge>
          <Badge tone="info">60+ Em evolução</Badge>
          <Badge>0–59 Iniciante</Badge>
        </div>
      </Card>

      <h2 className="text-lg font-extrabold mb-3">Como subir o Score</h2>
      <div className="grid gap-2 sm:grid-cols-2 mb-8">
        {[
          'Cadastre e avalie relações reais (5 dimensões)',
          'Ajuste o Método com honestidade (5 pilares)',
          'Aceite e conclua o desafio do dia',
          'Resolva mediações com acordo',
          'Apoie causas no Fundo do Bem',
          'Publique na comunidade e complete a biblioteca',
          'Avalie empresas e peça certificação',
        ].map((t) => (
          <div key={t} className="card px-4 py-3 text-sm font-medium">
            {t}
          </div>
        ))}
      </div>

      <Card className="mb-6">
        <p className="text-sm font-semibold mb-4">Histórico do Score</p>
        <div className="flex items-end gap-2 h-40">
          {history.map((p, i) => (
            <div key={`${p.label}-${i}`} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-primary to-primary-glow min-h-[4px]"
                style={{ height: `${(p.score / max) * 100}%` }}
                title={`${p.score}`}
              />
              <span className="text-[9px] uppercase text-muted-foreground truncate w-full text-center">
                {p.label}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {user.scoreHistory && user.scoreHistory.length > 1
            ? 'Histórico real gravado no PostgreSQL a cada recálculo.'
            : 'Histórico ilustrativo — execute ações (avaliar relação, método…) para gerar trilha real.'}
        </p>
      </Card>

      <h2 className="text-lg font-extrabold mb-3">Dimensões do Score</h2>
      <div className="grid gap-3 md:grid-cols-2 mb-8">
        {dimMeta.map((d) => (
          <Card key={d.key}>
            <div className="flex justify-between items-baseline">
              <h3 className="font-bold">{d.label}</h3>
              <span className="text-xl font-extrabold">{user.dimensions[d.key]}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{d.desc}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Alimentado por: {d.weight}</p>
            <div className="mt-3">
              <ProgressBar value={user.dimensions[d.key]} />
            </div>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-extrabold mb-3">Eventos recentes do Score</h2>
      {events.length === 0 ? (
        <Card className="mb-8">
          <p className="text-sm text-muted-foreground">
            Ainda não há eventos. Avalie uma relação ou atualize o Método para registrar a primeira trilha.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2 mb-8">
          {events.map((e) => (
            <li key={e.id} className="card px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-semibold">{e.label}</p>
                <p className="text-xs text-muted-foreground">
                  {e.kind} · {formatRelative(e.createdAt)}
                </p>
              </div>
              <span className="font-extrabold">
                {e.scoreBefore} → {e.scoreAfter}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-lg font-extrabold mb-3">Conquistas</h2>
      <div className="space-y-2">
        {user.achievements.map((a) => (
          <Card key={a} className="py-4">
            <p className="text-sm font-semibold">{a}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
