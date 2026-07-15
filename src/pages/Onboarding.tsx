import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { ROLE_OPTIONS } from '../lib/roles'
import { Button, Card, Input, Logo, Textarea } from '../components/ui'

type Tenant = {
  id: string
  name: string
  slug: string
  region: string
  city: string
  state: string
  description: string
}

export function Onboarding() {
  const { user, setRole } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(user?.name || '')
  const [city, setCity] = useState(user?.city || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [role, setRoleLocal] = useState<(typeof ROLE_OPTIONS)[number]['id']>('pessoa')
  const [tenantId, setTenantId] = useState('')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void api.tenants().then((r) => {
      setTenants(r.tenants)
      const se = r.tenants.find((t) => t.slug === 'sudeste')
      if (se) setTenantId(se.id)
    })
  }, [])

  if (!user) return <Navigate to="/auth" replace />
  if (user.onboarded && user.role && user.role !== 'pessoa') {
    // allow re-onboarding only if not onboarded
  }
  if (user.onboarded) return <Navigate to="/app" replace />

  const selected = ROLE_OPTIONS.find((r) => r.id === role)!

  async function finish() {
    setBusy(true)
    setError('')
    try {
      if (selected.needsTenant && !tenantId) {
        setError('Selecione um território para este perfil.')
        return
      }
      await setRole({
        role,
        tenantId: tenantId || undefined,
        intent: selected.tagline,
        name: name.trim() || user!.name,
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
      })
      navigate('/app')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen soft-gradient flex items-center justify-center px-5 py-10">
      <div className="card w-full max-w-2xl p-8">
        <Logo />
        <div className="mt-6 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h1 className="mt-8 text-2xl font-extrabold">Quem é você no Sou do Bem?</h1>
            <p className="mt-2 text-muted-foreground">
              Escolha o perfil de acesso. Isso define o menu, permissões e o território multi-tenant.
            </p>
            <div className="mt-6 grid gap-3">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoleLocal(r.id)}
                  className={`text-left rounded-2xl border p-4 transition ${
                    role === r.id
                      ? 'border-primary bg-primary/15 shadow-[var(--shadow-glow)]'
                      : 'border-border bg-card hover:bg-accent/40'
                  }`}
                >
                  <p className="font-extrabold">{r.label}</p>
                  <p className="text-sm font-semibold text-foreground/80 mt-0.5">{r.tagline}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep(1)}>Continuar</Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="mt-8 text-2xl font-extrabold">Seu perfil e território</h1>
            <p className="mt-2 text-muted-foreground">
              Perfil: <strong>{selected.label}</strong> — {selected.tagline}
            </p>
            <div className="mt-6 space-y-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" />
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Sua intenção (opcional)"
                rows={2}
              />
              <div>
                <label className="text-xs font-semibold">
                  Território {selected.needsTenant ? '*' : '(recomendado)'}
                </label>
                <select
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-2.5 text-sm"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                >
                  <option value="">Selecione o território</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.region} — {t.name} ({t.city}/{t.state})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Voltar
              </Button>
              <Button onClick={() => setStep(2)} disabled={!name.trim()}>
                Continuar
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mt-8 text-2xl font-extrabold">Confirmar acesso</h1>
            <Card className="mt-4 bg-accent/40">
              <p className="font-bold text-lg">{selected.label}</p>
              <p className="text-sm mt-1">{selected.tagline}</p>
              <p className="text-xs text-muted-foreground mt-2">{selected.description}</p>
              <p className="text-sm mt-4">
                <strong>Nome:</strong> {name}
              </p>
              {city && (
                <p className="text-sm">
                  <strong>Cidade:</strong> {city}
                </p>
              )}
              <p className="text-sm">
                <strong>Território:</strong>{' '}
                {tenants.find((t) => t.id === tenantId)?.name || 'Padrão Sudeste se vazio'}
              </p>
            </Card>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={() => void finish()} disabled={busy}>
                {busy ? 'Ativando…' : 'Entrar no app'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
