"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  clearStoredAuth,
  getStoredAccessToken,
  getStoredUser,
  setStoredAuth,
} from "@/lib/auth-storage";
import type { User, LoginResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Try to restore session on mount
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const token = getStoredAccessToken();
      const storedUser = getStoredUser<User>();

      if (token && storedUser) {
        if (active) {
          setUser(storedUser);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await api.post<LoginResponse>("/auth/refresh");
        const { accessToken, user: userData } = response.data;
        if (!active) return;
        setStoredAuth(accessToken, userData);
        setUser(userData);
      } catch {
        clearStoredAuth();
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<LoginResponse>("/auth/login", {
        email,
        password,
      });

      const { accessToken, user: userData } = response.data;
      setStoredAuth(accessToken, userData);
      setUser(userData);

      // Redirect based on role
      if (
        userData.role === "ADMIN" ||
        userData.role === "MANAGER"
      ) {
        router.push("/schedule");
      } else {
        router.push("/my-shifts");
      }
    },
    [router]
  );

  const register = useCallback(
    async (data: { firstName: string; lastName: string; email: string; password: string }) => {
      await api.post("/auth/register", data);
      await login(data.email, data.password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore error
    }
    clearStoredAuth();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    isAdmin: user?.role === "ADMIN",
    isManager: user?.role === "MANAGER",
    isEmployee: user?.role === "EMPLOYEE",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
