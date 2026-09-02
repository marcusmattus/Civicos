import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { RunProvider } from './app/run'
import { useSession } from './app/session'
import AppShell from './components/AppShell'
import AgentsScreen from './screens/AgentsScreen'
import AuditScreen from './screens/AuditScreen'
import CommandCentreScreen from './screens/CommandCentreScreen'
import DatasetsScreen from './screens/DatasetsScreen'
import GovernanceScreen from './screens/GovernanceScreen'
import IndustriesScreen from './screens/IndustriesScreen'
import LoginScreen from './screens/LoginScreen'
import ModelCanvasScreen from './screens/ModelCanvasScreen'
import ModelsScreen from './screens/ModelsScreen'
import ReportsScreen from './screens/ReportsScreen'
import ResultsScreen from './screens/ResultsScreen'
import RunScreen from './screens/RunScreen'
import ScenariosScreen from './screens/ScenariosScreen'
import SettingsScreen from './screens/SettingsScreen'
import SimulationsScreen from './screens/SimulationsScreen'

function RequireSession({ children }: { children: ReactNode }) {
  const { signedIn } = useSession()
  const location = useLocation()
  if (!signedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route
        element={
          <RequireSession>
            <RunProvider>
              <AppShell />
            </RunProvider>
          </RequireSession>
        }
      >
        <Route index element={<CommandCentreScreen />} />
        <Route path="model" element={<ModelCanvasScreen />} />
        <Route path="scenarios" element={<ScenariosScreen />} />
        <Route path="run" element={<RunScreen />} />
        <Route path="results" element={<ResultsScreen />} />
        <Route path="simulations" element={<SimulationsScreen />} />
        <Route path="industries" element={<IndustriesScreen />} />
        <Route path="datasets" element={<DatasetsScreen />} />
        <Route path="models" element={<ModelsScreen />} />
        <Route path="agents" element={<AgentsScreen />} />
        <Route path="audit" element={<AuditScreen />} />
        <Route path="governance" element={<GovernanceScreen />} />
        <Route path="reports" element={<ReportsScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
