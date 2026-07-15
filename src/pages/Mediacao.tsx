import { useMemo, useState, type FormEvent } from 'react'
import { Scale } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Stat,
  Textarea,
} from '../components/ui'
import { hasErrors, minLength, required, type FieldErrors } from '../lib/form'
import { usePermissions } from '../hooks/usePermissions'

export function Mediacao() {
  const { user, addMediation, updateMediationStatus, advanceMediation } = useApp()
  const toast = useToast()
  const { can } = usePermissions()
  const canCreate = can('mediations.create')
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [withWhom, setWithWhom] = useState('')
  const [notes, setNotes] = useState('')
  const [msg, setMsg] = useState('')
  const [agreement, setAgreement] = useState('')
  const [busy, setBusy] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<FieldErrors>({})

  if (!user) return null

  const stats = useMemo(() => {
    const aberta = user.mediations.filter((m) => m.status === 'aberta').length
    const acordo = user.mediations.filter((m) => m.status === 'acordo').length
    const resolvida = user.mediations.filter((m) => m.status === 'resolvida').length
    const total = user.mediations.length
    const taxa = total === 0 ? 0 : Math.round(((acordo + resolvida) / total) * 100)
    return { aberta, acordo, resolvida, taxa }
  }, [user.mediations])

  const active = user.mediations.find((m) => m.id === activeId)

  function validate(showAll = false) {
    const next: FieldErrors = {
      title: required(title, 'Título') || minLength(title, 4, 'Título'),
      withWhom: required(withWhom, 'Com quem') || minLength(withWhom, 2, 'Nome'),
    }
    setErrors(next)
    if (showAll) setTouched({ title: true, withWhom: true })
    return next
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (hasErrors(validate(true))) {
      toast.warn('Preencha título e com quem é o conflito.')
      return
    }
    setBusy(true)
    try {
      await addMediation({ title: title.trim(), withWhom: withWhom.trim(), notes: notes.trim() })
      setTitle('')
      setWithWhom('')
      setNotes('')
      setOpen(false)
      setErrors({})
      setTouched({})
      toast.success('Mediação aberta. Um mediador do território pode assumir.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao criar mediação.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        kicker="Mediação com IA"
        title="Resolva com presença"
        description="Conflitos viram conversas estruturadas. Ao resolver, você ganha GoodCoins e sobe Ética/Responsabilidade."
        action={
          canCreate ? <Button onClick={() => setOpen(true)}>Abrir mediação</Button> : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-4 mb-8">
        <Stat label="Em aberto" value={stats.aberta} />
        <Stat label="Em acordo" value={stats.acordo} />
        <Stat label="Resolvidas" value={stats.resolvida} />
        <Stat label="Taxa de acordo" value={`${stats.taxa}%`} />
      </div>

      {open && canCreate && (
        <Card className="mb-6">
          <h3 className="font-bold mb-4">Nova mediação</h3>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field label="Título do conflito" required error={touched.title ? errors.title : undefined}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setTouched((t) => ({ ...t, title: true }))
                  validate()
                }}
                placeholder="Ex.: Atraso em combinado de trabalho"
              />
            </Field>
            <Field label="Com quem?" required error={touched.withWhom ? errors.withWhom : undefined}>
              <Input
                value={withWhom}
                onChange={(e) => setWithWhom(e.target.value)}
                onBlur={() => {
                  setTouched((t) => ({ ...t, withWhom: true }))
                  validate()
                }}
                placeholder="Nome da outra pessoa"
              />
            </Field>
            <Field label="Contexto" hint="Opcional — fatos sem julgamentos">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="O que aconteceu e o que você gostaria de resolver"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={busy}>
                Criar mediação
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {active && (
        <Card className="mb-6 border-primary/30">
          <div className="flex justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-bold text-lg">{active.title}</h3>
              <p className="text-sm text-muted-foreground">Com {active.withWhom}</p>
            </div>
            <Button variant="ghost" onClick={() => setActiveId(null)}>
              Fechar painel
            </Button>
          </div>
          <div className="mt-4 space-y-2 max-h-72 overflow-y-auto" aria-live="polite">
            {active.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user' ? 'bg-primary text-primary-foreground ml-8' : 'bg-muted mr-8'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          {active.status !== 'resolvida' && (
            <form
              className="mt-4 flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!msg.trim()) {
                  toast.warn('Escreva uma mensagem antes de enviar.')
                  return
                }
                try {
                  await advanceMediation(active.id, msg.trim())
                  setMsg('')
                  toast.info('Mensagem registrada no fluxo.')
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Falha ao enviar.')
                }
              }}
            >
              <Field label="Sua resposta" htmlFor="med-msg">
                <Input
                  id="med-msg"
                  placeholder="Resposta no passo atual…"
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                />
              </Field>
              <Button type="submit" className="self-end mb-0.5">
                Enviar
              </Button>
            </form>
          )}
          {active.status !== 'resolvida' && (
            <div className="mt-4 space-y-3">
              <Field label="Acordo final" hint="Opcional">
                <Textarea
                  value={agreement}
                  onChange={(e) => setAgreement(e.target.value)}
                  rows={2}
                  placeholder="1–3 combinados claros"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {active.status === 'aberta' && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await updateMediationStatus(active.id, 'acordo', agreement)
                        toast.success('Marcada como em acordo.')
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Falha.')
                      }
                    }}
                  >
                    Marcar em acordo
                  </Button>
                )}
                <Button
                  onClick={async () => {
                    try {
                      await updateMediationStatus(active.id, 'resolvida', agreement)
                      toast.success('Mediação resolvida · +40 GC')
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Falha.')
                    }
                  }}
                >
                  Resolver (+40 GC)
                </Button>
              </div>
            </div>
          )}
          {active.agreement && (
            <p className="mt-3 text-sm">
              <strong>Acordo:</strong> {active.agreement}
            </p>
          )}
        </Card>
      )}

      {user.mediations.length === 0 ? (
        <EmptyState
          icon={<Scale className="h-6 w-6" aria-hidden />}
          title="Nenhuma mediação por aqui"
          description="Quando um conflito surgir, abra uma mediação para estruturar a conversa."
          action={
            canCreate ? (
              <Button onClick={() => setOpen(true)}>Abrir primeira mediação</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {user.mediations.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{m.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Com {m.withWhom}</p>
                  {m.notes && <p className="mt-2 text-sm">{m.notes}</p>}
                  <p className="mt-2 text-xs text-muted-foreground capitalize">
                    Status: {m.status} · {m.messages.length} mensagens
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setActiveId(m.id)}>
                    Abrir fluxo
                  </Button>
                  {m.status !== 'resolvida' && (
                    <Button
                      onClick={async () => {
                        try {
                          await updateMediationStatus(m.id, 'resolvida')
                          toast.success('Mediação resolvida · +40 GC')
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Falha.')
                        }
                      }}
                    >
                      Resolver
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
