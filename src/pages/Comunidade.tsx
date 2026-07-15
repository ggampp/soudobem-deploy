import { useMemo, useState, type FormEvent } from 'react'
import { useApp } from '../context/AppContext'
import { useCatalog } from '../context/CatalogContext'
import { useToast } from '../context/ToastContext'
import type { CommunityPostType } from '../types'
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui'
import { formatDate, formatRelative } from '../lib/format'
import { hasErrors, minLength, required, type FieldErrors } from '../lib/form'
import { usePermissions } from '../hooks/usePermissions'

const types: Array<'Todos' | CommunityPostType> = [
  'Todos',
  'conquista',
  'historia',
  'projeto',
  'evento',
  'dica',
]

export function Comunidade() {
  const {
    user,
    likePost,
    createCommunityPost,
    joinEvent,
    completeLibraryItem,
  } = useApp()
  const { posts, events: communityEvents, library: libraryItems, reload } = useCatalog()
  const toast = useToast()
  const { can } = usePermissions()
  const canPost = can('community.post')
  const [tab, setTab] = useState<'feed' | 'eventos' | 'biblioteca'>('feed')
  const [filter, setFilter] = useState<(typeof types)[number]>('Todos')
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [postType, setPostType] = useState<CommunityPostType>('historia')
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<FieldErrors>({})

  if (!user) return null

  const feed = useMemo(() => {
    const ownIds = new Set(user.communityPosts.map((p) => p.id))
    const all = [...user.communityPosts, ...posts.filter((p) => !ownIds.has(p.id))].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    return filter === 'Todos' ? all : all.filter((p) => p.type === filter)
  }, [user.communityPosts, posts, filter])

  function validate(showAll = false) {
    const next: FieldErrors = {
      title: required(title, 'Título') || minLength(title, 4, 'Título'),
      body: required(body, 'Texto') || minLength(body, 10, 'Texto'),
    }
    setErrors(next)
    if (showAll) setTouched({ title: true, body: true })
    return next
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (hasErrors(validate(true))) {
      toast.warn('Título e texto precisam estar preenchidos corretamente.')
      return
    }
    setBusy(true)
    try {
      await createCommunityPost({
        type: postType,
        title: title.trim(),
        body: body.trim(),
        tags: [postType],
      })
      await reload()
      setTitle('')
      setBody('')
      setOpen(false)
      setErrors({})
      setTouched({})
      toast.success('Publicação no ar · +10 GC')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao publicar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Comunidade"
        title="Feed positivo de pessoas do bem"
        description="Histórias, conquistas, projetos, eventos e biblioteca — sem algoritmo de raiva."
        action={
          canPost ? <Button onClick={() => setOpen(true)}>Publicar</Button> : undefined
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ['feed', 'Feed'],
            ['eventos', 'Eventos'],
            ['biblioteca', 'Biblioteca'],
          ] as const
        ).map(([id, label]) => (
          <Chip key={id} active={tab === id} onClick={() => setTab(id)}>
            {label}
          </Chip>
        ))}
      </div>

      {open && canPost && (
        <Card className="mb-6">
          <h3 className="font-bold mb-4">Nova publicação</h3>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Tipo">
              <Select
                value={postType}
                onChange={(e) => setPostType(e.target.value as CommunityPostType)}
              >
                {types
                  .filter((t) => t !== 'Todos')
                  .map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Título" required error={touched.title ? errors.title : undefined}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setTouched((t) => ({ ...t, title: true }))
                  validate()
                }}
                placeholder="Título da publicação"
              />
            </Field>
            <Field
              label="Texto"
              required
              error={touched.body ? errors.body : undefined}
              hint="Conte com generosidade e verdade"
            >
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onBlur={() => {
                  setTouched((t) => ({ ...t, body: true }))
                  validate()
                }}
                rows={4}
                placeholder="Sua história, conquista ou dica…"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>
                Publicar (+10 GC)
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {tab === 'feed' && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {types.map((t) => (
              <Chip key={t} active={filter === t} onClick={() => setFilter(t)}>
                {t}
              </Chip>
            ))}
          </div>
          {feed.length === 0 ? (
            <EmptyState title="Feed vazio" description="Seja o primeiro a publicar uma história do bem." />
          ) : (
            <div className="space-y-3">
              {feed.map((p) => {
                const liked = user.likedPostIds.includes(p.id)
                const isOwn = user.communityPosts.some((x) => x.id === p.id)
                const displayLikes = isOwn ? p.likes : p.likes + (liked ? 1 : 0)
                return (
                  <Card key={p.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="info">{p.type}</Badge>
                      <span className="text-xs text-muted-foreground">{p.author}</span>
                      <span className="text-xs text-muted-foreground">· {formatRelative(p.createdAt)}</span>
                    </div>
                    <h3 className="mt-2 font-bold text-lg">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.tags.map((t) => (
                        <span key={t} className="text-[11px] rounded-full bg-muted px-2 py-0.5">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <Button
                      variant={liked ? 'primary' : 'outline'}
                      className="mt-4"
                      onClick={async () => {
                      try {
                        await likePost(p.id)
                        toast.success(liked ? 'Apoio removido.' : 'Publicação apoiada.')
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Falha.')
                      }
                    }}
                    >
                      {liked ? 'Apoiado' : 'Apoiar'} · {displayLikes}
                    </Button>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'eventos' && (
        <div className="grid gap-4 md:grid-cols-2">
          {communityEvents.map((ev) => {
            const joined = user.joinedEventIds.includes(ev.id)
            return (
              <Card key={ev.id}>
                <Badge>Evento</Badge>
                <h3 className="mt-2 font-bold text-lg">{ev.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(ev.date)} · {ev.location}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{ev.description}</p>
                <p className="mt-2 text-xs font-semibold">
                  {ev.attendees + (joined ? 1 : 0)} confirmados
                </p>
                <Button
                  className="mt-4"
                  disabled={joined}
                  onClick={async () => {
                    try {
                      await joinEvent(ev.id)
                      toast.success('Presença confirmada no evento.')
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Falha ao confirmar.')
                    }
                  }}
                >
                  {joined ? 'Inscrito' : 'Confirmar presença'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'biblioteca' && (
        <div className="grid gap-3 md:grid-cols-2">
          {libraryItems.map((item) => {
            const done = user.completedLibraryIds.includes(item.id)
            return (
              <Card key={item.id}>
                <div className="flex justify-between gap-2">
                  <Badge tone="gold">{item.kind}</Badge>
                  <span className="text-xs text-muted-foreground">{item.minutes} min</span>
                </div>
                <h3 className="mt-2 font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                <Button
                  className="mt-4"
                  disabled={done}
                  onClick={async () => {
                    try {
                      await completeLibraryItem(item.id, item.pillar)
                      toast.success('Conteúdo concluído · +5 GC')
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Falha.')
                    }
                  }}
                >
                  {done ? 'Concluído' : 'Marcar como feito (+5 GC)'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
