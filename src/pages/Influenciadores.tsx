import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BadgeCheck } from 'lucide-react'
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
  Textarea,
} from '../components/ui'
import { hasErrors, minLength, required, type FieldErrors } from '../lib/form'
import { usePermissions } from '../hooks/usePermissions'

export function Influenciadores() {
  const { user, toggleFollowInfluencer, createInfluencer } = useApp()
  const { influencers, reload } = useCatalog()
  const toast = useToast()
  const { can } = usePermissions()
  const canCreate = can('influencers.create')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'Todos' | 'Verificado' | 'Em ascensão' | 'Seguindo'>('Todos')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState({ name: '', handle: '', niche: '', bio: '' })

  const list = useMemo(() => {
    return influencers.filter((i) => {
      const okQ =
        !q ||
        i.name.toLowerCase().includes(q.toLowerCase()) ||
        i.handle.toLowerCase().includes(q.toLowerCase()) ||
        i.niche.toLowerCase().includes(q.toLowerCase())
      const following = user?.followingInfluencerIds.includes(i.id)
      const okF =
        filter === 'Todos' ||
        (filter === 'Verificado' && i.verified) ||
        (filter === 'Em ascensão' && i.rising) ||
        (filter === 'Seguindo' && following)
      return okQ && okF
    })
  }, [q, filter, user?.followingInfluencerIds, influencers])

  function validate(showAll = false) {
    const next: FieldErrors = {
      name: required(form.name, 'Nome') || minLength(form.name, 2, 'Nome'),
      bio: form.bio.trim() && form.bio.trim().length < 10 ? 'Bio deve ter ao menos 10 caracteres ou ficar vazia.' : undefined,
    }
    setErrors(next)
    if (showAll) setTouched({ name: true, bio: true })
    return next
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (hasErrors(validate(true))) {
      toast.warn('Revise o formulário.')
      return
    }
    setBusy(true)
    try {
      await createInfluencer(form)
      await reload()
      setOpen(false)
      setForm({ name: '', handle: '', niche: '', bio: '' })
      setErrors({})
      setTouched({})
      toast.success('Influenciador cadastrado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao cadastrar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Influência com propósito"
        title="Influenciadores do Bem"
        description={
          canCreate
            ? 'Cadastre ou atualize sua voz na comunidade. Seguidores e score ficam no banco.'
            : 'Conheça vozes da comunidade. Só o perfil Influenciador cadastra novos perfis.'
        }
        action={
          canCreate ? (
            <Button onClick={() => setOpen(true)}>Cadastrar influenciador</Button>
          ) : undefined
        }
      />

      {open && canCreate && (
        <Card className="mb-6">
          <h3 className="font-bold mb-4">Cadastro de influenciador</h3>
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
              <Field label="Handle" hint="Opcional — geramos um se vazio">
                <Input
                  value={form.handle}
                  onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
                  placeholder="@usuario"
                />
              </Field>
              <Field label="Nicho">
                <Input
                  value={form.niche}
                  onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
                  placeholder="Educação, sustentabilidade…"
                />
              </Field>
            </div>
            <Field label="Bio" error={touched.bio ? errors.bio : undefined}>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                onBlur={() => {
                  setTouched((t) => ({ ...t, bio: true }))
                  validate()
                }}
                rows={3}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>
                Salvar
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4 max-w-md">
        <Field label="Buscar">
          <Input
            placeholder="Nome, @handle ou nicho…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Field>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(['Todos', 'Verificado', 'Em ascensão', 'Seguindo'] as const).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<BadgeCheck className="h-6 w-6" aria-hidden />}
          title="Nenhum influenciador encontrado"
          description="Cadastre uma voz da comunidade ou limpe os filtros."
          action={<Button onClick={() => setOpen(true)}>Cadastrar</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((i) => {
            const following = user?.followingInfluencerIds.includes(i.id)
            return (
              <div key={i.id} className="card p-5">
                <Link
                  to={`/app/influenciadores/${i.id}`}
                  className="flex gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/25 font-bold shrink-0">
                    {i.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold">{i.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {i.handle} · {i.niche}{' '}
                      {i.verified && <Badge tone="info">Verificado</Badge>}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{i.bio}</p>
                    <p className="mt-3 text-sm font-semibold tabular-nums">
                      Score {i.score} · {i.reach} · {i.engagement}
                    </p>
                  </div>
                </Link>
                <Button
                  className="mt-4"
                  variant={following ? 'primary' : 'outline'}
                  onClick={async () => {
                    try {
                      await toggleFollowInfluencer(i.id)
                      toast.success(following ? 'Deixou de seguir.' : `Seguindo ${i.name}.`)
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Falha.')
                    }
                  }}
                >
                  {following ? 'Seguindo' : 'Seguir'}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function InfluencerDetail() {
  const { id } = useParams()
  const { user, toggleFollowInfluencer } = useApp()
  const { influencers } = useCatalog()
  const toast = useToast()
  const item = influencers.find((i) => i.id === id)
  if (!item || !user) return <p className="text-muted-foreground">Influenciador não encontrado.</p>
  const following = user.followingInfluencerIds.includes(item.id)

  return (
    <div>
      <PageHeader kicker={item.niche} title={item.name} description={item.bio} />
      <Button
        className="mb-4"
        variant={following ? 'primary' : 'outline'}
        onClick={async () => {
          try {
            await toggleFollowInfluencer(item.id)
            toast.success(following ? 'Deixou de seguir.' : `Seguindo ${item.name}.`)
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Falha.')
          }
        }}
      >
        {following ? 'Seguindo' : 'Seguir'}
      </Button>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted-foreground">Score</p>
          <p className="text-3xl font-extrabold mt-1 tabular-nums">{item.score}</p>
          <div className="mt-3">
            <ProgressBar value={item.score} label="Score do influenciador" />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Alcance</p>
          <p className="text-2xl font-extrabold mt-1">{item.reach}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">Engajamento</p>
          <p className="text-2xl font-extrabold mt-1">{item.engagement}</p>
        </Card>
      </div>
      <Link
        to="/app/influenciadores"
        className="mt-6 inline-block text-sm text-muted-foreground font-medium hover:text-foreground"
      >
        ← Voltar
      </Link>
    </div>
  )
}
