import { useMemo, useState, type FormEvent } from 'react'
import { Heart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import type { RelationCategory, ScoreDimensions } from '../types'
import {
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
} from '../components/ui'
import { formatDate } from '../lib/format'
import { avgDimensions } from '../lib/score'
import { emailOptional, hasErrors, minLength, required, type FieldErrors } from '../lib/form'

const categories: RelationCategory[] = ['Todas', 'Família', 'Amizade', 'Trabalho', 'Romântico', 'Comunidade']

const emptyDims = (): ScoreDimensions => ({
  confianca: 70,
  empatia: 70,
  etica: 70,
  cooperacao: 70,
  responsabilidade: 70,
})

export function Relacoes() {
  const { user, addRelation, updateRelation, removeRelation, evaluateRelation } = useApp()
  const toast = useToast()
  const [filter, setFilter] = useState<RelationCategory>('Todas')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [evalId, setEvalId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Exclude<RelationCategory, 'Todas'>>('Amizade')
  const [notes, setNotes] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dims, setDims] = useState<ScoreDimensions>(emptyDims())
  const [evalNote, setEvalNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<FieldErrors>({})

  if (!user) return null

  const list = useMemo(() => {
    return user.relations.filter((r) => {
      const okCat = filter === 'Todas' || r.category === filter
      const okQ = !q || r.name.toLowerCase().includes(q.toLowerCase())
      return okCat && okQ
    })
  }, [user.relations, filter, q])

  const avg =
    user.relations.length === 0
      ? null
      : Math.round(user.relations.reduce((s, r) => s + r.score, 0) / user.relations.length)

  function validateRelation(showAll = false): FieldErrors {
    const next: FieldErrors = {
      name: required(name, 'Nome') || minLength(name, 2, 'Nome'),
      email: emailOptional(email),
    }
    setErrors(next)
    if (showAll) {
      setTouched({ name: true, email: true })
    }
    return next
  }

  function blur(field: string) {
    setTouched((t) => ({ ...t, [field]: true }))
    validateRelation()
  }

  function resetForm() {
    setName('')
    setNotes('')
    setEmail('')
    setPhone('')
    setCategory('Amizade')
    setOpen(false)
    setEditId(null)
    setErrors({})
    setTouched({})
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validateRelation(true)
    if (hasErrors(errs)) {
      toast.warn('Revise os campos destacados antes de salvar.')
      return
    }
    setBusy(true)
    try {
      if (editId) {
        await updateRelation(editId, {
          name: name.trim(),
          category,
          notes: notes.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        })
        toast.success('Relação atualizada no banco.')
      } else {
        await addRelation({
          name: name.trim(),
          category,
          notes: notes.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        })
        toast.success(`${name.trim()} entrou no seu círculo do bem.`)
      }
      resetForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar a relação.')
    } finally {
      setBusy(false)
    }
  }

  async function onEval(e: FormEvent) {
    e.preventDefault()
    if (!evalId) return
    setBusy(true)
    try {
      await evaluateRelation(evalId, dims, evalNote.trim() || undefined)
      toast.success(`Avaliação salva · média ${avgDimensions(dims)} · +15 GC`)
      setEvalId(null)
      setDims(emptyDims())
      setEvalNote('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao avaliar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Suas Relações"
        title={`${user.relations.length} pessoas no seu círculo do bem`}
        description={`Score médio do círculo: ${avg === null ? '— / 100' : `${avg} / 100`}. Avaliações entram com 20% no Score do Bem.`}
        action={
          <Button
            onClick={() => {
              resetForm()
              setOpen(true)
            }}
          >
            Nova relação
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Field label="Buscar" htmlFor="rel-search">
          <Input
            id="rel-search"
            placeholder="Buscar por nome…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:max-w-xs"
          />
        </Field>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
          {categories.map((c) => (
            <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {(open || editId) && (
        <Card className="mb-6">
          <h3 className="font-bold mb-4">{editId ? 'Editar relação' : 'Cadastro de relação'}</h3>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Nome" required error={touched.name ? errors.name : undefined}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => blur('name')}
                autoComplete="name"
                placeholder="Nome da pessoa"
              />
            </Field>
            <Field label="Categoria" required>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as Exclude<RelationCategory, 'Todas'>)}
              >
                {categories
                  .filter((c) => c !== 'Todas')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail" hint="Opcional" error={touched.email ? errors.email : undefined}>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => blur('email')}
                  placeholder="email@exemplo.com"
                />
              </Field>
              <Field label="Telefone" hint="Opcional">
                <Input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-0000"
                />
              </Field>
            </div>
            <Field label="Notas / contexto" hint="Opcional">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Como se conhecem, combinados…"
                rows={3}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>
                {editId ? 'Salvar alterações' : 'Salvar no PostgreSQL'}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {evalId && (
        <Card className="mb-6 border-primary/40">
          <h3 className="font-bold mb-1">Avaliar relação (5 dimensões)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Cada avaliação gera evento de Score, +15 GoodCoins e mistura 12% nas suas dimensões.
          </p>
          <form onSubmit={onEval} className="space-y-4">
            {(Object.keys(dims) as (keyof ScoreDimensions)[]).map((key) => (
              <Field key={key} label={`${key} · ${dims[key]}`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={dims[key]}
                  onChange={(e) => setDims((d) => ({ ...d, [key]: Number(e.target.value) }))}
                  className="w-full accent-[var(--color-primary)] min-h-11"
                  aria-valuetext={`${dims[key]} de 100`}
                />
              </Field>
            ))}
            <p className="text-sm font-bold tabular-nums">Média: {avgDimensions(dims)}</p>
            <Field label="Comentário" hint="Opcional">
              <Textarea
                value={evalNote}
                onChange={(e) => setEvalNote(e.target.value)}
                rows={2}
                placeholder="O que observou nesta relação?"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>
                Salvar avaliação
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEvalId(null)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-6 w-6" aria-hidden />}
          title={user.relations.length === 0 ? 'Nenhuma relação cadastrada' : 'Nenhum resultado'}
          description="Cadastre pessoas reais do seu círculo. Isso alimenta 20% do Score do Bem."
          action={
            user.relations.length === 0 ? (
              <Button onClick={() => setOpen(true)}>Cadastrar primeira relação</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((r) => (
            <Card key={r.id} as="article">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{r.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{r.category}</p>
                  {(r.email || r.phone) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {[r.email, r.phone].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <span className="text-lg font-extrabold tabular-nums">{r.score}</span>
              </div>
              <div className="mt-3">
                <ProgressBar value={r.score} label={`Score de ${r.name}`} />
              </div>
              {r.notes && <p className="mt-3 text-sm text-muted-foreground">{r.notes}</p>}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Desde {formatDate(r.createdAt)} · {r.evaluations.length} avaliação(ões)
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setEvalId(r.id)
                    setDims(r.evaluations[0]?.dimensions || emptyDims())
                  }}
                >
                  Avaliar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditId(r.id)
                    setOpen(true)
                    setName(r.name)
                    setCategory(r.category)
                    setNotes(r.notes || '')
                    setEmail(r.email || '')
                    setPhone(r.phone || '')
                    setErrors({})
                    setTouched({})
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm(`Remover ${r.name} do círculo?`)) return
                    try {
                      await removeRelation(r.id)
                      toast.success(`${r.name} removido(a).`)
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Falha ao remover.')
                    }
                  }}
                >
                  Remover
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
