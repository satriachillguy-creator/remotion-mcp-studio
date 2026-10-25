"use client";

import { StudioProject } from "@/types/studio";

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  authMode: "google-gis" | "instant-google";
  lastLoginAt: string;
}

const STORAGE_USER_KEY = "kinetic_google_user_session_v1";
const STORAGE_CLIENT_ID_KEY = "kinetic_google_oauth_client_id_v1";
const STORAGE_PROJECT_PREFIX = "kinetic_google_user_project_v1_";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

let gisScriptPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the official Google Identity Services (GIS) SDK
 */
export function loadGoogleIdentityScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.google?.accounts) return Promise.resolve(true);
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return gisScriptPromise;
}

/**
 * Decodes a Google ID token JWT payload
 */
export function decodeGoogleJwt(credential: string): GoogleUserProfile | null {
  try {
    const parts = credential.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return {
      id: payload.sub || `g-${Date.now()}`,
      name: payload.name || payload.email?.split("@")[0] || "Google User",
      email: payload.email || "",
      picture: payload.picture,
      authMode: "google-gis",
      lastLoginAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Triggers the official Google OAuth 2.0 Popup using Google Identity Services
 */
export async function signInWithGoogleOAuthPopup(
  clientId: string
): Promise<GoogleUserProfile> {
  const cleanClientId = clientId.trim();
  if (!cleanClientId) {
    throw new Error("Google OAuth Client ID belum diisi.");
  }

  const loaded = await loadGoogleIdentityScript();
  if (!loaded || !window.google?.accounts?.oauth2) {
    throw new Error("Gagal memuat script Google Identity Services (accounts.google.com).");
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = window.google!.accounts!.oauth2!.initTokenClient({
        client_id: cleanClientId,
        scope: "openid email profile",
        callback: async (tokenResponse) => {
          if (tokenResponse.error || !tokenResponse.access_token) {
            reject(
              new Error(
                tokenResponse.error || "Login Google dibatalkan atau gagal."
              )
            );
            return;
          }

          try {
            const res = await fetch(
              "https://www.googleapis.com/oauth2/v3/userinfo",
              {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                },
              }
            );
            if (!res.ok) {
              throw new Error("Gagal mengambil profil pengguna dari Google API.");
            }
            const data = await res.json();
            const profile: GoogleUserProfile = {
              id: data.sub || `google-${Date.now()}`,
              name: data.name || data.given_name || "Google User",
              email: data.email || "",
              picture: data.picture || undefined,
              authMode: "google-gis",
              lastLoginAt: new Date().toISOString(),
            };
            saveGoogleUserSession(profile);
            resolve(profile);
          } catch (err: any) {
            reject(new Error(err?.message || "Gagal membaca profil Google."));
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (err: any) {
      reject(new Error(err?.message || "Gagal menjalankan Google OAuth popup."));
    }
  });
}

/**
 * Instant Google Account login (works out-of-the-box without requiring Google Cloud Console setup)
 */
export function signInWithInstantGoogleAccount(
  emailInput: string,
  nameInput?: string
): GoogleUserProfile {
  const cleanEmail = emailInput.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Masukkan alamat email Google yang valid (contoh: nama@gmail.com).");
  }

  const derivedName =
    nameInput && nameInput.trim().length > 0
      ? nameInput.trim()
      : cleanEmail
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());

  const profile: GoogleUserProfile = {
    id: `google-local-${cleanEmail}`,
    name: derivedName,
    email: cleanEmail,
    authMode: "instant-google",
    lastLoginAt: new Date().toISOString(),
  };

  saveGoogleUserSession(profile);
  return profile;
}

export function getSavedGoogleClientId(): string {
  const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  if (typeof window === "undefined") return envClientId;
  return localStorage.getItem(STORAGE_CLIENT_ID_KEY) || envClientId;
}

export function saveGoogleClientId(clientId: string): void {
  if (typeof window === "undefined") return;
  const trimmed = clientId.trim();
  if (trimmed) {
    localStorage.setItem(STORAGE_CLIENT_ID_KEY, trimmed);
  } else {
    localStorage.removeItem(STORAGE_CLIENT_ID_KEY);
  }
}

export function getSavedGoogleUserSession(): GoogleUserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GoogleUserProfile;
  } catch {
    return null;
  }
}

export function saveGoogleUserSession(user: GoogleUserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore storage quota errors
  }
}

export function clearGoogleUserSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_USER_KEY);
}

/**
 * Per-user project persistence so logged-in Google users keep their video workspace
 */
export function saveProjectForGoogleUser(
  email: string,
  project: StudioProject
): void {
  if (typeof window === "undefined" || !email) return;
  try {
    const key = `${STORAGE_PROJECT_PREFIX}${email.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify(project));
  } catch {
    // ignore
  }
}

export function loadProjectForGoogleUser(email: string): StudioProject | null {
  if (typeof window === "undefined" || !email) return null;
  try {
    const key = `${STORAGE_PROJECT_PREFIX}${email.toLowerCase()}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as StudioProject;
  } catch {
    return null;
  }
}

