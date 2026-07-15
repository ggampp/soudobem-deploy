import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { ROLE_OPTIONS, normalizeRole } from '../lib/roles'
import { usePermissions } from '../hooks/usePermissions'
import { Badge, Button, Card, Input, PageHeader, Stat, Textarea } from '../components/ui'

type Panel = 'main' | 'settings' | 'notifications' | 'privacy' | 'role'

export function Perfil() {
  const { user, logout, updateProfile, updateSettings, resetDemoData, setRole } = useApp()
  const navigate = useNavigate()
  const [panel, setPanel] = useState<Panel>('main')
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [city, setCity] = useState(user?.city || '')
  const [saved, setSaved] = useState('')
  const [rolePick, setRolePick] = useState(normalizeRole(user?.role))
  const [tenantId, setTenantId] = useState(user?.primaryTenantId || '')
  const [tenants, setTenants] = useState<{ id: string; name: string; region: string; slug: string }[]>([])
  const [roleBusy, setRoleBusy] = useState(false)

  useEffect(() => {
    void api.tenants().then((r) => setTenants(r.tenants))
  }, [])

  const { summary } = usePermissions()
  if (!user) return null
  const role = normalizeRole(user.role)

  return (
    <div>
      <PageHeader
        title="Perfil"
        description="Seu cadastro e o que este perfil de acesso pode fazer no ecossistema."
      />

      {panel === 'main' && (
        <>
          <Card className="text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-3xl font-extrabold flex items-center justify-center ring-4 ring-primary/20">
              {user.name.charAt(0)}
            </div>
            <h1 className="mt-4 text-2xl font-extrabold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.city && <p className="text-xs mt-1">{user.city}</p>}
            {user.bio && <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">{user.bio}</p>}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Badge tone="gold">{role}</Badge>
              {user.tenant && <Badge tone="info">{user.tenant.region}</Badge>}
              <Badge>{user.seal}</Badge>
            </div>
            {user.intent && <p className="mt-2 text-sm font-semibold">{user.intent}</p>}
          </Card>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Este perfil pode
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {summary.can.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-success font-bold" aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Este perfil não faz
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {summary.cannot.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-danger font-bold" aria-hidden>
                      ×
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Stat label="Score do Bem" value={user.score} hint="Cálculo unificado" />
            <Stat label="GoodCoins" value={user.goodcoins} hint={`${user.hearts} corações`} />
            <Stat label="Conquistas" value={user.achievements.length} hint={`${user.relations.length} relações`} />
          </div>

          <div className="mt-6 space-y-2">
            {(
              [
                ['role', 'Trocar perfil de acesso'],
                ['settings', 'Configurações da conta'],
                ['notifications', 'Notificações'],
                ['privacy', 'Privacidade e segurança'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="card w-full px-5 py-4 text-left font-semibold text-sm hover:bg-accent/40 flex justify-between"
                onClick={() => setPanel(id)}
              >
                {label} <span className="text-muted-foreground">›</span>
              </button>
            ))}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => {
                if (confirm('Resetar dados demo desta conta?')) resetDemoData()
              }}
            >
              Resetar dados demo
            </Button>
            <Button
              variant="danger"
              className="w-full mt-2"
              onClick={() => {
                logout()
                navigate('/auth')
              }}
            >
              Sair da conta
            </Button>
          </div>
        </>
      )}

      {panel === 'role' && (
        <Card>
          <button type="button" className="text-sm text-muted-foreground mb-4" onClick={() => setPanel('main')}>
            ← Voltar
          </button>
          <h2 className="font-extrabold text-lg">Perfil de acesso multi-tenant</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pessoa, Empresa, Influenciador, Líder/Executivo ou Mediador.
          </p>
          <div className="mt-4 space-y-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRolePick(r.id)}
                className={`w-full text-left rounded-2xl border p-3 ${
                  rolePick === r.id ? 'border-primary bg-primary/15' : 'border-border'
                }`}
              >
                <p className="font-bold text-sm">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.tagline}</p>
              </button>
            ))}
          </div>
          <label className="block mt-4 text-xs font-semibold">Território</label>
          <select
            className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          >
            <option value="">Selecione</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.region} — {t.name}
              </option>
            ))}
          </select>
          <Button
            className="mt-4"
            disabled={roleBusy}
            onClick={async () => {
              setRoleBusy(true)
              try {
                await setRole({
                  role: rolePick,
                  tenantId: tenantId || undefined,
                  intent: ROLE_OPTIONS.find((r) => r.id === rolePick)?.tagline,
                })
                setSaved('Perfil atualizado')
                setPanel('main')
                navigate('/app')
              } finally {
                setRoleBusy(false)
              }
            }}
          >
            {roleBusy ? 'Salvando…' : 'Aplicar perfil'}
          </Button>
        </Card>
      )}

      {panel === 'settings' && (
        <Card>
          <button type="button" className="text-sm text-muted-foreground mb-4" onClick={() => setPanel('main')}>
            ← Voltar
          </button>
          <h2 className="font-extrabold text-lg">Configurações da conta</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold">Cidade</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold">Bio</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1" rows={3} />
            </div>
            <Button
              onClick={() => {
                updateProfile({ name: name.trim() || user.name, bio, city })
                setSaved('Perfil atualizado')
              }}
            >
              Salvar
            </Button>
            {saved && <p className="text-sm text-success">{saved}</p>}
          </div>
        </Card>
      )}

      {panel === 'notifications' && (
        <Card>
          <button type="button" className="text-sm text-muted-foreground mb-4" onClick={() => setPanel('main')}>
            ← Voltar
          </button>
          <h2 className="font-extrabold text-lg">Notificações</h2>
          <div className="mt-4 space-y-3">
            {(
              [
                ['emailNotifications', 'E-mail'],
                ['pushNotifications', 'Push no app'],
                ['weeklyDigest', 'Resumo semanal'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4 card px-4 py-3">
                <span className="text-sm font-semibold">{label}</span>
                <input
                  type="checkbox"
                  checked={user.settings[key]}
                  onChange={(e) => updateSettings({ [key]: e.target.checked })}
                />
              </label>
            ))}
          </div>
        </Card>
      )}

      {panel === 'privacy' && (
        <Card>
          <button type="button" className="text-sm text-muted-foreground mb-4" onClick={() => setPanel('main')}>
            ← Voltar
          </button>
          <h2 className="font-extrabold text-lg">Privacidade e segurança</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center justify-between gap-4 card px-4 py-3">
              <span className="text-sm font-semibold">Exibir Score publicamente</span>
              <input
                type="checkbox"
                checked={user.settings.showScorePublicly}
                onChange={(e) => updateSettings({ showScorePublicly: e.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between gap-4 card px-4 py-3">
              <span className="text-sm font-semibold">Permitir convites de relação</span>
              <input
                type="checkbox"
                checked={user.settings.allowRelationInvites}
                onChange={(e) => updateSettings({ allowRelationInvites: e.target.checked })}
              />
            </label>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Versão local: dados ficam apenas no seu navegador (localStorage). Não há envio a servidores.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
