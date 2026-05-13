import axios from 'axios';

const TOKEN_KEY = 'ss_token';
const BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT to every request if one is stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// On 401, fire an event so AuthContext can log the user out
api.interceptors.response.use(
  (res) => res,
  (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('ss:logout'));
    }
    return Promise.reject(err);
  },
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  message: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

export interface Assignment {
  id: string;
  lecturer_id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  max_score: number | null;
  allow_late_submission: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_path: string | null;
  submission_text: string | null;
  status: 'draft' | 'submitted' | 'under_review' | 'graded' | 'returned';
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafeUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  is_active: number;
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  status: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string | null;
  created_at: string;
}

// ── API modules ───────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => api.get<HealthResponse>('/api/health'),
};

export const authApi = {
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    role: 'student' | 'lecturer' | 'teaching_assistant';
  }) => api.post('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/api/auth/login', data),

  logout: () => api.post('/api/auth/logout'),
};

export const usersApi = {
  getAll:  ()                          => api.get<{ users: SafeUser[] }>('/api/users'),
  getById: (id: string)                => api.get<{ user: SafeUser }>(`/api/users/${id}`),
  create:  (data: unknown)             => api.post<{ user: SafeUser }>('/api/users', data),
  update:  (id: string, data: unknown) => api.put<{ user: SafeUser }>(`/api/users/${id}`, data),
  remove:  (id: string)                => api.delete(`/api/users/${id}`),
};

export const submissionsApi = {
  getAll:  ()                          => api.get<{ submissions: Submission[] }>('/api/submissions'),
  getById: (id: string)                => api.get<{ submission: Submission }>(`/api/submissions/${id}`),
  create:  (data: unknown)             => api.post<{ submission: Submission }>('/api/submissions', data),
  update:  (id: string, data: unknown) => api.put<{ submission: Submission }>(`/api/submissions/${id}`, data),
  remove:  (id: string)                => api.delete(`/api/submissions/${id}`),
};

export const assignmentsApi = {
  getAll:  ()                          => api.get<{ assignments: Assignment[] }>('/api/assignments'),
  getById: (id: string)                => api.get<{ assignment: Assignment }>(`/api/assignments/${id}`),
  create:  (data: unknown)             => api.post<{ assignment: Assignment }>('/api/assignments', data),
  update:  (id: string, data: unknown) => api.put<{ assignment: Assignment }>(`/api/assignments/${id}`, data),
  remove:  (id: string)                => api.delete(`/api/assignments/${id}`),
};

export const securityLogsApi = {
  getAll:  (params?: { severity?: string; limit?: number; offset?: number }) =>
    api.get<{ logs: AuditLog[]; total: number }>('/api/security-logs', { params }),
  getById: (id: string) => api.get<{ log: AuditLog }>(`/api/security-logs/${id}`),
};

export default api;
