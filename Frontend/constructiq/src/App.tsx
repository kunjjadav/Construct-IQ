import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "./components/ui/Toast";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppShell from "./components/layout/AppShell";
import Spinner from "./components/ui/Spinner";
import { useAuthStore } from "./store/useAuthStore";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const VerifyPage = lazy(() => import("./pages/auth/VerifyPage"));
const AgentWarRoom = lazy(() => import("./pages/dashboard/AgentWarRoom"));
const ProjectListPage = lazy(() => import("./pages/dashboard/ProjectListPage"));
const FieldOpsDashboard = lazy(() => import("./pages/field/FieldOpsDashboard"));
const AdminUsersPage = lazy(() => import("./pages/dashboard/AdminUsersPage"));
const MaintenanceKanbanPage = lazy(
  () => import("./pages/dashboard/MaintenanceKanbanPage"),
);
const MilestoneTimelinePage = lazy(
  () => import("./pages/dashboard/MilestoneTimelinePage"),
);
const PhotoGalleryPage = lazy(
  () => import("./pages/dashboard/PhotoGalleryPage"),
);

const ClientRFIs = lazy(() => import("./pages/client/ClientRFIs"));
const ClientChangeOrders = lazy(
  () => import("./pages/client/ClientChangeOrders"),
);
const ClientDocuments = lazy(() => import("./pages/client/ClientDocuments"));

const PageLoader = () => (
  <div className="flex w-full h-full items-center justify-center min-h-[50vh]">
    <Spinner size="lg" />
  </div>
);

/** Wraps a lazy page in the authenticated AppShell layout with error boundary */
function AuthenticatedPage({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Array<"ADMIN" | "AGENT" | "CLIENT" | "SITE_OFFICER">;
}) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppShell>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </ErrorBoundary>
      </AppShell>
    </ProtectedRoute>
  );
}

/**
 * RoleRedirect: Routes the user to the correct default portal based on their RBAC role.
 * CLIENT → /projects (project list first), SITE_OFFICER → /field, AGENT/ADMIN → /dashboard
 */
function RoleRedirect() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === "CLIENT" || user?.role === "SITE_OFFICER") {
    return <Navigate to="/projects" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />

      <ErrorBoundary>
        <Routes>
          <Route
            path="/login"
            element={
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="/auth/verify"
            element={
              <Suspense fallback={<PageLoader />}>
                <VerifyPage />
              </Suspense>
            }
          />


          <Route
            path="/dashboard"
            element={
              <AuthenticatedPage
                allowedRoles={["ADMIN", "AGENT", "CLIENT", "SITE_OFFICER"]}
              >
                <AgentWarRoom />
              </AuthenticatedPage>
            }
          />

          <Route
            path="/directory"
            element={
              <AuthenticatedPage allowedRoles={["ADMIN", "AGENT"]}>
                <AdminUsersPage />
              </AuthenticatedPage>
            }
          />

          <Route
            path="/maintenance"
            element={
              <AuthenticatedPage
                allowedRoles={["ADMIN", "AGENT", "SITE_OFFICER", "CLIENT"]}
              >
                <MaintenanceKanbanPage />
              </AuthenticatedPage>
            }
          />

          <Route
            path="/milestones"
            element={
              <AuthenticatedPage
                allowedRoles={["ADMIN", "AGENT", "SITE_OFFICER", "CLIENT"]}
              >
                <MilestoneTimelinePage />
              </AuthenticatedPage>
            }
          />

          <Route
            path="/photos"
            element={
              <AuthenticatedPage
                allowedRoles={["ADMIN", "AGENT", "SITE_OFFICER", "CLIENT"]}
              >
                <PhotoGalleryPage />
              </AuthenticatedPage>
            }
          />

          <Route
            path="/projects"
            element={
              <AuthenticatedPage
                allowedRoles={["ADMIN", "AGENT", "CLIENT", "SITE_OFFICER"]}
              >
                <ProjectListPage />
              </AuthenticatedPage>
            }
          />


          <Route
            path="/client"
            element={
              <ProtectedRoute
                allowedRoles={["CLIENT", "ADMIN", "AGENT", "SITE_OFFICER"]}
              >
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/client/summary"
            element={
              <ProtectedRoute
                allowedRoles={["CLIENT", "ADMIN", "AGENT", "SITE_OFFICER"]}
              >
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/client/rfis"
            element={
              <AuthenticatedPage
                allowedRoles={["CLIENT", "ADMIN", "AGENT", "SITE_OFFICER"]}
              >
                <ClientRFIs />
              </AuthenticatedPage>
            }
          />

          <Route
            path="/client/change-orders"
            element={
              <AuthenticatedPage
                allowedRoles={["CLIENT", "ADMIN", "AGENT", "SITE_OFFICER"]}
              >
                <ClientChangeOrders />
              </AuthenticatedPage>
            }
          />

          <Route
            path="/client/documents"
            element={
              <AuthenticatedPage
                allowedRoles={["CLIENT", "ADMIN", "AGENT", "SITE_OFFICER"]}
              >
                <ClientDocuments />
              </AuthenticatedPage>
            }
          />

          <Route
            path="/field"
            element={
              <AuthenticatedPage
                allowedRoles={["SITE_OFFICER", "AGENT", "ADMIN"]}
              >
                <FieldOpsDashboard />
              </AuthenticatedPage>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="p-8 text-center text-xl text-[var(--color-text-secondary)]">
                404: Page not found — Coming Soon
              </div>
            }
          />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
