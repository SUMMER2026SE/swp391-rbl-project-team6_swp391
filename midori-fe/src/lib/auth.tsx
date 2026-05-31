import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api/client";
import { authApi } from "./api/auth";
import type { Role } from "./api/types";
import type { UserResponse } from "./api/types";

export type FrontendRole = "student" | "teacher" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: FrontendRole;
  avatar?: string;
  status?: "active" | "pending";
};

type AuthCtx = {
  user: User | null;
  loaded: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  logout: () => void;
  updateCurrentUser: (patch: Partial<User>) => void;
  accessToken: string | null;
};

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "midori_user";
const TOKEN_KEY = "midori_access_token";

function mapBackendRole(role: string): FrontendRole {
  switch (role) {
    case "TEACHER":
      return "teacher";
    case "ADMIN":
      return "admin";
    case "STUDENT":
    default:
      return "student";
  }
}

function userResponseToUser(r: UserResponse): User {
  return {
    id: r.id,
    name: r.name ?? r.email.split("@")[0],
    email: r.email,
    role: mapBackendRole(r.role),
    avatar: r.avatarUrl,
    status: r.status === "ACTIVE" ? "active" : "pending",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function restore() {
      const token =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

      if (token) {
        try {
          const userResponse = await authApi.getMe();
          setUser(userResponseToUser(userResponse));
        } catch (err) {
          console.debug("[Auth] getMe failed during restore", err);
          api.removeToken();
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      } else {
        try {
          const raw =
            typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
          if (raw) setUser(JSON.parse(raw));
        } catch {}
      }

      setLoaded(true);
    }

    restore();
  }, []);

  const persistUser = (u: User | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_KEY);
    }
  };

  const value: AuthCtx = {
    user,
    loaded,
    accessToken:
      typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,

    login: async (email, password) => {
      const res = await authApi.login({ email, password });
      const data = res;

      api.setToken(data.accessToken);
      const u = userResponseToUser(data.user);
      persistUser(u);
      return u;
    },

    register: async (email, password) => {
      await authApi.register({ email, password });
    },

    loginWithGoogle: async () => {
      const u: User = {
        id: "g_" + Date.now(),
        name: "Yuki Tanaka",
        email: "yuki@gmail.com",
        role: "student",
        status: "active",
      };
      persistUser(u);
      return u;
    },

    logout: () => {
      api.removeToken();
      localStorage.removeItem(TOKEN_KEY);
      persistUser(null);
    },

    updateCurrentUser: (patch: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...patch };
      persistUser(updated);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}

export function rolePath(role: FrontendRole) {
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
    if (typeof document !== "undefined")
      document.documentElement.classList.toggle("dark", next === "dark");
    if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, next);
  };

  return (
    <ThemeCtx.Provider value={{ theme, toggleTheme }}>{children}</ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
