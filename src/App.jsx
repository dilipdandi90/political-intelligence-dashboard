import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { LoadingState } from './components/common/StatusMessage'
import OverviewPage from './pages/OverviewPage'
import NotFoundPage from './pages/NotFoundPage'

// Overview is the landing page so it ships in the main bundle; the rest load on demand.
const LokSabhaPage = lazy(() => import('./pages/LokSabhaPage'))
const AssemblyPage = lazy(() => import('./pages/AssemblyPage'))
const TrendsPage = lazy(() => import('./pages/TrendsPage'))
const DataSourcesPage = lazy(() => import('./pages/DataSourcesPage'))

export default function App() {
  return (
    <Suspense fallback={<LoadingState label="Loading section…" />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="lok-sabha" element={<LokSabhaPage />} />
          <Route path="assembly" element={<AssemblyPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="data" element={<DataSourcesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
