import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Button, Card, PageHeader, ProgressBar } from '../components/ui'
import { methodAverage } from '../lib/score'

export function Metodo() {
  const { user, updateMethodProgress } = useApp()
  const toast = useToast()
  if (!user) return null
  const avg = methodAverage(user.method)

  return (
    <div>
      <PageHeader
        kicker="Método Sou do Bem"
        title="5 pilares para uma vida mais ética, presente e relacional."
        description={`Evolução média ${avg}%. Os dados ficam salvos no seu perfil e entram no cálculo do Score (25%).`}
      />
      <div className="space-y-4">
        {user.method.map((pillar, index) => (
          <Card key={pillar.id}>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary font-extrabold text-primary-foreground">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold">{pillar.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{pillar.description}</p>
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="font-semibold">Sua evolução</span>
                    <span className="font-bold">{pillar.progress}%</span>
                  </div>
                  <ProgressBar value={pillar.progress} />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={pillar.progress}
                    onChange={(e) => {
                      void updateMethodProgress(pillar.id, Number(e.target.value))
                    }}
                    onMouseUp={(e) => {
                      const v = Number((e.target as HTMLInputElement).value)
                      toast.success(`${pillar.title}: ${v}% salvo.`)
                    }}
                    onTouchEnd={(e) => {
                      const v = Number((e.target as HTMLInputElement).value)
                      toast.success(`${pillar.title}: ${v}% salvo.`)
                    }}
                    className="mt-3 w-full accent-[var(--color-primary)] min-h-11"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Salvo automaticamente no servidor</p>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Práticas sugeridas: {pillar.practices.join(' · ')}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-6 bg-accent/50">
        <h3 className="font-bold">Quer um plano de 7 dias personalizado para o pilar com menor evolução?</h3>
        <Link to="/app/ia" className="mt-3 inline-block">
          <Button>Pedir à IA</Button>
        </Link>
      </Card>
    </div>
  )
}
