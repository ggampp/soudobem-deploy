import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Badge, Button, Card, PageHeader, Stat } from '../components/ui'
import { PageSkeleton } from '../components/PageSkeleton'
import { formatRelative } from '../lib/format'

export function PainelConteudo() {
  const { user } = useApp()
  const toast = useToast()
  const [data, setData] = useState<{
    profiles: {
      id: string
      name: string
      handle: string
      niche: string
      score: number
      reach: string
      engagement: string
      verified: boolean
    }[]
    posts: {
      id: string
      type: string
      title: string
      likes: number
      createdAt: string
      body: string
    }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void api
      .panelInfluenciador()
      .then((d) => {
        if (!cancelled) setData(d as typeof data)
      })
      .catch((e) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Falha ao carregar conteúdo.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [toast])

  if (!user) return null
  if (loading) return <PageSkeleton cards={3} rows={4} />

  return (
    <div>
      <PageHeader
        kicker="Perfil Influenciador"
        title="Quero criar conteúdo do bem"
        description="Seu espaço de voz: perfil público, publicações e impacto na comunidade do território."
        action={
          <Link to="/app/comunidade">
            <Button>Publicar na comunidade</Button>
          </Link>
        }
      />
      {!data ? (
        <p className="text-muted-foreground">Não foi possível carregar o painel.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 mb-8">
            <Stat label="Perfis" value={data.profiles.length} />
            <Stat label="Publicações" value={data.posts.length} />
            <Stat
              label="Likes totais"
              value={data.posts.reduce((s, p) => s + (p.likes || 0), 0)}
            />
          </div>

          <h2 className="font-extrabold text-lg mb-3">Meu perfil público</h2>
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            {data.profiles.map((p) => (
              <Card key={p.id}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.handle} · {p.niche}
                    </p>
                  </div>
                  {p.verified ? <Badge tone="info">Verificado</Badge> : <Badge>Em ascensão</Badge>}
                </div>
                <p className="text-sm mt-3 tabular-nums">
                  Score {p.score} · {p.reach} · eng. {p.engagement}
                </p>
              </Card>
            ))}
            {data.profiles.length === 0 && (
              <Card>
                <p className="text-sm text-muted-foreground">
                  Nenhum perfil ainda — o onboarding cria um automaticamente. Você também pode cadastrar em{' '}
                  <Link to="/app/influenciadores" className="underline font-semibold">
                    Influenciadores
                  </Link>
                  .
                </p>
              </Card>
            )}
          </div>

          <h2 className="font-extrabold text-lg mb-3">Conteúdos recentes</h2>
          <div className="space-y-2">
            {data.posts.length === 0 ? (
              <Card>
                <p className="text-sm text-muted-foreground">
                  Sem publicações. Vá em Comunidade e compartilhe algo do bem.
                </p>
              </Card>
            ) : (
              data.posts.map((p) => (
                <Card key={p.id} className="py-3">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold text-sm">{p.title}</p>
                    <Badge tone="info">{p.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.body}</p>
                  <p className="text-xs mt-2 tabular-nums">
                    {p.likes} apoios · {formatRelative(p.createdAt)}
                  </p>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
