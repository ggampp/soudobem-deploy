import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useApp } from '../context/AppContext'
import { MarkdownText } from '../components/MarkdownText'
import { Button, Input, Logo, PageHeader } from '../components/ui'

const suggestions = [
  'Como melhorar minha empatia esta semana?',
  'Sugira um exercício de escuta ativa',
  'Plano de 7 dias para Comunicação',
  'Como está meu Score?',
  'Como retomar contato com um amigo distante?',
  'Como usar GoodCoins com sabedoria?',
]

export function IA() {
  const { user, sendChat, clearChat } = useApp()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [user?.chat.length, busy])

  if (!user) return null

  async function submit(prompt?: string) {
    const value = (prompt ?? text).trim()
    if (!value || busy) return
    setBusy(true)
    setText('')
    try {
      await sendChat(value)
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <PageHeader
        title="Companheira de evolução comportamental"
        description="Conversa com carinho e clareza: peço ajuda nas relações, no Score, no Método ou no que estiver pesando no coração hoje."
      />
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3 min-w-0">
          <Logo size={36} showWordmark={false} />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">IA do Bem</p>
            <p className="text-xs text-success font-medium">● Online</p>
          </div>
        </div>
        <Button variant="outline" className="shrink-0" onClick={() => void clearChat()}>
          Nova conversa
        </Button>
      </div>

      <div ref={listRef} className="flex-1 min-h-0 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {user.chat.map((m, i) => (
          <div
            key={i}
            className={`max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'ml-auto bg-primary text-primary-foreground whitespace-pre-wrap'
                : 'bg-muted text-foreground'
            }`}
          >
            {m.role === 'user' ? m.text : <MarkdownText text={m.text} />}
          </div>
        ))}
        {busy && (
          <div className="max-w-[min(100%,42rem)] rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
            Pensando…
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 sm:px-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => submit(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-accent disabled:opacity-50 transition"
            >
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit} className="flex gap-2 items-center">
          <Input
            placeholder="Pergunte algo à IA do Bem..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={busy}
            className="flex-1"
          />
          <Button type="submit" disabled={!text.trim() || busy} className="shrink-0">
            {busy ? '…' : 'Enviar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
