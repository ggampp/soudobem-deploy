import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useCatalog } from '../context/CatalogContext'
import { useToast } from '../context/ToastContext'
import { Button, Card, PageHeader, ProgressBar, Stat } from '../components/ui'
import { moneyBRL } from '../lib/format'

export function Fundo() {
  const { user, supportCause } = useApp()
  const { causes } = useCatalog()
  const toast = useToast()
  const [msg, setMsg] = useState('')

  if (!user) return null

  const raisedMap = useMemo(() => {
    return Object.fromEntries(
      causes.map((c) => [c.id, c.raised + ((user.causeContributions || {})[c.id] || 0) * 10]),
    )
  }, [user.causeContributions, causes])

  const total = Object.values(raisedMap).reduce((s, n) => s + n, 0)
  const donorCount = Object.keys(user.causeContributions).length

  return (
    <div>
      <PageHeader
        kicker="Fundo Coletivo do Bem"
        title="Fundo do Bem"
        description="Recursos coletivos transformados em ação. Cada gesto da comunidade vira impacto verificável."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Stat label="Total arrecadado" value={moneyBRL(total)} hint="4 causas ativas" />
        <Stat label="Meta de referência" value={moneyBRL(50000)} hint="referência coletiva" />
        <Stat label="Suas causas" value={donorCount} />
        <Stat label="Seu aporte (GC)" value={Object.values(user.causeContributions).reduce((a, b) => a + b, 0)} />
      </div>

      <h2 className="text-lg font-extrabold mb-3">Causas em destaque</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {causes.map((c) => {
          const raised = raisedMap[c.id]
          const pct = Math.round((raised / c.goal) * 100)
          const mine = user.causeContributions[c.id] || 0
          return (
            <article key={c.id} className="card p-5">
              <p className="text-xs font-semibold text-muted-foreground">Causa</p>
              <h3 className="mt-1 text-lg font-bold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-4 text-sm font-semibold">
                {moneyBRL(raised)} de {moneyBRL(c.goal)}
              </p>
              <p className="text-xs text-muted-foreground mb-2">{pct}% da meta</p>
              <ProgressBar value={Math.min(100, pct)} />
              {mine > 0 && (
                <p className="mt-2 text-xs font-semibold text-success">Você já apoia com {mine} GC</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {[25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant={amount === 50 ? 'primary' : 'outline'}
                    onClick={async () => {
                      const ok = await supportCause(c.id, c.title, amount)
                      if (ok) {
                        const m = `Você apoiou “${c.title}” com ${amount} GoodCoins.`
                        setMsg(m)
                        toast.success(m)
                      } else {
                        setMsg('Saldo insuficiente de GoodCoins.')
                        toast.error('Saldo insuficiente de GoodCoins.')
                      }
                    }}
                  >
                    {amount} GC
                  </Button>
                ))}
              </div>
            </article>
          )
        })}
      </div>
      {msg && <p className="mt-4 text-sm text-muted-foreground">{msg}</p>}

      <h2 className="text-lg font-extrabold mt-10 mb-3">Movimentação recente</h2>
      <Card>
        <p className="text-sm font-semibold">Transparência total</p>
        {user.goodcoinLedger.filter((t) => t.label.startsWith('Apoio:')).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma doação registrada ainda. Seja o primeiro!</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {user.goodcoinLedger
              .filter((t) => t.label.startsWith('Apoio:'))
              .map((t) => (
                <li key={t.id} className="text-sm flex justify-between">
                  <span>
                    {t.label} · {t.date}
                  </span>
                  <span className="font-semibold">{t.amount} GC</span>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
