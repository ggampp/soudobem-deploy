import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

export type ToastTone = 'success' | 'error' | 'info' | 'warn'

export type ToastItem = {
  id: string
  title?: string
  message: string
  tone: ToastTone
  duration: number
}

type ToastInput = {
  title?: string
  message: string
  tone?: ToastTone
  duration?: number
}

type ToastApi = {
  toast: (input: ToastInput | string) => string
  success: (message: string, title?: string) => string
  error: (message: string, title?: string) => string
  info: (message: string, title?: string) => string
  warn: (message: string, title?: string) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const toneStyles: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  error: 'border-rose-200 bg-rose-50 text-rose-950',
  info: 'border-sky-200 bg-sky-50 text-sky-950',
  warn: 'border-amber-200 bg-amber-50 text-amber-950',
}

const toneIcon: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warn: Info,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (input: ToastInput | string) => {
      const normalized: ToastInput =
        typeof input === 'string' ? { message: input, tone: 'info' } : input
      const id = crypto.randomUUID()
      const item: ToastItem = {
        id,
        title: normalized.title,
        message: normalized.message,
        tone: normalized.tone || 'info',
        duration: normalized.duration ?? 4000,
      }
      setItems((prev) => [item, ...prev].slice(0, 5))
      return id
    },
    [],
  )

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (message, title = 'Pronto') => toast({ message, title, tone: 'success' }),
      error: (message, title = 'Algo deu errado') => toast({ message, title, tone: 'error', duration: 5500 }),
      info: (message, title) => toast({ message, title, tone: 'info' }),
      warn: (message, title = 'Atenção') => toast({ message, title, tone: 'warn' }),
      dismiss,
    }),
    [toast, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:w-[380px] z-[200] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="false"
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const Icon = toneIcon[item.tone]

  useEffect(() => {
    if (item.duration <= 0) return
    const t = window.setTimeout(() => onDismiss(item.id), item.duration)
    return () => window.clearTimeout(t)
  }, [item.duration, item.id, onDismiss])

  return (
    <div
      className={`pointer-events-auto card border px-4 py-3 shadow-[var(--shadow-card)] flex gap-3 items-start animate-in ${toneStyles[item.tone]}`}
      role={item.tone === 'error' ? 'alert' : 'status'}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0 flex-1">
        {item.title && <p className="text-sm font-bold leading-tight">{item.title}</p>}
        <p className={`text-sm leading-snug ${item.title ? 'mt-0.5' : ''}`}>{item.message}</p>
      </div>
      <button
        type="button"
        className="min-h-9 min-w-9 rounded-xl flex items-center justify-center hover:bg-black/5 transition shrink-0"
        onClick={() => onDismiss(item.id)}
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}
