import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  BadgeCheck,
  Bell,
  Building2,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Compass,
  Earth,
  FileText,
  Gift,
  Handshake,
  Heart,
  House,
  LogOut,
  Scale,
  Search,
  Sparkles,
  Sprout,
  User,
  X,
} from 'lucide-react'
import { Logo } from './ui'
import { useApp } from '../context/AppContext'
import { PageChromeProvider, usePageChrome } from '../context/PageChromeContext'
import { globalSearch } from '../lib/search'
import { formatRelative } from '../lib/format'
import { normalizeRole, ROLE_NAV } from '../lib/roles'

const SIDEBAR_KEY = 'soudobem-sidebar-collapsed'

const iconByPath: Record<string, typeof House> = {
  '/app': House,
  '/app/metodo': Compass,
  '/app/score': Activity,
  '/app/relacoes': Heart,
  '/app/empresas': Building2,
  '/app/influenciadores': BadgeCheck,
  '/app/beneficios': Gift,
  '/app/parceiros': Handshake,
  '/app/fundo': Sprout,
  '/app/mediacao': Scale,
  '/app/executivo': ChartColumn,
  '/app/comunidade': Earth,
  '/app/perfil': User,
  '/app/painel-empresa': Building2,
  '/app/painel-conteudo': FileText,
  '/app/painel-mediador': Scale,
  '/app/ia': Sparkles,
}

export function AppLayout() {
  return (
    <PageChromeProvider>
      <AppLayoutInner />
    </PageChromeProvider>
  )
}

function AppLayoutInner() {
  const { user, logout, markNotificationRead, markAllNotificationsRead } = useApp()
  const { meta } = usePageChrome()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  const role = normalizeRole(user?.role)
  const nav = ROLE_NAV[role] || ROLE_NAV.pessoa
  const mobilePaths = nav.slice(0, 5).map((n) => n.to)
  const isIa = location.pathname === '/app/ia' || location.pathname.startsWith('/app/ia/')

  const hits = useMemo(() => globalSearch(query, user), [query, user])
  const unread = user?.notifications.filter((n) => !n.read).length ?? 0

  const headerTitle = meta.title || (location.pathname === '/app' ? 'Início' : '')
  const headerDescription = meta.description
  const headerKicker = meta.kicker

  if (!user) return null

  return (
    <div className="min-h-dvh bg-background flex">
      <a href="#conteudo-principal" className="skip-link">
        Ir para o conteúdo
      </a>

      <aside
        className={`hidden lg:flex shrink-0 flex-col border-r border-border/60 bg-sidebar sticky top-0 h-dvh transition-[width] duration-200 ease-out ${
          collapsed ? 'w-[4.75rem] p-3' : 'w-72 p-5'
        }`}
        aria-label="Navegação principal"
        data-collapsed={collapsed || undefined}
      >
        <div className={`flex items-center gap-2 mb-5 ${collapsed ? 'flex-col' : 'justify-between'}`}>
          <NavLink
            to="/app"
            className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)]"
            title="Sou do Bem"
          >
            <Logo size={collapsed ? 40 : 44} showWordmark={!collapsed} />
          </NavLink>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="min-h-10 min-w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition shrink-0"
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" aria-hidden />
            ) : (
              <ChevronLeft className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>

        {!collapsed && (
          <div className="mb-5 rounded-2xl bg-accent/50 border border-border px-3 py-2.5 text-xs">
            <p className="font-bold capitalize">{role}</p>
            {user.tenant && (
              <p className="text-muted-foreground mt-0.5 leading-snug">
                {user.tenant.region} · {user.tenant.name}
              </p>
            )}
          </div>
        )}

        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto overflow-x-hidden pr-0.5" aria-label="Módulos">
          {nav.map((item) => {
            const Icon = iconByPath[item.to] || House
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl min-h-11 text-sm font-medium transition duration-200 ${
                    collapsed ? 'justify-center px-0 py-3' : 'px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-[var(--shadow-glow)]'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2.2} aria-hidden />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {collapsed && <span className="sr-only">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/auth')
          }}
          title="Sair"
          className={`flex items-center gap-2 rounded-xl min-h-11 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition mt-2 ${
            collapsed ? 'justify-center px-0' : 'px-3.5'
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {!collapsed && <span>Sair</span>}
          {collapsed && <span className="sr-only">Sair</span>}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-dvh">
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/50 px-4 sm:px-5 lg:px-8 py-3 sm:py-3.5 flex items-center gap-3 shrink-0">
          {/* Toggle também no header (desktop) quando útil */}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:flex min-h-10 min-w-10 rounded-xl items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition shrink-0"
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" aria-hidden />
            ) : (
              <ChevronLeft className="h-5 w-5" aria-hidden />
            )}
          </button>

          <NavLink to="/app" className="lg:hidden rounded-xl shrink-0" aria-label="Início Sou do Bem">
            <Logo size={36} showWordmark={false} />
          </NavLink>

          <div className="min-w-0 flex-1">
            {headerKicker && (
              <p className="hidden sm:block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-1 truncate">
                {headerKicker}
              </p>
            )}
            {headerTitle && (
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight truncate leading-tight">
                {headerTitle}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:block relative w-[min(100%,16rem)] lg:w-72 xl:w-80">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-[1]"
                aria-hidden
              />
              <label htmlFor="global-search" className="sr-only">
                Buscar no app
              </label>
              <input
                id="global-search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowSearch(true)
                }}
                onFocus={() => setShowSearch(true)}
                placeholder="Buscar pessoas, empresas…"
                autoComplete="off"
                className="header-search-input"
              />
              {showSearch && query.length >= 2 && (
                <div
                  className="absolute top-full mt-2 left-0 right-0 card p-2 z-50 max-h-80 overflow-y-auto shadow-lg"
                  role="listbox"
                  aria-label="Resultados da busca"
                >
                  {hits.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">Nenhum resultado</p>
                  ) : (
                    hits.map((h) => (
                      <button
                        key={`${h.kind}-${h.id}`}
                        type="button"
                        role="option"
                        className="w-full text-left rounded-xl px-3 py-2.5 min-h-11 hover:bg-muted transition"
                        onClick={() => {
                          navigate(h.href)
                          setShowSearch(false)
                          setQuery('')
                        }}
                      >
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">{h.kind}</p>
                        <p className="text-sm font-semibold">{h.title}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="relative shrink-0">
              <button
                type="button"
                className="rounded-full min-h-11 min-w-11 flex items-center justify-center hover:bg-muted relative transition"
                aria-label={unread > 0 ? `Notificações, ${unread} não lidas` : 'Notificações'}
                aria-expanded={showNotifs}
                onClick={() => {
                  setShowNotifs((v) => !v)
                  setShowSearch(false)
                }}
              >
                <Bell className="h-5 w-5" aria-hidden />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unread}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-80 card p-0 z-50 shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <p className="font-bold text-sm">Notificações</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                        onClick={() => void markAllNotificationsRead()}
                      >
                        Ler todas
                      </button>
                      <button type="button" onClick={() => setShowNotifs(false)} aria-label="Fechar">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {user.notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">Sem notificações</p>
                    ) : (
                      user.notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 ${
                            n.read ? 'opacity-70' : 'bg-accent/30'
                          }`}
                          onClick={() => {
                            void markNotificationRead(n.id)
                            setShowNotifs(false)
                            if (n.href) navigate(n.href)
                          }}
                        >
                          <p className="text-sm font-semibold">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {formatRelative(n.createdAt)}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/app/perfil"
              className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-semibold flex items-center justify-center ring-2 ring-primary/30"
              aria-label="Meu perfil"
            >
              {user.name.charAt(0)}
            </Link>
          </div>
        </header>

        {headerDescription && (
          <div className="shrink-0 border-b border-border/50 bg-muted/30 px-4 sm:px-5 lg:px-8 py-3 sm:py-3.5">
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty max-w-4xl">
              {headerDescription}
            </p>
          </div>
        )}

        <main
          id="conteudo-principal"
          className={
            isIa
              ? 'flex-1 min-h-0 overflow-hidden w-full flex flex-col'
              : 'flex-1 min-h-0 overflow-y-auto w-full px-4 sm:px-5 lg:px-8 py-5 lg:py-6 pb-28 lg:pb-8 animate-in'
          }
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/60 pb-[env(safe-area-inset-bottom)]"
        aria-label="Navegação inferior"
      >
        <div className="grid grid-cols-5">
          {nav
            .filter((n) => mobilePaths.includes(n.to))
            .map((item) => {
              const Icon = iconByPath[item.to] || House
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="flex flex-col items-center gap-0.5 py-2 min-h-[56px] justify-center text-[10px] font-medium"
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`flex h-10 w-12 items-center justify-center rounded-full transition ${
                          isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} aria-hidden />
                      </div>
                      <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
                        {item.label.split(' ')[0]}
                      </span>
                    </>
                  )}
                </NavLink>
              )
            })}
        </div>
      </nav>
    </div>
  )
}
