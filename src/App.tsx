import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { CatalogProvider } from './context/CatalogContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './components/AppLayout'
import { Landing } from './pages/Landing'
import { Auth } from './pages/Auth'
import { Onboarding } from './pages/Onboarding'
import { Home } from './pages/Home'
import { Metodo } from './pages/Metodo'
import { Score } from './pages/Score'
import { Relacoes } from './pages/Relacoes'
import { EmpresaDetail, Empresas } from './pages/Empresas'
import { Influenciadores, InfluencerDetail } from './pages/Influenciadores'
import { Marketplace } from './pages/Marketplace'
import { Parceiros, QRCodePage } from './pages/Parceiros'
import { Fundo } from './pages/Fundo'
import { Mediacao } from './pages/Mediacao'
import { Executivo } from './pages/Executivo'
import { Comunidade } from './pages/Comunidade'
import { IA } from './pages/IA'
import { Perfil } from './pages/Perfil'
import { PainelEmpresa } from './pages/PainelEmpresa'
import { PainelConteudo } from './pages/PainelConteudo'
import { PainelMediador } from './pages/PainelMediador'
import { normalizeRole, ROLE_NAV } from './lib/roles'

function RequireAuth() {
  const { isAuthenticated, user, loading } = useApp()
  if (loading) {
    return (
      <div className="min-h-dvh soft-gradient flex flex-col items-center justify-center gap-3 text-muted-foreground" role="status" aria-live="polite">
        <div className="spinner h-8 w-8 border-[3px] border-primary/30 border-t-primary" aria-hidden />
        <p className="text-sm font-medium">Preparando seu espaço seguro…</p>
      </div>
    )
  }
  if (!isAuthenticated || !user) return <Navigate to="/auth" replace />
  if (!user.onboarded) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user } = useApp()
  const location = useLocation()
  if (!user) return null
  const role = normalizeRole(user.role)
  const allowed = ROLE_NAV[role].map((n) => n.to)
  // allow IA always if in any nav or explicitly
  const path = location.pathname.replace(/\/$/, '') || '/app'
  const base = '/' + path.split('/').slice(1, 3).join('/')
  const ok =
    allowed.includes(path) ||
    allowed.includes(base) ||
    path.startsWith('/app/ia') ||
    path.startsWith('/app/empresas/') ||
    path.startsWith('/app/influenciadores/') ||
    path.startsWith('/app/parceiros/')
  if (!ok && path !== '/app') {
    return <Navigate to={allowed[0] || '/app'} replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<RequireAuth />}>
        <Route
          path="/app"
          element={
            <AppLayout />
          }
        >
          <Route
            element={
              <RoleGuard>
                <Outlet />
              </RoleGuard>
            }
          >
            <Route index element={<Home />} />
            <Route path="metodo" element={<Metodo />} />
            <Route path="score" element={<Score />} />
            <Route path="relacoes" element={<Relacoes />} />
            <Route path="empresas" element={<Empresas />} />
            <Route path="empresas/:id" element={<EmpresaDetail />} />
            <Route path="influenciadores" element={<Influenciadores />} />
            <Route path="influenciadores/:id" element={<InfluencerDetail />} />
            <Route path="beneficios" element={<Marketplace />} />
            <Route path="parceiros" element={<Parceiros />} />
            <Route path="parceiros/qrcode" element={<QRCodePage />} />
            <Route path="fundo" element={<Fundo />} />
            <Route path="mediacao" element={<Mediacao />} />
            <Route path="executivo" element={<Executivo />} />
            <Route path="comunidade" element={<Comunidade />} />
            <Route path="ia" element={<IA />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="painel-empresa" element={<PainelEmpresa />} />
            <Route path="painel-conteudo" element={<PainelConteudo />} />
            <Route path="painel-mediador" element={<PainelMediador />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <CatalogProvider>
          <AppRoutes />
        </CatalogProvider>
      </ToastProvider>
    </AppProvider>
  )
}
