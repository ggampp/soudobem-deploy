import {
  cloneElement,
  isValidElement,
  useId,
  useLayoutEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePageChrome } from '../context/PageChromeContext'

export function Logo({ size = 40, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="Sou do Bem">
      <div
        className="flex items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold shadow-[var(--shadow-glow)] select-none"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
        aria-hidden
      >
        SB
      </div>
      {showWordmark && (
        <span className="text-lg font-extrabold tracking-tight text-foreground">Sou do Bem</span>
      )}
    </div>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <Loader2
      className={`h-4 w-4 animate-spin ${className}`}
      aria-hidden
    />
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />
}

export function Button({
  variant = 'primary',
  className = '',
  loading,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger' | 'secondary'
  loading?: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-2 min-h-11 min-w-11 rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200 ease-out disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)]'
  const variants = {
    primary: 'btn-primary',
    secondary: 'bg-accent text-foreground border border-border hover:bg-muted',
    ghost: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
    outline: 'border border-border bg-card hover:bg-muted text-foreground',
    danger: 'bg-danger text-white hover:brightness-95',
  }
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`input-base ${className}`}
    />
  )
}

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`input-base min-h-[96px] py-3 resize-y ${className}`}
    />
  )
}

export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`input-base appearance-none bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat pr-10 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23524c40' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        ...props.style,
      }}
    >
      {children}
    </select>
  )
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  /** Se omitido, gera id e tenta injetar no filho controlado via clone */
  htmlFor?: string
  children: ReactNode
}) {
  const autoId = useId()
  const id = htmlFor || autoId
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  let control = children
  if (isValidElement(children)) {
    control = cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      id,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy,
      'aria-required': required || undefined,
    })
  }

  return (
    <div className="w-full">
      <label className="field-label" htmlFor={id}>
        {label}
        {required && (
          <span className="text-danger ml-0.5" aria-hidden>
            *
          </span>
        )}
        {required && <span className="sr-only"> (obrigatório)</span>}
      </label>
      <div data-field-control>{control}</div>
      {error ? (
        <p className="field-error" role="alert" id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** Screen-reader only */
export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">{children}</span>
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'gold' | 'silver' | 'bronze' | 'success' | 'warn' | 'info'
}) {
  const tones = {
    default: 'bg-muted text-foreground',
    gold: 'bg-amber-100 text-amber-950',
    silver: 'bg-slate-100 text-slate-800',
    bronze: 'bg-orange-100 text-orange-950',
    success: 'bg-emerald-100 text-emerald-900',
    warn: 'bg-rose-100 text-rose-900',
    info: 'bg-sky-100 text-sky-950',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Card({
  children,
  className = '',
  as: Comp = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
}) {
  return <Comp className={`card p-5 ${className}`}>{children}</Comp>
}

/**
 * Publica título/kicker/subtítulo no cabeçalho do AppLayout.
 * Ações opcionais ficam no topo da área de conteúdo (evita re-render loop com ReactNode).
 */
export function PageHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  const { setMeta, clearMeta } = usePageChrome()

  useLayoutEffect(() => {
    setMeta({ kicker, title, description })
    return () => clearMeta()
  }, [kicker, title, description, setMeta, clearMeta])

  if (!action) return null
  return <div className="mb-4 flex flex-wrap items-center justify-end gap-2">{action}</div>
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Progresso'}
    >
      <div className="progress-fill" style={{ width: `${v}%` }} />
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <Card className="transition hover:shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground leading-snug">{hint}</p>}
    </Card>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <Card className="text-center py-12 px-6">
      {icon && (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5 flex justify-center gap-2 flex-wrap">{action}</div>}
    </Card>
  )
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-9 rounded-full px-3.5 py-2 text-xs font-semibold transition duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)] ${
        active
          ? 'bg-primary text-primary-foreground shadow-[var(--shadow-glow)]'
          : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
      }`}
    >
      {children}
    </button>
  )
}

export function SoftLink({
  to,
  children,
  className = '',
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <Link
      to={to}
      className={`text-sm font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)] rounded ${className}`}
    >
      {children}
    </Link>
  )
}

export function Alert({
  tone = 'info',
  children,
  title,
}: {
  tone?: 'info' | 'success' | 'warn' | 'danger'
  children: ReactNode
  title?: string
}) {
  const tones = {
    info: 'bg-sky-50 border-sky-200 text-sky-950',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    warn: 'bg-amber-50 border-amber-200 text-amber-950',
    danger: 'bg-rose-50 border-rose-200 text-rose-950',
  }
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${tones[tone]}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      {title && <p className="font-bold mb-0.5">{title}</p>}
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}

export function sealTone(seal: string) {
  if (seal === 'Ouro') return 'gold' as const
  if (seal === 'Prata') return 'silver' as const
  return 'bronze' as const
}
