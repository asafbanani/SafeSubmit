import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage }        from './pages/HomePage';
import { LoginPage }       from './pages/LoginPage';
import { RegisterPage }    from './pages/RegisterPage';
import { DashboardPage }   from './pages/DashboardPage';
import { SecurityLogsPage } from './pages/SecurityLogsPage';
import { NotFoundPage }    from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProfilePage }     from './pages/ProfilePage';

import { OpenSubmissionsPage }  from './pages/student/OpenSubmissionsPage';
import { MySubmissionsPage }    from './pages/student/MySubmissionsPage';

import { MyCoursesPage }              from './pages/lecturer/MyCoursesPage';
import { ManageSubmissionBoxesPage }  from './pages/lecturer/ManageSubmissionBoxesPage';
import { CreateSubmissionBoxPage }    from './pages/lecturer/CreateSubmissionBoxPage';
import { ReviewSubmissionsPage }      from './pages/lecturer/ReviewSubmissionsPage';
import ResourcePreviewPage            from './pages/lecturer/ResourcePreviewPage';

import { AssignedCoursesPage }      from './pages/ta/AssignedCoursesPage';
import { TAReviewSubmissionsPage }  from './pages/ta/TAReviewSubmissionsPage';

import { UserManagementPage }   from './pages/admin/UserManagementPage';
import { RoleManagementPage }   from './pages/admin/RoleManagementPage';
import { PendingApprovalsPage } from './pages/admin/PendingApprovalsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<HomePage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Authenticated — any logged-in user */}
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />

            {/* Student */}
            <Route path="/submissions/open" element={
              <ProtectedRoute roles={['student']}><OpenSubmissionsPage /></ProtectedRoute>
            } />
            <Route path="/submissions/mine" element={
              <ProtectedRoute roles={['student']}><MySubmissionsPage /></ProtectedRoute>
            } />

            {/* Lecturer */}
            <Route path="/lecturer/courses" element={
              <ProtectedRoute roles={['lecturer']}><MyCoursesPage /></ProtectedRoute>
            } />
            <Route path="/lecturer/boxes" element={
              <ProtectedRoute roles={['lecturer']}><ManageSubmissionBoxesPage /></ProtectedRoute>
            } />
            <Route path="/lecturer/boxes/create" element={
              <ProtectedRoute roles={['lecturer']}><CreateSubmissionBoxPage /></ProtectedRoute>
            } />
            <Route path="/lecturer/review" element={
              <ProtectedRoute roles={['lecturer']}><ReviewSubmissionsPage /></ProtectedRoute>
            } />
            <Route path="/lecturer/resource-preview" element={
              <ProtectedRoute roles={['lecturer', 'teaching_assistant', 'admin']}><ResourcePreviewPage /></ProtectedRoute>
            } />

            {/* Teaching Assistant */}
            <Route path="/ta/courses" element={
              <ProtectedRoute roles={['teaching_assistant']}><AssignedCoursesPage /></ProtectedRoute>
            } />
            <Route path="/ta/review" element={
              <ProtectedRoute roles={['teaching_assistant']}><TAReviewSubmissionsPage /></ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin']}><UserManagementPage /></ProtectedRoute>
            } />
            <Route path="/admin/roles" element={
              <ProtectedRoute roles={['admin']}><RoleManagementPage /></ProtectedRoute>
            } />
            <Route path="/admin/approvals" element={
              <ProtectedRoute roles={['admin']}><PendingApprovalsPage /></ProtectedRoute>
            } />
            <Route path="/security-logs" element={
              <ProtectedRoute roles={['admin']}><SecurityLogsPage /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
