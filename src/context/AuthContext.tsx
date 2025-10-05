import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { setAuthToken, authApi } from "../api/client";

export type User = { email: string } | null;

type Ctx = {
  user: User;
  token: string | null;
  setUser: (u: User) => void;
  setToken: (t: string | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

const KEY_TOKEN = "auth:token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load a saved token on boot (optional)
  useEffect(() => {
    (async () => {
      try {
        const t = await SecureStore.getItemAsync(KEY_TOKEN);
        if (t) setToken(t);
      } catch {}
    })();
  }, []);

  // Keep axios header in sync with token, and persist it
  useEffect(() => {
    setAuthToken(token || undefined);
    (async () => {
      try {
        if (token) await SecureStore.setItemAsync(KEY_TOKEN, token);
        else await SecureStore.deleteItemAsync(KEY_TOKEN);
      } catch {}
    })();
  }, [token]);

  const logout = async () => {
    try {
      // clear refresh cookie on server (best effort)
      await authApi.post("/auth/logout");
    } catch {}
    setToken(null);
    setUser(null);
    // axios header is cleared by the effect above
  };

  const value = useMemo(() => ({ user, token, setUser, setToken, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider/>");
  return ctx;
}
