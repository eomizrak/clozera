import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useAccountStore } from '@/stores/account'
import { Spinner } from '@/components/ui/spinner'
const HomeView = lazy(() => import('@/views/HomeView'))
const AuthView = lazy(() => import('@/views/AuthView'))
const LanguagePairSelectView = lazy(() => import('@/views/LanguagePairSelectView'))
const DashboardView = lazy(() => import('@/views/DashboardView'))
const CollectionDetailView = lazy(() => import('@/views/CollectionDetailView'))
const PracticeSessionView = lazy(() => import('@/views/PracticeSessionView'))

function ProtectedRoute() {
  const { user, selectedLanguagePairSlug } = useAccountStore()
  const location = useLocation()
  if (!user)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    )
  if (!selectedLanguagePairSlug && location.pathname !== '/languages')
    return <Navigate to="/languages" replace />
  return <Outlet />
}
function GuestRoute() {
  const { user, selectedLanguagePairSlug } = useAccountStore()
  return user ? (
    <Navigate to={selectedLanguagePairSlug ? '/dashboard' : '/languages'} replace />
  ) : (
    <Outlet />
  )
}
export default function App() {
  const { hasLoaded, refreshSession } = useAccountStore()
  const { pathname, search } = useLocation()
  useEffect(() => {
    refreshSession()
  }, [refreshSession])
  useEffect(() => {
    if (pathname !== '/dashboard') window.scrollTo({ top: 0 })
  }, [pathname])
  if (!hasLoaded)
    return (
      <main className="grid min-h-screen place-items-center">
        <Spinner className="size-8" />
        <span className="sr-only">Restoring session</span>
      </main>
    )
  return (
    <Suspense
      fallback={
        <main className="flex justify-center p-12" role="status">
          <Spinner />
          <span className="sr-only">Loading page</span>
        </main>
      }
    >
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<AuthView />} />
          <Route path="/sign-up" element={<AuthView signUp />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/languages" element={<LanguagePairSelectView />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route
            path="/dashboard/collections/:id"
            element={<CollectionDetailView key={pathname} />}
          />
          <Route
            path="/dashboard/collections/:id/practice"
            element={<PracticeSessionView key={pathname + search} />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
