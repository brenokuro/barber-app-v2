import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, getApiUrl, setAuthToken } from "@/lib/query-client";
import { fetch } from "expo/fetch";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "client" | "admin";
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("auth_token");
        if (stored) {
          setAuthToken(stored);
          const baseUrl = getApiUrl();
          const url = new URL("/api/auth/me", baseUrl);
          const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${stored}` },
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(stored);
          } else {
            setAuthToken(null);
            await AsyncStorage.removeItem("auth_token");
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await res.json();
    setAuthToken(data.token);
    await AsyncStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { name, email, password, phone });
    const data = await res.json();
    setAuthToken(data.token);
    await AsyncStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {}
    setAuthToken(null);
    await AsyncStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
