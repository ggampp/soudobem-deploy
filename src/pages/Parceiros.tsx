import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Handshake } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useCatalog } from '../context/CatalogContext'
import { useToast } from '../context/ToastContext'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
} from '../components/ui'
import { hasErrors, minLength, positiveNumber, required, type FieldErrors } from '../lib/form'
import { usePermissions } from '../hooks/usePermissions'

export function Parceiros() {
  const { user, toggleFavoritePartner, createPartner } = useApp()
  const { partners, companies, reload } = useCatalog()
  const toast = useToast()
  const { can, role } = usePermissions()
  const canCreate = can('partners.create')
  const [q, setQ] = useState('')
  const [favOnly, setFavOnly] = useState(false)
  const [category, setCategory] = useState('Todas')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState({
    name: '',
    category: 'Alimentação',
    discount: '10% para membros',
    heartsRequired: 2,
    address: '',
    companyId: '',
  })

  if (!user) return null

  const categories = ['Todas', ...Array.from(new Set(partners.map((p) => p.category)))]

  const list = useMemo(() => {
    return partners.filter((p) => {
      const okQ = !q || p.name.toLowerCase().includes(q.toLowerCase())
      const okF = !favOnly || (user.favoritePartnerIds || []).includes(p.id)
      const okC = category === 'Todas' || p.category === category
      return okQ && okF && okC && p.active
    })
  }, [q, favOnly, category, user.favoritePartnerIds, partners])

  function validate(showAll = false) {
    const next: FieldErrors = {
      name: required(form.name, 'Nome') || minLength(form.name, 2, 'Nome'),
      discount: required(form.discount, 'Desconto'),
      heartsRequired: positiveNumber(form.heartsRequired, 'Corações necessários'),
    }
    setErrors(next)
    if (showAll) setTouched({ name: true, discount: true, heartsRequired: true })
    return next
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (hasErrors(validate(true))) {
      toast.warn('Revise os campos do parceiro.')
      return
    }
    setBusy(true)
    try {
      await createPartner({
        ...form,
        companyId: form.companyId || undefined,
      })
      await reload()
      setOpen(false)
      setForm({
        name: '',
        category: 'Alimentação',
        discount: '10% para membros',
        heartsRequired: 2,
        address: '',
        companyId: '',
      })
      setErrors({})
      setTouched({})
      toast.success('Parceiro cadastrado no território.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao cadastrar parceiro.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Parceiros do Bem"
        title="Descontos exclusivos para você"
        description={
          canCreate
            ? 'Cadastre parceiros do seu negócio ou território. Membros desbloqueiam com corações.'
            : 'Veja parceiros e use seus corações para descontos. Cadastro de parceiros é da empresa ou do executivo.'
        }
        action={
          <div className="flex flex-wrap gap-2">
            {canCreate && <Button onClick={() => setOpen(true)}>Cadastrar parceiro</Button>}
            <Link to="/app/parceiros/qrcode">
              <Button variant="outline">Meu QR</Button>
            </Link>
          </div>
        }
      />
      {!canCreate && (
        <Card className="mb-6 bg-accent/40">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Perfil <strong className="text-foreground capitalize">{role}</strong>: você consome e
            favorita parceiros, sem cadastrar novos.
          </p>
        </Card>
      )}
      <Card className="mb-6 bg-gradient-to-br from-primary/20 to-card">
        <p className="text-xs text-muted-foreground">Seus corações</p>
        <p className="text-3xl font-extrabold mt-1 tabular-nums">{user.hearts}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Ganhos: relações, avaliações, desafios, fundo, comunidade e cadastros.
        </p>
      </Card>

      {open && canCreate && (
        <Card className="mb-6">
          <h3 className="font-bold mb-4">Cadastro de parceiro</h3>
          <form onSubmit={onCreate} className="space-y-4" noValidate>
            <Field label="Nome" required error={touched.name ? errors.name : undefined}>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onBlur={() => {
                  setTouched((t) => ({ ...t, name: true }))
                  validate()
                }}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </Field>
              <Field
                label="Desconto"
                required
                error={touched.discount ? errors.discount : undefined}
              >
                <Input
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                  onBlur={() => {
                    setTouched((t) => ({ ...t, discount: true }))
                    validate()
                  }}
                />
              </Field>
              <Field
                label="Corações necessários"
                required
                error={touched.heartsRequired ? errors.heartsRequired : undefined}
              >
                <Input
                  type="number"
                  min={1}
                  value={form.heartsRequired}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, heartsRequired: Number(e.target.value) }))
                  }
                  onBlur={() => {
                    setTouched((t) => ({ ...t, heartsRequired: true }))
                    validate()
                  }}
                />
              </Field>
              <Field label="Endereço">
                <Input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="Empresa vinculada" hint="Opcional">
              <Select
                value={form.companyId}
                onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
              >
                <option value="">Nenhuma</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>
                Salvar parceiro
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="sm:max-w-xs w-full">
          <Field label="Buscar">
            <Input placeholder="Buscar parceiro" value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
        </div>
        <Field label="Categoria">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Button variant={favOnly ? 'primary' : 'outline'} onClick={() => setFavOnly((v) => !v)}>
          Meus favoritos
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Handshake className="h-6 w-6" aria-hidden />}
          title="Nenhum parceiro encontrado"
          description="Cadastre o primeiro parceiro da região ou ajuste os filtros."
          action={<Button onClick={() => setOpen(true)}>Cadastrar parceiro</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((p) => {
            const unlocked = user.hearts >= p.heartsRequired
            const fav = (user.favoritePartnerIds || []).includes(p.id)
            return (
              <Card key={p.id} className={!unlocked ? 'opacity-85' : ''}>
                <div className="flex justify-between gap-2">
                  <h3 className="font-bold">{p.name}</h3>
                  <Badge tone={unlocked ? 'success' : 'default'}>
                    {unlocked ? 'Desbloqueado' : 'Bloqueado'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.category} · {p.discount}
                </p>
                {p.address && <p className="text-xs mt-1">{p.address}</p>}
                <p className="text-sm mt-3 font-semibold tabular-nums">
                  Requer {p.heartsRequired} corações · você tem {user.hearts}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant={fav ? 'primary' : 'outline'}
                    onClick={async () => {
                      try {
                        await toggleFavoritePartner(p.id)
                        toast.success(fav ? 'Removido dos favoritos.' : 'Parceiro favoritado.')
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Falha.')
                      }
                    }}
                  >
                    {fav ? 'Favorito' : 'Favoritar'}
                  </Button>
                  {p.companyId && (
                    <Link to={`/app/empresas/${p.companyId}`}>
                      <Button variant="ghost">Ver empresa</Button>
                    </Link>
                  )}
                  {unlocked && (
                    <Link to="/app/parceiros/qrcode">
                      <Button>Usar QR</Button>
                    </Link>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function QRCodePage() {
  const { user } = useApp()
  if (!user) return null
  const payload = btoa(
    JSON.stringify({
      name: user.name,
      email: user.email,
      hearts: user.hearts,
      score: user.score,
      seal: user.seal,
    }),
  )
  return (
    <div>
      <PageHeader
        kicker="Parceiros do Bem"
        title="Meu QR de membro"
        description="Mostre este código em parceiros ativos para validar descontos e corações."
      />
      <Card className="max-w-sm mx-auto text-center">
        <div
          className="mx-auto grid grid-cols-8 gap-0.5 w-48 aspect-square p-2 bg-white rounded-2xl border-4 border-primary"
          role="img"
          aria-label="Código QR simulado do membro"
        >
          {payload
            .slice(0, 64)
            .split('')
            .map((ch, i) => (
              <div
                key={i}
                className="rounded-[1px]"
                style={{ background: ch.charCodeAt(0) % 3 === 0 ? '#1c1914' : '#f5c828' }}
              />
            ))}
        </div>
        <p className="mt-4 font-bold">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="mt-2 text-xs tabular-nums">
          Corações: {user.hearts} · Score: {user.score} · {user.seal}
        </p>
      </Card>
      <Link
        to="/app/parceiros"
        className="mt-6 inline-block text-sm text-muted-foreground font-medium hover:text-foreground"
      >
        ← Voltar
      </Link>
    </div>
  )
}
