import { Card, Skeleton } from './ui'

/** Skeleton genérico de página com header + cards */
export function PageSkeleton({
  cards = 4,
  rows = 3,
  showHeader = true,
}: {
  cards?: number
  rows?: number
  showHeader?: boolean
}) {
  return (
    <div className="animate-in" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando conteúdo…</span>
      {showHeader && (
        <div className="mb-8 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i} className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </Card>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Card key={i} className="space-y-3">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      <span className="sr-only">Carregando lista…</span>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="flex gap-4 items-center">
          <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-8 w-20 shrink-0" />
        </Card>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Carregando formulário…</span>
      <Card className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-32" />
      </Card>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-busy="true" className="animate-in">
      <span className="sr-only">Carregando painel…</span>
      <div className="mb-8 space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-14" />
            <Skeleton className="h-3 w-20" />
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-0 overflow-hidden">
          <div className="p-5 space-y-3">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </Card>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="flex justify-between items-center gap-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-8 w-12" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
