import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const TOKEN_KEY = 'ss_token';

export type UserRole = 'student' | 'lecturer' | 'teaching_assistant' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    // atob is available in all modern browsers
    const decoded = JSON.parse(atob(payload)) as Record<string, unknown>;
    if (
      typeof decoded['id'] === 'string' &&
      typeof decoded['email'] === 'string' &&
      typeof decoded['role'] === 'string' &&
      typeof decoded['full_name'] === 'string'
    ) {
      return {
        id: decoded['id'],
        email: decoded['email'],
        role: decoded['role'] as UserRole,
        full_name: decoded['full_name'],
      };
    }
    return null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    return stored ? decodeJwt(stored) : null;
  });

  function login(newToken: string) {
    const decoded = decodeJwt(newToken);
    if (!decoded) return;
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(decoded);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  // Listen for 401 events fired by the Axios interceptor
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('ss:logout', handler);
    return () => window.removeEventListener('ss:logout', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
