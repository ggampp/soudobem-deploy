import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useCatalog } from '../context/CatalogContext'
import { useToast } from '../context/ToastContext'
import type { BenefitType } from '../types'
import { Badge, Button, Card, Chip, PageHeader, sealTone } from '../components/ui'
import { usePermissions } from '../hooks/usePermissions'

const types: Array<'Todas' | BenefitType> = ['Todas', 'Cashback', 'Produto', 'Serviço', 'Experiência', 'Doação']

export function Marketplace() {
  const { user, redeemBenefit } = useApp()
  const { benefits, companies } = useCatalog()
  const toast = useToast()
  const { can, role } = usePermissions()
  const canRedeem = can('benefits.redeem')
  const [type, setType] = useState<(typeof types)[number]>('Todas')
  const [msg, setMsg] = useState('')

  if (!user) return null

  const list = useMemo(
    () => benefits.filter((b) => type === 'Todas' || b.type === type),
    [type, benefits],
  )

  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c]))
  const reais = (user.goodcoins / 10).toFixed(2)

  return (
    <div>
      <PageHeader
        kicker="Marketplace do Bem"
        title="Benefícios e recompensas"
        description={
          canRedeem
            ? 'Use seus GoodCoins em experiências, doações, descontos e cashback com empresas certificadas.'
            : role === 'empresa'
              ? 'Acompanhe as ofertas do ecossistema. Para publicar benefícios, use o detalhe da sua empresa.'
              : 'Catálogo de benefícios do ecossistema. Resgates são para o perfil Pessoa.'
        }
      />
      {!canRedeem && (
        <Card className="mb-6 bg-accent/40">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Seu perfil <strong className="text-foreground capitalize">{role}</strong> não resgata
            benefícios no marketplace. Quem consome com GoodCoins é o perfil <strong>Pessoa</strong>.
          </p>
        </Card>
      )}

      <Card className="mb-6 bg-gradient-to-br from-primary/25 to-card">
        <p className="text-xs font-semibold uppercase tracking-wide">Saldo GoodCoin</p>
        <p className="mt-2 text-4xl font-extrabold">{user.goodcoins}</p>
        <p className="mt-1 text-sm text-muted-foreground">≈ R$ {reais} em recompensas disponíveis</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setMsg('Ganhe GoodCoins com desafios diários, método, mediações resolvidas e bônus de boas-vindas.')
            }
          >
            Como ganhar mais
          </Button>
          <Link to="/app/empresas">
            <Button variant="ghost">Empresas certificadas</Button>
          </Link>
        </div>
        {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
      </Card>

      <div className="mb-5 flex flex-wrap gap-2">
        {types.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((b) => {
          const company = companyMap[b.companyId]
          const redeemed = user.redeemedBenefitIds.includes(b.id)
          const afford = user.goodcoins >= b.cost && !redeemed
          return (
            <article key={b.id} className="card p-5">
              <div className="flex flex-wrap gap-2">
                <Badge>{company?.initials}</Badge>
                {b.featured && <Badge tone="gold">Destaque</Badge>}
                <Badge tone="info">{b.type}</Badge>
              </div>
              <h3 className="mt-3 font-bold text-lg">{b.title}</h3>
              {company && (
                <Link to={`/app/empresas/${company.id}`} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
                  {company.name}
                </Link>
              )}
              <p className="mt-2 text-sm text-muted-foreground">Valor {b.valueLabel}</p>
              {canRedeem ? (
                <Button
                  className="mt-4"
                  disabled={!afford}
                  onClick={async () => {
                    const ok = await redeemBenefit(b.id, b.cost, b.title)
                    if (ok) {
                      setMsg(`Resgate concluído: ${b.title}`)
                      toast.success(`Resgatado: ${b.title}`)
                    } else {
                      setMsg('Não foi possível resgatar (saldo ou já resgatado).')
                      toast.error('Não foi possível resgatar (saldo ou já resgatado).')
                    }
                  }}
                >
                  {redeemed ? 'Resgatado' : `${b.cost} GC`}
                </Button>
              ) : (
                <p className="mt-4 text-xs font-semibold text-muted-foreground">
                  {b.cost} GC · resgate só no perfil Pessoa
                </p>
              )}
            </article>
          )
        })}
      </div>

      <h2 className="text-lg font-extrabold mt-10 mb-3">Empresas em destaque</h2>
      <div className="mb-2 flex justify-end">
        <Link to="/app/empresas" className="text-sm font-semibold">
          Ver todas →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {companies.slice(0, 3).map((c) => (
          <Link key={c.id} to={`/app/empresas/${c.id}`} className="card p-4 hover:bg-accent/30">
            <div className="font-bold">
              {c.initials} {c.name}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {c.category} · Score {c.score}{' '}
              <Badge tone={sealTone(c.seal)}>{c.seal}</Badge>
            </p>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-extrabold mt-10 mb-3">Extrato GoodCoin</h2>
      <ul className="space-y-2">
        {user.goodcoinLedger.map((tx) => (
          <li key={tx.id} className="card px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold">{tx.label}</p>
              <p className="text-xs text-muted-foreground">{tx.date}</p>
            </div>
            <span className={`font-extrabold ${tx.amount >= 0 ? 'text-success' : 'text-danger'}`}>
              {tx.amount >= 0 ? '+' : ''}
              {tx.amount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
