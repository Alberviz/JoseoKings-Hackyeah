// Google Identity Services token client (browser only). The access token lives in memory and is never stored.
// No client secret is used: the token model needs only the public client ID.
import { GOOGLE_HEALTH_SCOPES } from "./googleHealthV4";

const GSI_SRC = "https://accounts.google.com/gsi/client";

type TokenResponse = {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
  error_description?: string;
};

type TokenClient = { requestAccessToken: (overrides?: { prompt?: string }) => void };

type GoogleAccounts = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type?: string; message?: string }) => void;
      }) => TokenClient;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

export type AccessToken = { token: string; expiresAt: number };

let loading: Promise<void> | null = null;

export function loadGoogleIdentity(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Could not load Google sign-in. Check the connection."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

type OAuth2 = GoogleAccounts["accounts"]["oauth2"];

function openTokenPopup(oauth2: OAuth2, clientId: string): Promise<AccessToken> {
  return new Promise<AccessToken>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_HEALTH_SCOPES.join(" "),
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(response.error_description || response.error || "Access was not given."),
          );
          return;
        }
        const seconds = Number(response.expires_in) || 3600;
        resolve({ token: response.access_token, expiresAt: Date.now() + (seconds - 60) * 1000 });
      },
      error_callback: (error) => reject(new Error(error.message || "Sign-in was closed.")),
    });
    client.requestAccessToken();
  });
}

/**
 * Asks the parent to allow read-only access. Must be called from a click. When the Google script is
 * already loaded (see loadGoogleIdentity, called when the connect UI mounts) the popup opens
 * synchronously, still inside the click; otherwise the script is loaded first.
 */
export function requestGoogleAccessToken(clientId: string): Promise<AccessToken> {
  const ready = typeof window === "undefined" ? undefined : window.google?.accounts?.oauth2;
  if (ready) return openTokenPopup(ready, clientId);
  return loadGoogleIdentity().then(() => {
    const oauth2 = window.google?.accounts?.oauth2;
    if (!oauth2) throw new Error("Google sign-in is not available.");
    return openTokenPopup(oauth2, clientId);
  });
}
