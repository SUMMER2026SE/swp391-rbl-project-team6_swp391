import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api/client";
import { authApi } from "./api/auth";
import { profileApi, type ProfileResponse } from "./api/profile";
import { classesApi } from "./api/classes";
import type { LoginRequest, RegisterRequest, Role, UserResponse, UserStatus } from "./api/types";

export type FrontendRole = "student" | "teacher" | "admin";

// Student status for access control
export type StudentStatus = "GUEST" | "ACTIVE";

// Helper to check if student is active (joined a class)
export function isStudentActive(user: Pick<User, "role" | "status" | "classId"> | null): boolean {
  if (!user || user.role !== "student") return false;

  // Student must have ACTIVE status AND a classId to be considered active
  if (user.status !== "ACTIVE") return false;

  return !!("classId" in user && user.classId);
}

// Helper to check if user is a guest student (not joined any class)
export function isStudentGuest(user: Pick<User, "role" | "status" | "classId"> | null): boolean {
  if (!user || user.role !== "student") return false;

  // Guest if: no classId OR status is not ACTIVE
  const hasClassId = "classId" in user && user.classId;
  const isActiveStatus = user.status === "ACTIVE";

  return !hasClassId || !isActiveStatus;
}

// Get redirect path based on student status
export function getStudentStatusRedirect(
  user: Pick<User, "role" | "status" | "classId"> | null,
): string | null {
  if (!user) {
    return "/login";
  }

  if (user.role !== "student") {
    return null; // Not a student, no redirect needed
  }

  // Guest students cannot access protected routes
  if (!isStudentActive(user)) {
    return "/"; // Redirect to landing page
  }

  return null; // Active student, allow access
}

export type User = {
  id: string;
  name: string;
  email: string;
  role: FrontendRole;
  avatar?: string | null;
  googleAvatar?: string | null;
  status?: UserStatus;
  classId?: string | null;
};

type AuthCtx = {
  user: User | null;
  loaded: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterRequest) => Promise<void>;
  loginWithGoogle: (idToken: string, role?: string) => Promise<User>;
  logout: () => void;
  updateCurrentUser: (patch: Partial<User>) => void;
  refreshCurrentUser: () => Promise<User>;
  accessToken: string | null;
};

const Ctx = createContext<AuthCtx | null>(null);
const USER_KEY = "midori_user";
const TOKEN_KEY = "midori_access_token";

function mapBackendRole(role: Role): FrontendRole {
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
    avatar: r.avatarUrl ?? null,
    status: r.status,
  };
}

export function isAvatar(s: string | null | undefined): s is string {
  return !!s && s.trim() !== "";
}

export function getUserAvatar(user: User | null): string | null {
  if (!user) return null;
  if (isAvatar(user.avatar)) return user.avatar;
  if (isAvatar(user.googleAvatar)) return user.googleAvatar;
  return null;
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isTeacherPending(): boolean {
  const u = getStoredUser();
  return u?.role === "teacher" && u?.status === "PENDING";
}

export function getAvatarInitial(user: User | null, displayName?: string | null): string {
  const name =
    (displayName && isAvatar(displayName) ? displayName : null) ||
    (user && isAvatar(user.name) ? user.name : null) ||
    (user && isAvatar(user.email) ? user.email : null);
  if (name) return name.trim().charAt(0).toUpperCase();
  return "U";
}

function mergeUser(storedUser: User | null, apiUser: User): User {
  return {
    ...apiUser,
    ...(storedUser ?? {}),
    id: storedUser?.id ?? apiUser.id,
    email: storedUser?.email ?? apiUser.email,
    role: storedUser?.role ?? apiUser.role,
    status: storedUser?.status ?? apiUser.status,
    avatar: storedUser?.avatar ?? apiUser.avatar ?? null,
    googleAvatar: storedUser?.googleAvatar ?? apiUser.googleAvatar ?? null,
    name: storedUser?.name ?? apiUser.name,
  };
}

async function hydrateWithProfile(baseUser: User): Promise<User> {
  let user = { ...baseUser };
  try {
    const profile: ProfileResponse = await profileApi.getMyProfile();
    const profileAvatar = isAvatar(profile.avatarUrl) ? profile.avatarUrl : null;
    const profileName = isAvatar(profile.displayName) ? profile.displayName : null;
    user = {
      ...user,
      name: profileName ?? user.name,
      avatar: profileAvatar ?? user.avatar ?? null,
    };
  } catch {}

  if (user.role === "student") {
    try {
      const classes = await classesApi.getJoinedClasses();
      if (classes && classes.length > 0) {
        user.classId = classes[0].id;
      } else {
        user.classId = null;
      }
    } catch {}
  }

  return user;
}

export function rolePath(role: FrontendRole) {
  return role === "student" ? "/student" : role === "teacher" ? "/teacher" : "/admin";
}

export function getDashboardPath(user: Pick<User, "role" | "status" | "classId">) {
  if (
    user.role === "teacher" &&
    (user.status === "PENDING_APPROVAL" || user.status === "REJECTED")
  ) {
    return "/teacher-pending";
  }

  return rolePath(user.role);
}

export function getRouteGuardRedirect(
  user: Pick<User, "role" | "status" | "classId"> | null,
  routeRole: FrontendRole,
) {
  if (!user) {
    return "/login";
  }

  if (routeRole === "teacher") {
    if (user.role !== "teacher") {
      return getDashboardPath(user);
    }

    if (user.status === "PENDING_APPROVAL" || user.status === "REJECTED") {
      return "/teacher-pending";
    }

    return null;
  }

  if (user.role !== routeRole) {
    return getDashboardPath(user);
  }

  return null;
}

export function getTeacherPendingRedirect(user: Pick<User, "role" | "status" | "classId"> | null) {
  if (!user) {
    return "/login";
  }

  return getDashboardPath(user) === "/teacher-pending" ? null : getDashboardPath(user);
}

export function canAccessRoleRoute(user: Pick<User, "role" | "status" | "classId">, routeRole: FrontendRole) {
  return getRouteGuardRedirect(user, routeRole) === null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  const persistUser = (u: User | null) => {
    setUser(u);
    if (typeof window !== "undefined") {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(USER_KEY);
    }
  };

  const refreshCurrentUser = async () => {
    const userResponse = await authApi.getMe();
    const storedRaw = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
    const storedUser: User | null = storedRaw ? JSON.parse(storedRaw) : null;
    const apiUser = userResponseToUser(userResponse);
    const merged = mergeUser(storedUser, apiUser);
    const hydrated = await hydrateWithProfile(merged);
    persistUser(hydrated);
    return hydrated;
  };

  useEffect(() => {
    async function restore() {
      const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

      if (token) {
        try {
          await refreshCurrentUser();
        } catch (err) {
          console.debug("[Auth] getMe failed during restore", err);
          api.removeToken();
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      } else {
        try {
          const raw = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
          if (raw) setUser(JSON.parse(raw));
        } catch {}
      }

      setLoaded(true);
    }

    restore();
  }, []);

  const value: AuthCtx = {
    user,
    loaded,
    accessToken: typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,

    login: async (email, password) => {
      const res = await authApi.login({ email, password });
      const data = res;

      api.setToken(data.accessToken);
      const u = userResponseToUser(data.user);
      const hydrated = await hydrateWithProfile(u);
      persistUser(hydrated);
      // Notify other providers (e.g. NotificationContext) that the auth
      // credentials have changed so they can re-open / close the realtime
      // push channel. We use a custom DOM event rather than a context to
      // keep the auth layer free of cross-provider imports.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("midori:auth-changed"));
      }
      return hydrated;
    },

    register: async (data) => {
      await authApi.register(data);
    },

    loginWithGoogle: async (idToken: string, role?: string) => {
      const res = await authApi.googleLogin(idToken, role);
      api.setToken(res.accessToken);
      let u = userResponseToUser(res.user);
      if (!isAvatar(u.avatar) && !isAvatar(u.googleAvatar)) {
        const base64Url = idToken.split(".")[1];
        if (base64Url) {
          try {
            const payload = JSON.parse(atob(base64Url.replace(/-/g, "+").replace(/_/g, "/")));
            if (isAvatar(payload.picture)) {
              u = { ...u, googleAvatar: payload.picture };
            }
          } catch {}
        }
      }
      const hydrated = await hydrateWithProfile(u);
      persistUser(hydrated);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("midori:auth-changed"));
      }
      return hydrated;
    },

    logout: () => {
      api.removeToken();
      localStorage.removeItem(TOKEN_KEY);
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith("midori_admin_qb_cache_")) {
            localStorage.removeItem(k);
          }
        }
      } catch {}
      persistUser(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("midori:auth-changed"));
      }
    },

    updateCurrentUser: (patch: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...patch };
      persistUser(updated);
    },

    refreshCurrentUser,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}

type ThemeCtx = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

type LanguageCtx = {
  language: "en" | "vi";
  setLanguage: (lang: "en" | "vi") => void;
};

const ThemeCtx = createContext<ThemeCtx>({ theme: "dark", toggleTheme: () => {} });
const LanguageCtx = createContext<LanguageCtx>({ language: "en", setLanguage: () => {} });
const THEME_KEY = "midori_theme";
const LANGUAGE_KEY = "midori_language";

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

  return <ThemeCtx.Provider value={{ theme, toggleTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

export function useLanguage() {
  return useContext(LanguageCtx);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<"en" | "vi">("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY) as "en" | "vi" | null;
      if (saved === "en" || saved === "vi") {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: "en" | "vi") => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_KEY, lang);
    }
  };

  return <LanguageCtx.Provider value={{ language, setLanguage }}>{children}</LanguageCtx.Provider>;
}
