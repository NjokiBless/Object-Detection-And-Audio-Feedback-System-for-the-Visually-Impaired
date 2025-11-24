// vi-app/src/api/client.ts
// Central Axios client for your Node Auth API (+ a couple helpers).
// Reads base URLs from Expo env:
//   EXPO_PUBLIC_API_URL    -> http://<your-ip>:3001   (Auth API)
//   EXPO_PUBLIC_DETECT_URL -> http://<your-ip>:8010   (Detection API)

import axios, { AxiosError } from "axios";

/* ------------------------------------------------------------------ */
/* URL normalization                                                   */
/* ------------------------------------------------------------------ */
function normalize(input?: string, fallback?: string): string {
  let v = (input || "").trim();
  if (!v) return (fallback || "").replace(/\/+$/, "");

  // add scheme if missing
  if (!/^https?:\/\//i.test(v)) v = "http://" + v;

  try {
    const u = new URL(v);
    // remove trailing slashes from path
    u.pathname = u.pathname.replace(/\/+$/, "");
    // return without trailing slash
    return u.toString().replace(/\/+$/, "");
  } catch {
    return (fallback || "").replace(/\/+$/, "");
  }
}

/* ------------------------------------------------------------------ */
/* Base URLs                                                           */
/* ------------------------------------------------------------------ */
const AUTH_FALLBACK = "http://192.168.0.105:3001"; // change to your LAN IP if desired
const DETECT_FALLBACK = "http://192.168.0.105:8010";

export const AUTH_BASE = normalize(process.env.EXPO_PUBLIC_API_URL, AUTH_FALLBACK);
export const DETECT_BASE = normalize(process.env.EXPO_PUBLIC_DETECT_URL, DETECT_FALLBACK);

/* ------------------------------------------------------------------ */
/* Axios instance for Auth API                                         */
/* ------------------------------------------------------------------ */
export const authApi = axios.create({
  baseURL: AUTH_BASE,
  withCredentials: true, // send/receive cookies (refresh token)
  timeout: 15000,
});

// Attach / remove bearer token on demand
export function setAuthToken(token?: string) {
  if (token) {
    authApi.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete authApi.defaults.headers.common.Authorization;
  }
}

// Minimal response logging to the Expo console (helps on device)
authApi.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    const info = {
      baseURL: AUTH_BASE,
      url: err?.config?.url,
      status: err?.response?.status,
      data: err?.response?.data,
    };
    console.log("[authApi error]", err?.message, JSON.stringify(info));
    return Promise.reject(err);
  }
);

/* ------------------------------------------------------------------ */
/* Light helpers                                                       */
/* ------------------------------------------------------------------ */
export function getBases() {
  return { AUTH_BASE, DETECT_BASE };
}

export async function pingAuth() {
  try {
    const { data } = await authApi.get("/auth/ping"); // (optional) implement on server if you want
    return data;
  } catch {
    return { ok: false };
  }
}

/* ------------------------------------------------------------------ */
/* SOS helpers (used by Safety screen)                                 */
/* ------------------------------------------------------------------ */
export const sosApi = {
  getContacts: () => authApi.get("/sos/contacts"),
  saveContacts: (contacts: Array<{ name?: string; email?: string; phone?: string }>) =>
    authApi.post("/sos/contacts", { contacts }),
  send: (payload: {
    fullName?: string;
    lat?: number;
    lng?: number;
    phones?: string[];
    emails?: string[];
  }) => authApi.post("/sos/send", payload), // if you use device-only sending, this route can be a no-op
};

/* ------------------------------------------------------------------ */
/* Profile helpers (optional, convenient)                              */
/* ------------------------------------------------------------------ */
export const profileApi = {
  get: () => authApi.get("/profile"),
  update: (patch: Partial<{ firstName: string; lastName: string; dobISO: string; country: string; gender: string; phone: string }>) =>
    authApi.put("/profile", patch),
};

/* ------------------------------------------------------------------ */
/* Security helpers (change password, logout all)                      */
/* ------------------------------------------------------------------ */
export const securityApi = {
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    authApi.post("/auth/change-password", payload),
  logoutAll: () => authApi.post("/auth/logout-all"),
};
