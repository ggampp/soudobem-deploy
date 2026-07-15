import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { Alert, Badge, Button, Input, Logo } from '../components/ui'

export function Auth() {
  const { isAuthenticated, user, login, apiOnline, openrouterReady, backendError, loading } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('ggampp@gmail.com')
  const [password, setPassword] = useState('demo')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)

  if (!loading && isAuthenticated && user) {
    return <Navigate to={user.onboarded ? '/app' : '/onboarding'} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Informe um e-mail válido.')
      return
    }
    if (!password) {
      setError('Informe a senha.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await login(email.trim(), mode === 'signup' ? email.split('@')[0] : undefined, password)
      toast.success(mode === 'login' ? 'Login realizado.' : 'Conta criada com sucesso.')
      navigate('/app')
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Falha no login. Verifique e-mail, senha e se a API está online.'
      setError(msg)
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh soft-gradient flex flex-col lg:flex-row">
      <a href="#auth-form" className="skip-link">
        Ir para o formulário
      </a>
      <div className="lg:w-1/2 flex flex-col justify-center px-8 py-12 lg:px-16">
        <Logo size={56} />
        <h1 className="mt-10 text-4xl font-extrabold leading-tight md:text-5xl text-balance">
          Pessoas do Bem
          <br />
          constroem mundos
          <br />
          melhores.
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground text-pretty leading-relaxed">
          Confiança, reputação comportamental e relações reais — com Score, comunidade e IA do Bem.
        </p>
        <div className="mt-6 flex flex-wrap gap-2" aria-live="polite">
          <Badge tone={apiOnline ? 'success' : 'warn'}>API {apiOnline ? 'online' : 'offline'}</Badge>
          <Badge tone={openrouterReady ? 'success' : 'warn'}>
            OpenRouter {openrouterReady ? 'OK' : 'sem chave'}
          </Badge>
        </div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="card w-full max-w-md p-8 shadow-[var(--shadow-card)]" id="auth-form">
          <h2 className="text-2xl font-extrabold tracking-tight">
            {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {mode === 'login'
              ? 'Entre para continuar sua jornada do Bem.'
              : 'Crie sua conta e escolha seu perfil no onboarding.'}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full"
            loading={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                await login('ggampp@gmail.com', 'Guilherme Pimentel', 'demo')
                toast.success('Login realizado.')
                navigate('/app')
              } catch (err) {
                const msg = err instanceof Error ? err.message : 'Falha'
                setError(msg)
                toast.error(msg)
              } finally {
                setBusy(false)
              }
            }}
          >
            Continuar com Google (simulado)
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground" role="separator">
            <div className="h-px flex-1 bg-border" />
            ou
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="field-label" htmlFor="auth-email">
                E-mail
              </label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-invalid={!!error && !email.trim()}
                aria-describedby={error ? 'auth-error' : undefined}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="auth-password">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-10 min-w-10 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </div>
            {(error || backendError) && (
              <Alert tone="danger" title="Não foi possível entrar">
                <p id="auth-error">{error || backendError}</p>
              </Alert>
            )}
            <Button type="submit" className="w-full" loading={busy}>
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                  onClick={() => setMode('signup')}
                >
                  Criar agora
                </button>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <button
                  type="button"
                  className="font-semibold text-foreground underline-offset-4 hover:underline"
                  onClick={() => setMode('login')}
                >
                  Entrar
                </button>
              </>
            )}
          </p>
          <p className="mt-4 text-center text-[11px] text-muted-foreground leading-relaxed">
            Demo: <code className="font-semibold">ggampp@gmail.com</code> / <code className="font-semibold">demo</code>
          </p>
          <p className="mt-3 text-center text-xs">
            <Link to="/" className="text-muted-foreground hover:text-foreground font-medium">
              ← Voltar à landing
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
