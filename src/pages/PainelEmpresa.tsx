import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Badge, Button, Card, PageHeader, Stat } from '../components/ui'
import { DashboardSkeleton } from '../components/PageSkeleton'
import { formatDate } from '../lib/format'

export function PainelEmpresa() {
  const { user } = useApp()
  const toast = useToast()
  const [data, setData] = useState<{
    companies: { id: string; name: string; score: number; seal: string; isCertified: boolean }[]
    benefits: { id: string; title: string; cost: number; type: string }[]
    reviews: {
      id: string
      rating: number
      comment: string
      authorName: string
      companyName: string
      createdAt: string
    }[]
    certRequests: { id: string; status: string; notes: string; createdAt: string }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void api
      .panelEmpresa()
      .then((d) => {
        if (!cancelled) setData(d as typeof data)
      })
      .catch((e) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Falha ao carregar painel.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [toast])

  if (!user) return null
  if (loading) return <DashboardSkeleton />

  return (
    <div>
      <PageHeader
        kicker="Perfil Empresa"
        title="Quero certificar meu negócio"
        description="Painel multi-tenant da sua operação: empresas, certificação, benefícios e avaliações."
        action={
          <Link to="/app/empresas">
            <Button>Cadastrar / gerir empresas</Button>
          </Link>
        }
      />
      {!data ? (
        <p className="text-muted-foreground">Não foi possível carregar o painel.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4 mb-8">
            <Stat label="Empresas" value={data.companies.length} />
            <Stat
              label="Certificadas"
              value={data.companies.filter((c) => c.isCertified).length}
            />
            <Stat label="Benefícios" value={data.benefits.length} />
            <Stat label="Avaliações" value={data.reviews.length} />
          </div>

          <h2 className="font-extrabold text-lg mb-3">Minhas empresas</h2>
          {data.companies.length === 0 ? (
            <Card className="mb-6">
              <p className="text-sm text-muted-foreground">
                Nenhuma empresa ainda.{' '}
                <Link className="font-semibold underline" to="/app/empresas">
                  Cadastre agora
                </Link>
                .
              </p>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 mb-8">
              {data.companies.map((c) => (
                <Link
                  key={c.id}
                  to={`/app/empresas/${c.id}`}
                  className="card p-4 hover:bg-accent/30 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)]"
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-bold">{c.name}</p>
                    <Badge tone={c.isCertified ? 'success' : 'warn'}>
                      {c.isCertified ? c.seal : 'Sem selo'}
                    </Badge>
                  </div>
                  <p className="text-sm mt-2 tabular-nums">Score {c.score}</p>
                </Link>
              ))}
            </div>
          )}

          <h2 className="font-extrabold text-lg mb-3">Certificações</h2>
          <div className="space-y-2 mb-8">
            {data.certRequests.length === 0 ? (
              <Card>
                <p className="text-sm text-muted-foreground">Nenhuma solicitação ainda.</p>
              </Card>
            ) : (
              data.certRequests.map((c) => (
                <Card key={c.id} className="py-3">
                  <p className="text-sm font-semibold capitalize">{c.status}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.notes} · {formatDate(c.createdAt)}
                  </p>
                </Card>
              ))
            )}
          </div>

          <h2 className="font-extrabold text-lg mb-3">Avaliações recebidas</h2>
          <div className="space-y-2">
            {data.reviews.length === 0 ? (
              <Card>
                <p className="text-sm text-muted-foreground">Ainda sem avaliações de clientes.</p>
              </Card>
            ) : (
              data.reviews.map((r) => (
                <Card key={r.id} className="py-3">
                  <p className="text-sm font-semibold">
                    {r.rating}/5 · {r.companyName} · {r.authorName}
                  </p>
                  <p className="text-sm text-muted-foreground">{r.comment}</p>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
