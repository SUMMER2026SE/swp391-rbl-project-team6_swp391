import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "student" | "teacher" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  status?: "active" | "pending";
};

type AuthCtx = {
  user: User | null;
  loaded: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: Role, extra?: TeacherExtra) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => void;
};

export type TeacherExtra = {
  experience?: string;
  bio?: string;
  certificate?: File;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "midori_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem(KEY, JSON.stringify(u));
      else localStorage.removeItem(KEY);
    }
  };

  const inferRole = (email: string): Role => {
    if (email.includes("admin")) return "admin";
    if (email.includes("teacher") || email.includes("sensei")) return "teacher";
    return "student";
  };

  const value: AuthCtx = {
    user,
    loaded,
    login: async (email, _pw) => {
      const r = inferRole(email);
      const u: User = { id: "u_" + Date.now(), name: email.split("@")[0], email, role: r, status: "active" };
      persist(u);
      return u;
    },
    register: async (name, email, _pw, role, extra) => {
      if (role === "teacher") {
        const u: User = { id: "u_" + Date.now(), name, email, role, status: "pending" };
        persist(u);
        return u;
      }
      const u: User = { id: "u_" + Date.now(), name, email, role, status: "active" };
      persist(u);
      return u;
    },
    loginWithGoogle: async () => {
      const u: User = { id: "g_" + Date.now(), name: "Yuki Tanaka", email: "yuki@gmail.com", role: "student", status: "active" };
      persist(u);
      return u;
    },
    logout: () => persist(null),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}

export function rolePath(role: Role) {
  return role === "student" ? "/student" : role === "teacher" ? "/teacher" : "/admin";
}

// ─── Theme Context ─────────────────────────────────────────────────────────────

type ThemeCtx = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const ThemeCtx = createContext<ThemeCtx>({ theme: "dark", toggleTheme: () => {} });
const THEME_KEY = "midori_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
      if (saved) {
        setTheme(saved);
        document.documentElement.classList.toggle("dark", saved === "dark");
      } else {
        document.documentElement.classList.add("dark");
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", next === "dark");
    if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, next);
  };

  return <ThemeCtx.Provider value={{ theme, toggleTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
