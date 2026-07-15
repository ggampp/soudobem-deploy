import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Badge, Button, Card, PageHeader, Stat } from '../components/ui'
import { ListSkeleton } from '../components/PageSkeleton'
import { formatRelative } from '../lib/format'

type MedItem = {
  id: string
  title: string
  withWhom: string
  status: string
  notes?: string
  requesterName?: string
  createdAt: string
}

export function PainelMediador() {
  const { user, refresh } = useApp()
  const toast = useToast()
  const [open, setOpen] = useState<MedItem[]>([])
  const [mine, setMine] = useState<MedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.panelMediador()
      setOpen((d.open || []) as MedItem[])
      setMine((d.mine || []) as MedItem[])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao carregar fila.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  if (!user) return null

  return (
    <div>
      <PageHeader
        kicker="Perfil Mediador"
        title="Quero ajudar a resolver conflitos"
        description={
          user.tenant
            ? `Fila do território ${user.tenant.name} (${user.tenant.region}).`
            : 'Fila de mediações abertas (defina um território no perfil).'
        }
      />

      {loading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3 mb-8">
            <Stat label="Abertas na fila" value="…" />
            <Stat label="Meus casos" value="…" />
            <Stat label="Território" value={user.tenant?.region || '—'} />
          </div>
          <ListSkeleton count={4} />
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 mb-8">
            <Stat label="Abertas na fila" value={open.length} />
            <Stat label="Meus casos" value={mine.length} />
            <Stat label="Território" value={user.tenant?.region || '—'} />
          </div>

          <h2 className="font-extrabold text-lg mb-3">Fila para assumir</h2>
          <div className="space-y-3 mb-10">
            {open.length === 0 ? (
              <Card>
                <p className="text-sm text-muted-foreground">Nenhuma mediação aberta no momento.</p>
              </Card>
            ) : (
              open.map((m) => (
                <Card key={m.id}>
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-bold">{m.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Solicitante: {m.requesterName} · com {m.withWhom}
                      </p>
                      {m.notes && <p className="text-sm mt-1">{m.notes}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelative(m.createdAt)}
                      </p>
                    </div>
                    <Button
                      loading={busy === m.id}
                      onClick={async () => {
                        setBusy(m.id)
                        try {
                          await api.claimMediation(m.id)
                          await refresh()
                          await load()
                          toast.success('Caso assumido. Conduza o acordo com presença.')
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Não foi possível assumir.')
                        } finally {
                          setBusy(null)
                        }
                      }}
                    >
                      Assumir caso
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <h2 className="font-extrabold text-lg mb-3">Casos sob sua condução</h2>
          <div className="space-y-3">
            {mine.length === 0 ? (
              <Card>
                <p className="text-sm text-muted-foreground">Você ainda não assumiu casos.</p>
              </Card>
            ) : (
              mine.map((m) => (
                <Card key={m.id}>
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-bold">{m.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.requesterName} · {m.withWhom}
                      </p>
                    </div>
                    <Badge tone={m.status === 'resolvida' ? 'success' : 'info'}>{m.status}</Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
