import React from "react";
import type { User, Role } from "./store";
import { useStore } from "./store";

type AuthCtx = {
  user: User | null;
  login: (email: string) => { ok: boolean; message?: string };
  logout: () => void;
  register: (full_name: string, email: string, role: Role) => { ok: boolean; message?: string };
};

const AuthContext = React.createContext<AuthCtx | null>(null);

const STORAGE_KEY = "satcity_auth_user_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { users, setUsers } = useStore();
  const [userId, setUserId] = React.useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    try {
      if (userId) localStorage.setItem(STORAGE_KEY, userId);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, [userId]);

  const user = React.useMemo(() => users.find((u) => u.id === userId) || null, [users, userId]);

  const login = (email: string) => {
    const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return { ok: false, message: "No account found with that email." };
    if (!u.is_active) return { ok: false, message: "Account pending approval by an administrator." };
    setUserId(u.id);
    return { ok: true };
  };

  const logout = () => setUserId(null);

  const register = (full_name: string, email: string, role: Role) => {
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, message: "An account with this email already exists." };
    const newUser: User = {
      id: "u" + Math.random().toString(36).slice(2, 8),
      full_name,
      email,
      role,
      is_active: role === "patient",
      created_at: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    if (newUser.is_active) setUserId(newUser.id);
    return { ok: true, message: newUser.is_active ? "Registration successful." : "Registration successful. Awaiting admin approval." };
  };

  return <AuthContext.Provider value={{ user, login, logout, register }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
