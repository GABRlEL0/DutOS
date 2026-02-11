import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { LoginPage } from '@pages/auth/LoginPage';
import { Layout } from '@components/layout/Layout';
import { ProtectedRoute } from '@components/common/ProtectedRoute';
import { ToastContainer } from '@components/common/ToastContainer';
import { DashboardPage } from '@pages/DashboardPage';
import { ClientsPage } from '@pages/clients/ClientsPage';
import { ClientDetailPage } from '@pages/clients/ClientDetailPage';
import { ClientFormPage } from '@pages/clients/ClientFormPage';
import { PostsPage } from '@pages/posts/PostsPage';
import { PostFormPage } from '@pages/posts/PostFormPage';
import { QueuePage } from '@pages/QueuePage';
import { MisTareasPage } from '@pages/MisTareasPage';
import { ContentRequestsAdminPage } from '@pages/ContentRequestsAdminPage';
import { TemplatesPage } from '@pages/TemplatesPage';
import { SLADashboard } from '@pages/analytics/SLADashboard';
import { UsersPage } from '@pages/settings/UsersPage';
import { SettingsPage } from '@pages/settings/SettingsPage';
import { NotFoundPage } from '@pages/NotFoundPage';
// Client Portal
import { ClientLayout } from '@components/layout/ClientLayout';
import { ClientDashboard } from '@pages/client/ClientDashboard';
import { ClientPostsPage } from '@pages/client/ClientPostsPage';
import { ClientCalendarPage } from '@pages/client/ClientCalendarPage';
import { ContentRequestsPage } from '@pages/client/ContentRequestsPage';
import { ClientBrandPage } from '@pages/client/ClientBrandPage';
import { SetupPage } from '@pages/auth/SetupPage';
import { useOnlineStatus } from '@hooks/useDevice';
import { WifiOff } from 'lucide-react';

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();
  const isOnline = useOnlineStatus();

  // Determine redirect path based on role
  const getHomeRedirect = () => {
    if (user?.role === 'client') return '/client';
    return '/';
  };

  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium z-50 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          Sin conexión a internet. Algunas funciones pueden no estar disponibles.
        </div>
      )}

      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={getHomeRedirect()} replace /> : <LoginPage />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'creative', 'production']}>
              <Layout>
                <ClientsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients/new"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Layout>
                <ClientFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'creative', 'production']}>
              <Layout>
                <ClientDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Layout>
                <ClientFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/posts"
          element={
            <ProtectedRoute>
              <Layout>
                <PostsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/posts/new"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'creative']}>
              <Layout>
                <PostFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/posts/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'creative']}>
              <Layout>
                <PostFormPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/queue"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Layout>
                <QueuePage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tareas"
          element={
            <ProtectedRoute>
              <Layout>
                <MisTareasPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/templates"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'creative']}>
              <Layout>
                <TemplatesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Content Requests Admin */}
        <Route
          path="/requests"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Layout>
                <ContentRequestsAdminPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics/sla"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Layout>
                <SLADashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Client Portal */}
        <Route
          path="/client"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboard />} />
          <Route path="posts" element={<ClientPostsPage />} />
          <Route path="requests" element={<ContentRequestsPage />} />
          <Route path="calendar" element={<ClientCalendarPage />} />
          <Route path="brand" element={<ClientBrandPage />} />
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>

      {/* Toast notifications */}
      <ToastContainer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App