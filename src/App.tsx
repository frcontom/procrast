import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { FocusPage } from './pages/FocusPage'
import { TasksPage } from './pages/TasksPage'
import { HabitsPage } from './pages/HabitsPage'
import { DashboardPage } from './pages/DashboardPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { IdentityPage } from './pages/IdentityPage'
import { CoachPage } from './pages/CoachPage'
import { SettingsPage } from './pages/SettingsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { FullscreenPage } from './pages/FullscreenPage'

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'focus', element: <FocusPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'habits', element: <HabitsPage /> },
      { path: 'knowledge', element: <KnowledgePage /> },
      { path: 'identity', element: <IdentityPage /> },
      { path: 'coach', element: <CoachPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/focus/fullscreen',
    element: <ProtectedRoute><FullscreenPage /></ProtectedRoute>,
  },
])

export function App() {
  return <RouterProvider router={router} />
}
