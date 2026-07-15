import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type PageMeta = {
  title?: string
  description?: string
  kicker?: string
}

type PageChromeApi = {
  meta: PageMeta
  setMeta: (meta: PageMeta) => void
  clearMeta: () => void
}

const PageChromeContext = createContext<PageChromeApi | null>(null)

export function PageChromeProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<PageMeta>({})

  const setMeta = useCallback((next: PageMeta) => {
    setMetaState(next)
  }, [])

  const clearMeta = useCallback(() => {
    setMetaState({})
  }, [])

  const api = useMemo(
    () => ({
      meta,
      setMeta,
      clearMeta,
    }),
    [meta, setMeta, clearMeta],
  )

  return <PageChromeContext.Provider value={api}>{children}</PageChromeContext.Provider>
}

export function usePageChrome() {
  const ctx = useContext(PageChromeContext)
  if (!ctx) throw new Error('usePageChrome must be used within PageChromeProvider')
  return ctx
}
