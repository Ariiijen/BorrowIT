import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { redirectByRole } from '@/features/auth/utils/redirectByRole'
import { LandingPage } from '@/features/landing/pages/LandingPage'

const AppLayout = lazy(() => import('@/components/layout/AppLayout').then((module) => ({ default: module.AppLayout })))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const LenderDashboard = lazy(() => import('@/features/dashboard/pages/LenderDashboard').then((module) => ({ default: module.LenderDashboard })))
const AdminDashboard = lazy(() => import('@/features/dashboard/pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })))
const UsersPage = lazy(() => import('@/features/admin/UsersPage').then((module) => ({ default: module.UsersPage })))
const RequestsPage = lazy(() => import('@/features/borrowing/RequestsPage').then((module) => ({ default: module.RequestsPage })))
const HistoryPage = lazy(() => import('@/features/borrowing/HistoryPage').then((module) => ({ default: module.HistoryPage })))
const DisputesPage = lazy(() => import('@/features/disputes/DisputesPage').then((module) => ({ default: module.DisputesPage })))
const EquipmentPage = lazy(() => import('@/features/equipment/EquipmentPage').then((module) => ({ default: module.EquipmentPage })))
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage').then((module) => ({ default: module.NotificationsPage })))
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

function RouteFallback() {
  return <div className="min-h-screen space-y-4 bg-zinc-50 p-6 dark:bg-zinc-950"><Skeleton className="h-8 w-48" /><Skeleton className="h-24 w-full" /><Skeleton className="h-56 w-full" /></div>
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, profile } = useAuth()
  if (isLoading) return <LoadingSpinner />
  if (isAuthenticated) return <Navigate to={redirectByRole(profile?.role)} replace />
  return children
}

function WorkspaceLayout() {
  return <ProtectedRoute><AppLayout /></ProtectedRoute>
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route element={<WorkspaceLayout />}>
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Borrower', 'Faculty']}><DashboardPage /></ProtectedRoute>} />
        <Route path="/lender/dashboard" element={<ProtectedRoute allowedRoles={['Lender']}><LenderDashboard /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/reports" element={<ProtectedRoute allowedRoles={['Admin']}><ReportsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/disputes" element={<ProtectedRoute allowedRoles={['Admin']}><DisputesPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  )
}
