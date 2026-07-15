import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useCatalog } from '../context/CatalogContext'
import { useToast } from '../context/ToastContext'
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  PageHeader,
  ProgressBar,
  Select,
  Textarea,
  sealTone,
} from '../components/ui'
import { formatDate } from '../lib/format'
import {
  hasErrors,
  minLength,
  positiveNumber,
  required,
  urlOptional,
  type FieldErrors,
} from '../lib/form'
import { usePermissions } from '../hooks/usePermissions'

export function Empresas() {
  const { user, createCompany } = useApp()
  const { companies, reload } = useCatalog()
  const toast = useToast()
  const { can, role } = usePermissions()
  const canCreate = can('companies.create')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('Todos')
  const [seal, setSeal] = useState('Selo Todos')
  const [onlyFav, setOnlyFav] = useState(false)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState({
    name: '',
    category: 'Alimentação',
    city: 'São Paulo',
    state: 'SP',
    description: '',
    website: '',
    phone: '',
  })

  const categories = ['Todos', ...Array.from(new Set(companies.map((c) => c.category)))]
  const seals = ['Selo Todos', 'Selo Ouro', 'Selo Prata', 'Selo Bronze']

  const list = useMemo(() => {
    return companies.filter((c) => {
      const okQ = !q || c.name.toLowerCase().includes(q.toLowerCase())
      const okC = cat === 'Todos' || c.category === cat
      const okS = seal === 'Selo Todos' || c.seal === seal.replace('Selo ', '')
      const okF = !onlyFav || user?.favoriteCompanyIds.includes(c.id)
      return okQ && okC && okS && okF
    })
  }, [q, cat, seal, onlyFav, user?.favoriteCompanyIds, companies])

  function validate(showAll = false): FieldErrors {
    const next: FieldErrors = {
      name: required(form.name, 'Nome') || minLength(form.name, 2, 'Nome'),
      website: urlOptional(form.website),
    }
    setErrors(next)
    if (showAll) setTouched({ name: true, website: true })
    return next
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (hasErrors(validate(true))) {
      toast.warn('Revise os campos do formulário.')
      return
    }
    setBusy(true)
    try {
      await createCompany(form)
      await reload()
      setOpen(false)
      setForm({
        name: '',
        category: 'Alimentação',
        city: 'São Paulo',
        state: 'SP',
        description: '',
        website: '',
        phone: '',
      })
      setErrors({})
      setTouched({})
      toast.success('Empresa cadastrada (certificação pendente).')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao cadastrar empresa.')
    } finally {
      setBusy(false)
    }
  }

  const displayList =
    role === 'empresa'
      ? list.filter(
          (c) => c.createdBy === user?.id || c.id === user?.companyId,
        )
      : list

  return (
    <div>
      <PageHeader
        kicker="Empresas do Bem"
        title={role === 'empresa' ? 'Minha empresa' : 'Empresas certificadas e cadastradas'}
        description={
          canCreate
            ? role === 'empresa'
              ? 'Edite o cadastro do seu negócio e acompanhe certificação e reputação.'
              : 'Cadastre empresas do território e acompanhe selos e scores.'
            : 'Explore empresas certificadas. Seu perfil pode avaliar e favoritar, sem cadastrar novas.'
        }
        action={
          canCreate ? (
            <Button onClick={() => setOpen(true)}>
              {role === 'empresa' ? 'Cadastrar minha empresa' : 'Cadastrar empresa'}
            </Button>
          ) : undefined
        }
      />

      {!canCreate && (
        <Card className="mb-6 bg-accent/40 border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Com o perfil <strong className="text-foreground capitalize">{role}</strong> você consulta o
            catálogo, mas não cadastra empresas. Empresas usam o perfil <strong>Empresa</strong>;
            líderes usam o perfil <strong>Executivo</strong>.
          </p>
        </Card>
      )}

      {open && canCreate && (
        <Card className="mb-6">
          <h3 className="font-bold mb-4">Cadastro de empresa</h3>
          <form onSubmit={onCreate} className="space-y-4" noValidate>
            <Field label="Nome fantasia" required error={touched.name ? errors.name : undefined}>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                onBlur={() => {
                  setTouched((t) => ({ ...t, name: true }))
                  validate()
                }}
                placeholder="Nome da empresa"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria" required>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </Field>
              <Field label="Cidade">
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </Field>
              <Field label="UF">
                <Input
                  value={form.state}
                  maxLength={2}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value.toUpperCase() }))}
                />
              </Field>
              <Field label="Telefone">
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </Field>
            </div>
            <Field
              label="Website"
              hint="Opcional"
              error={touched.website ? errors.website : undefined}
            >
              <Input
                type="url"
                inputMode="url"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                onBlur={() => {
                  setTouched((t) => ({ ...t, website: true }))
                  validate()
                }}
                placeholder="https://"
              />
            </Field>
            <Field label="Descrição / propósito">
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>
                Salvar empresa
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 max-w-md">
        <Field label="Buscar empresa">
          <Input
            placeholder="Buscar por nome…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Field>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {seals.map((s) => (
          <Chip key={s} active={seal === s} onClick={() => setSeal(s)}>
            {s}
          </Chip>
        ))}
        <Chip active={onlyFav} onClick={() => setOnlyFav((v) => !v)}>
          Favoritas
        </Chip>
      </div>

      {displayList.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" aria-hidden />}
          title="Nenhuma empresa encontrada"
          description={
            canCreate
              ? 'Cadastre a primeira empresa do seu perfil ou ajuste os filtros.'
              : 'Ajuste os filtros para ver empresas certificadas no território.'
          }
          action={
            canCreate ? (
              <Button onClick={() => setOpen(true)}>Cadastrar empresa</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayList.map((c) => (
            <Link
              key={c.id}
              to={`/app/empresas/${c.id}`}
              className="card p-5 hover:bg-accent/30 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)]"
            >
              <div className="flex gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/30 font-bold shrink-0">
                  {c.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{c.name}</h3>
                    <Badge tone={sealTone(c.seal)}>{c.seal}</Badge>
                    {c.isCertified === false && <Badge tone="warn">Sem selo</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.category} · {c.city} · {c.state}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  <p className="mt-3 text-sm font-extrabold tabular-nums">Score {c.score}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function EmpresaDetail() {
  const { id } = useParams()
  const { user, toggleFavoriteCompany, addCompanyReview, certifyCompany, createBenefit } = useApp()
  const { companies, reload } = useCatalog()
  const toast = useToast()
  const { can } = usePermissions()
  const company = companies.find((c) => c.id === id)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState<string | undefined>()
  const [benefitOpen, setBenefitOpen] = useState(false)
  const [benefitBusy, setBenefitBusy] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [benefit, setBenefit] = useState({
    title: '',
    type: 'Produto',
    valueLabel: '',
    cost: 100,
  })
  const [bErrors, setBErrors] = useState<FieldErrors>({})
  const [bTouched, setBTouched] = useState<Record<string, boolean>>({})

  if (!company || !user) {
    return <p className="text-muted-foreground">Empresa não encontrada.</p>
  }

  const reviews = user.companyReviews.filter((r) => r.companyId === company.id)
  const fav = user.favoriteCompanyIds.includes(company.id)
  const isOwner = company.createdBy === user.id || user.companyId === company.id
  const canManage = isOwner && can('companies.edit_own')
  const canBenefit = isOwner && can('benefits.create')
  const canCertify = isOwner && can('companies.certify_own')
  const canReview = can('companies.review') && !isOwner

  function validateBenefit(showAll = false) {
    const next: FieldErrors = {
      title: required(benefit.title, 'Título') || minLength(benefit.title, 3, 'Título'),
      cost: positiveNumber(benefit.cost, 'Custo em GC'),
    }
    setBErrors(next)
    if (showAll) setBTouched({ title: true, cost: true })
    return next
  }

  async function onReview(e: FormEvent) {
    e.preventDefault()
    const err = comment.trim().length > 0 && comment.trim().length < 3
      ? 'Comentário muito curto (mín. 3 caracteres) ou deixe vazio.'
      : undefined
    setCommentError(err)
    if (err) {
      toast.warn(err)
      return
    }
    setReviewBusy(true)
    try {
      await addCompanyReview(company!.id, rating, comment.trim() || 'Sem comentário')
      setComment('')
      toast.success('Avaliação salva · +10 GC')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao avaliar.')
    } finally {
      setReviewBusy(false)
    }
  }

  return (
    <div>
      <PageHeader kicker={company.category} title={company.name} description={company.description} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={fav ? 'primary' : 'outline'}
          onClick={async () => {
            try {
              await toggleFavoriteCompany(company.id)
              toast.success(fav ? 'Removida dos favoritos.' : 'Empresa favoritada.')
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Falha.')
            }
          }}
        >
          {fav ? 'Favorita' : 'Favoritar'}
        </Button>
        {company.isCertified === false && canCertify && (
          <Button
            onClick={async () => {
              try {
                await certifyCompany(company.id)
                await reload()
                toast.success('Certificação demo aprovada.')
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Falha na certificação.')
              }
            }}
          >
            Solicitar certificação
          </Button>
        )}
        {canBenefit && (
          <Button variant="outline" onClick={() => setBenefitOpen((v) => !v)}>
            Cadastrar benefício
          </Button>
        )}
        <Link to="/app/beneficios">
          <Button variant="ghost">Marketplace</Button>
        </Link>
      </div>

      {benefitOpen && canBenefit && (
        <Card className="mb-4">
          <h3 className="font-bold mb-4">Novo benefício no Marketplace</h3>
          <form
            className="space-y-4"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault()
              if (hasErrors(validateBenefit(true))) {
                toast.warn('Revise o formulário do benefício.')
                return
              }
              setBenefitBusy(true)
              try {
                await createBenefit({ ...benefit, companyId: company.id })
                await reload()
                setBenefitOpen(false)
                setBenefit({ title: '', type: 'Produto', valueLabel: '', cost: 100 })
                toast.success('Benefício publicado no marketplace.')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Falha ao publicar.')
              } finally {
                setBenefitBusy(false)
              }
            }}
          >
            <Field label="Título" required error={bTouched.title ? bErrors.title : undefined}>
              <Input
                value={benefit.title}
                onChange={(e) => setBenefit((b) => ({ ...b, title: e.target.value }))}
                onBlur={() => {
                  setBTouched((t) => ({ ...t, title: true }))
                  validateBenefit()
                }}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tipo">
                <Select
                  value={benefit.type}
                  onChange={(e) => setBenefit((b) => ({ ...b, type: e.target.value }))}
                >
                  {['Produto', 'Serviço', 'Cashback', 'Experiência', 'Doação'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Valor / label">
                <Input
                  value={benefit.valueLabel}
                  onChange={(e) => setBenefit((b) => ({ ...b, valueLabel: e.target.value }))}
                  placeholder="20% off"
                />
              </Field>
              <Field label="Custo (GC)" required error={bTouched.cost ? bErrors.cost : undefined}>
                <Input
                  type="number"
                  min={1}
                  value={benefit.cost}
                  onChange={(e) => setBenefit((b) => ({ ...b, cost: Number(e.target.value) }))}
                  onBlur={() => {
                    setBTouched((t) => ({ ...t, cost: true }))
                    validateBenefit()
                  }}
                />
              </Field>
            </div>
            <Button type="submit" loading={benefitBusy}>
              Publicar benefício
            </Button>
          </form>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted-foreground">Score empresarial</p>
          <p className="text-3xl font-extrabold mt-1 tabular-nums">{company.score}</p>
          <div className="mt-3">
            <ProgressBar value={company.score} label="Score da empresa" />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Selo</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={sealTone(company.seal)}>{company.seal}</Badge>
            {company.isCertified === false ? (
              <Badge tone="warn">Não certificado</Badge>
            ) : (
              <Badge tone="success">Certificado</Badge>
            )}
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Local / contato</p>
          <p className="mt-2 font-semibold">
            {company.city} · {company.state}
          </p>
          {company.phone && <p className="text-sm mt-1">{company.phone}</p>}
          {company.website && <p className="text-sm mt-1 break-all">{company.website}</p>}
        </Card>
      </div>

      {canReview ? (
        <Card className="mt-4">
          <h3 className="font-bold">Sua avaliação da empresa</h3>
          <form onSubmit={onReview} className="mt-3 space-y-4" noValidate>
            <Field label={`Nota ${rating}/5`}>
              <input
                type="range"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--color-primary)] min-h-11"
                aria-valuetext={`${rating} de 5`}
              />
            </Field>
            <Field
              label="Comentário"
              hint="Opcional — se preencher, use ao menos 3 caracteres"
              error={commentError}
            >
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onBlur={() => {
                  if (comment.trim() && comment.trim().length < 3) {
                    setCommentError('Comentário muito curto (mín. 3 caracteres) ou deixe vazio.')
                  } else setCommentError(undefined)
                }}
                rows={3}
                placeholder="Como foi a relação com esta empresa?"
              />
            </Field>
            <Button type="submit" loading={reviewBusy}>
              Enviar avaliação (+10 GC)
            </Button>
          </form>
          {reviews.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {reviews.map((r) => (
                <div key={r.id} className="text-sm">
                  <p className="font-semibold">
                    {r.rating}/5 · {formatDate(r.createdAt)}
                  </p>
                  <p className="text-muted-foreground">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : canManage ? (
        <Card className="mt-4 bg-accent/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta é a sua empresa. Avaliações vêm de clientes com perfil Pessoa. Use certificação e
            benefícios para fortalecer o selo.
          </p>
        </Card>
      ) : null}

      <Link
        to="/app/empresas"
        className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground font-medium"
      >
        ← Voltar às empresas
      </Link>
    </div>
  )
}
