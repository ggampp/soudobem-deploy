import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { api } from '../lib/api'
import { Badge, Card, PageHeader, Stat } from '../components/ui'
import { DashboardSkeleton } from '../components/PageSkeleton'
import { formatRelative } from '../lib/format'

type Dash = {
  tenant: {
    id: string
    name: string
    region: string
    city: string
    state: string
    slug: string
  } | null
  kpis: {
    orgScore: number
    people: number
    companies: number
    mediations: number
    openMediations: number
    posts: number
    agreementRate: number
  }
  byRole: { role: string; people: number; score: number; risk: string }[]
  topPeople: { name: string; role: string; score: number; email: string }[]
  companies: {
    id: string
    name: string
    score: number
    seal: string
    category: string
    is_certified?: boolean
  }[]
  recentMediations: {
    id: string
    title: string
    status: string
    withWhom: string
    requesterName: string
    mediatorName?: string
    createdAt: string
  }[]
}

export function Executivo() {
  const { user } = useApp()
  const toast = useToast()
  const [data, setData] = useState<Dash | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const tenantId = user?.primaryTenantId || user?.tenant?.id
    if (!tenantId) {
      setError('Nenhum território vinculado. Defina o perfil Líder/Executivo com um território.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void api
      .executiveDashboard(tenantId)
      .then((d) => {
        if (!cancelled) setData(d as unknown as Dash)
      })
      .catch((e) => {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e)
          setError(msg)
          toast.error(msg)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.primaryTenantId, user?.tenant?.id, toast])

  if (!user) return null
  if (loading) return <DashboardSkeleton />

  return (
    <div>
      <PageHeader
        kicker="Líder / Executivo"
        title="Quero atuar no território"
        description={
          data?.tenant
            ? `${data.tenant.name} · ${data.tenant.region} (${data.tenant.city}/${data.tenant.state})`
            : 'Painel multi-tenant com métricas reais do PostgreSQL.'
        }
      />
      {error && <p className="text-sm text-danger mb-4">{error}</p>}
      {!data ? (
        <p className="text-muted-foreground">Sem dados do território.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Stat label="Score territorial" value={data.kpis.orgScore || '—'} hint="média empresas" />
            <Stat label="Pessoas no tenant" value={data.kpis.people} />
            <Stat label="Empresas" value={data.kpis.companies} />
            <Stat
              label="Mediações"
              value={data.kpis.mediations}
              hint={`${data.kpis.openMediations} abertas · ${data.kpis.agreementRate}% acordo`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="font-extrabold text-lg mb-3">Composição por perfil</h2>
              <Card className="overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-4 py-3">Perfil</th>
                      <th className="px-4 py-3">Pessoas</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byRole.map((t) => (
                      <tr key={t.role} className="border-b border-border/50">
                        <td className="px-4 py-3 font-semibold capitalize">{t.role}</td>
                        <td className="px-4 py-3 tabular-nums">{t.people}</td>
                        <td className="px-4 py-3 font-bold tabular-nums">{t.score}</td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              t.risk === 'alto' ? 'warn' : t.risk === 'médio' ? 'info' : 'success'
                            }
                          >
                            {t.risk}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {data.byRole.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-muted-foreground text-center">
                          Ainda não há membros neste território.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </div>

            <div>
              <h2 className="font-extrabold text-lg mb-3">Top scores do território</h2>
              <div className="space-y-2">
                {data.topPeople.map((p) => (
                  <Card key={p.email} className="py-3 flex justify-between">
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.role}</p>
                    </div>
                    <p className="font-extrabold tabular-nums">{p.score}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <h2 className="font-extrabold text-lg mt-8 mb-3">Empresas do território</h2>
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            {data.companies.map((c) => (
              <Card key={c.id} className="py-3">
                <div className="flex justify-between">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <Badge>{c.seal}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {c.category} · Score {c.score}
                </p>
              </Card>
            ))}
          </div>

          <h2 className="font-extrabold text-lg mb-3">Mediações recentes</h2>
          <div className="space-y-2">
            {data.recentMediations.map((m) => (
              <Card key={m.id} className="py-3">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.requesterName} · {m.withWhom}
                      {m.mediatorName ? ` · mediador ${m.mediatorName}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone="info">{m.status}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatRelative(m.createdAt)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            {data.recentMediations.length === 0 && (
              <Card>
                <p className="text-sm text-muted-foreground">Sem mediações neste território ainda.</p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}
