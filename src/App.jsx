import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { usePermissions } from '@/lib/usePermissions';
import AccessDenied from '@/components/shared/AccessDenied';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { WorkspaceProvider } from '@/lib/WorkspaceContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import JoinWorkspace from '@/pages/JoinWorkspace';
import ErrorBoundary from '@/components/ErrorBoundary';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import LoginSplash from '@/components/LoginSplash';
import AppLayout from '@/components/layout/AppLayout.jsx';
import Dashboard from '@/pages/Dashboard.jsx';
import Schedule from '@/pages/Schedule';
import Contracts from '@/pages/Contracts';
import Teams from '@/pages/Teams';
import Activities from '@/pages/Activities';
import Productivity from '@/pages/Productivity';
import DirectorView from '@/pages/DirectorView';
import Registers from '@/pages/Registers.jsx';
import UserManual from '@/pages/UserManual';
import Materials from '@/pages/Materials';
import MaintenanceAgent from '@/pages/MaintenanceAgent';
import FieldLog from '@/pages/FieldLog.jsx';
import WorkspaceSetup from '@/pages/WorkspaceSetup';
import WorkspaceAdmin from '@/pages/WorkspaceAdmin';
import AdminMaster from '@/pages/AdminMaster';
import MasterRepair from '@/pages/MasterRepair';
import EmployeeProfile from '@/pages/EmployeeProfile';
import Reports from '@/pages/Reports';

// Guard de rota — exibe AccessDenied se allowed=false
function RouteGuard({ allowed, children }) {
  if (!allowed) return <AccessDenied />;
  return children;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const permissions = usePermissions();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <LoginSplash />;
    }
  }

  return (
    <Routes>
      <Route element={<ErrorBoundary><AppLayout /></ErrorBoundary>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/contracts" element={<RouteGuard allowed={!permissions.isReadOnly}><Contracts /></RouteGuard>} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/productivity" element={<RouteGuard allowed={permissions.canViewDirector || permissions.canManageTeams}><Productivity /></RouteGuard>} />
        <Route path="/director" element={<RouteGuard allowed={permissions.canViewDirector}><DirectorView /></RouteGuard>} />
        <Route path="/registers" element={<RouteGuard allowed={permissions.canManageRegisters}><Registers /></RouteGuard>} />
        <Route path="/manual" element={<UserManual />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/agent" element={<MaintenanceAgent />} />
        <Route path="/fieldlog" element={<FieldLog />} />
        <Route path="/workspace-admin" element={<RouteGuard allowed={permissions.canManageWorkspace}><WorkspaceAdmin /></RouteGuard>} />
        <Route path="/admin-master" element={<RouteGuard allowed={permissions.canAccessAdminMaster}><AdminMaster /></RouteGuard>} />
        <Route path="/master-repair" element={<RouteGuard allowed={permissions.canAccessAdminMaster}><MasterRepair /></RouteGuard>} />
        <Route path="/employees/:id" element={<EmployeeProfile />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="/workspace-setup" element={<WorkspaceSetup />} />
      <Route path="/join/:token" element={<JoinWorkspace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <WorkspaceProvider>
              <AuthenticatedApp />
            </WorkspaceProvider>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App