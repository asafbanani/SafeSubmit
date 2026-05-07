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
  getAll:  ()                          => api.get('/api/users'),
  getById: (id: string)                => api.get(`/api/users/${id}`),
  create:  (data: unknown)             => api.post('/api/users', data),
  update:  (id: string, data: unknown) => api.put(`/api/users/${id}`, data),
  remove:  (id: string)                => api.delete(`/api/users/${id}`),
};

export const submissionsApi = {
  getAll:  ()                          => api.get('/api/submissions'),
  getById: (id: string)                => api.get(`/api/submissions/${id}`),
  create:  (data: unknown)             => api.post('/api/submissions', data),
  update:  (id: string, data: unknown) => api.put(`/api/submissions/${id}`, data),
  remove:  (id: string)                => api.delete(`/api/submissions/${id}`),
};

export const securityLogsApi = {
  getAll:  ()           => api.get('/api/security-logs'),
  getById: (id: string) => api.get(`/api/security-logs/${id}`),
};

export default api;
