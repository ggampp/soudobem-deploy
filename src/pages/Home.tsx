import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, Target, TrendingUp, Trophy } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { normalizeRole } from '../lib/roles'
import { Badge, Button, Card, PageHeader, ProgressBar } from '../components/ui'

export function Home() {
  const { user, acceptChallenge, progressChallenge } = useApp()
  const toast = useToast()
  if (!user) return null

  const role = normalizeRole(user.role)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const ch = user.challenge
  const challengePct = Math.round((ch.progress / Math.max(1, ch.target)) * 100)

  const roleHome: Record<string, { title: string; cta: { to: string; label: string }[] }> = {
    pessoa: {
      title: 'Quero evoluir minhas relações.',
      cta: [
        { to: '/app/relacoes', label: 'Cadastrar / avaliar relação' },
        { to: '/app/metodo', label: 'Continuar Método' },
        { to: '/app/score', label: 'Ver Score' },
        { to: '/app/beneficios', label: 'Marketplace' },
      ],
    },
    empresa: {
      title: 'Quero certificar meu negócio.',
      cta: [
        { to: '/app/painel-empresa', label: 'Painel do negócio' },
        { to: '/app/empresas', label: 'Cadastrar empresa' },
        { to: '/app/beneficios', label: 'Benefícios' },
        { to: '/app/score', label: 'Score pessoal' },
      ],
    },
    influenciador: {
      title: 'Quero criar conteúdo do bem.',
      cta: [
        { to: '/app/painel-conteudo', label: 'Painel de conteúdo' },
        { to: '/app/comunidade', label: 'Publicar' },
        { to: '/app/influenciadores', label: 'Perfis' },
        { to: '/app/score', label: 'Score' },
      ],
    },
    executivo: {
      title: 'Quero atuar no território.',
      cta: [
        { to: '/app/executivo', label: 'Painel do território' },
        { to: '/app/empresas', label: 'Empresas regionais' },
        { to: '/app/mediacao', label: 'Mediações' },
        { to: '/app/comunidade', label: 'Comunidade' },
      ],
    },
    mediador: {
      title: 'Quero ajudar a resolver conflitos.',
      cta: [
        { to: '/app/painel-mediador', label: 'Fila de mediação' },
        { to: '/app/mediacao', label: 'Todas as mediações' },
        { to: '/app/metodo', label: 'Método' },
        { to: '/app/score', label: 'Score' },
      ],
    },
  }

  const home = roleHome[role] || roleHome.pessoa

  const dims = [
    ['Confiança', user.dimensions.confianca],
    ['Empatia', user.dimensions.empatia],
    ['Ética', user.dimensions.etica],
    ['Cooperação', user.dimensions.cooperacao],
    ['Responsabilidade', user.dimensions.responsabilidade],
  ] as const

  return (
    <div className="space-y-8">
      <PageHeader
        kicker={`${greet}, ${user.name.split(' ')[0]}`}
        title={user.intent || home.title}
        description="Seu painel do bem — score, desafio, atalhos e território."
      />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="gold">{role}</Badge>
          {user.tenant && (
            <Badge tone="info">
              {user.tenant.region} · {user.tenant.name}
            </Badge>
          )}
          <Badge>{user.seal}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={home.cta[0].to}>
            <Button>{home.cta[0].label}</Button>
          </Link>
          <Link to="/app/ia">
            <Button variant="outline">Conversar com a IA</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link to="/app/score" className="lg:col-span-1">
          <Card className="h-full bg-gradient-to-br from-primary/30 to-card hover:shadow-[var(--shadow-glow)] transition">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Score do Bem
            </p>
            <p className="mt-3 text-4xl font-extrabold">
              {user.score} <span className="text-lg text-muted-foreground">/ 100</span>
            </p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              {user.goodcoins} GC · {user.hearts} corações · {user.streakDays} dias
            </p>
          </Card>
        </Link>
        <Card className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-5">
            {dims.map(([label, value]) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-bold">{value}</span>
                </div>
                <ProgressBar value={value} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" /> Sequência {user.streakDays} dias
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Trophy className="h-4 w-4" /> {user.achievements.length} conquistas
            </span>
          </div>
        </Card>
      </div>

      {role === 'pessoa' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="text-xs font-semibold text-muted-foreground">Desafio do dia</p>
            <h3 className="mt-2 text-lg font-bold">{ch.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{ch.description}</p>
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>
                  Progresso {ch.progress}/{ch.target}
                </span>
                <span>{challengePct}%</span>
              </div>
              <ProgressBar value={challengePct} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {!ch.accepted && !ch.completed && (
                <Button
                  onClick={async () => {
                    try {
                      await acceptChallenge()
                      toast.success('Desafio aceito. Pratique e registre o progresso.')
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Falha.')
                    }
                  }}
                >
                  Aceitar desafio
                </Button>
              )}
              {ch.accepted && !ch.completed && (
                <Button
                  onClick={async () => {
                    try {
                      await progressChallenge()
                      toast.success('Prática registrada.')
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Falha.')
                    }
                  }}
                >
                  Registrar prática (+1)
                </Button>
              )}
              {ch.completed && (
                <Button variant="outline" disabled>
                  Concluído · +{ch.rewardGc} GC
                </Button>
              )}
            </div>
          </Card>
          <Card className="bg-accent/50">
            <p className="text-xs font-semibold">IA Sou do Bem</p>
            <h3 className="mt-2 text-lg font-bold">
              Orientação com seu perfil <span className="capitalize">{role}</span> e território.
            </h3>
            <Link to="/app/ia" className="mt-4 inline-flex">
              <Button>
                <MessageCircle className="h-4 w-4" /> Conversar
              </Button>
            </Link>
          </Card>
        </div>
      )}

      <div>
        <h2 className="text-lg font-extrabold mb-3">Atalhos do seu perfil</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {home.cta.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="card p-4 flex items-center justify-between hover:bg-accent/40 transition"
            >
              <span className="inline-flex items-center gap-2 font-semibold text-sm">
                <Target className="h-4 w-4" /> {item.label}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
