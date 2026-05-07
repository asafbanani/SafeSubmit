import { useAuth } from '../context/AuthContext';
import { StudentDashboard } from './student/StudentDashboard';
import { LecturerDashboard } from './lecturer/LecturerDashboard';
import { TADashboard } from './ta/TADashboard';
import { AdminDashboard } from './admin/AdminDashboard';

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'student':            return <StudentDashboard />;
    case 'lecturer':           return <LecturerDashboard />;
    case 'teaching_assistant': return <TADashboard />;
    case 'admin':              return <AdminDashboard />;
    default:                   return null;
  }
}
