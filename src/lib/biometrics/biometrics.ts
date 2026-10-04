export const BIOMETRIC_CREDENTIAL_KEY = "mycrohnie:biometric_cred";

export function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Checks whether the current platform supports biometric / user-verifying authenticator (Face ID, Touch ID, Windows Hello, Android fingerprint).
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (
    typeof window === "undefined" ||
    typeof window.PublicKeyCredential === "undefined" ||
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function"
  ) {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Checks whether biometric credentials have been enrolled and stored in local device storage.
 */
export function isBiometricEnrolled(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  return Boolean(window.localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY));
}

/**
 * Removes enrolled biometric credentials from local device storage.
 */
export function clearBiometric(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
}

/**
 * Registers biometric credentials on this device using WebAuthn.
 * Stored securely in hardware (Secure Enclave / TPM). No biometric data ever leaves the device.
 */
export async function registerBiometric(
  rpName = "MyCrohnie",
  userName = "Parent",
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined" || !window.navigator?.credentials) {
    return { success: false, error: "Biometric authentication not supported in this browser." };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const credential = (await window.navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: rpName,
          id: window.location.hostname || undefined,
        },
        user: {
          id: userId,
          name: "parent-mode",
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: "Registration was cancelled or failed." };
    }

    const credIdBase64 = bufferToBase64Url(credential.rawId);
    window.localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, credIdBase64);
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to register biometric credentials.";
    return { success: false, error: message };
  }
}

/**
 * Prompts user for biometric verification (Face ID / Fingerprint) to unlock parent mode.
 */
export async function authenticateBiometric(): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined" || !window.navigator?.credentials) {
    return { success: false, error: "Biometric authentication not supported in this browser." };
  }

  const storedId = window.localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
  if (!storedId) {
    return { success: false, error: "No biometric credentials registered yet on this device." };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const credentialIdBuffer = base64UrlToBuffer(storedId);

    const assertion = await window.navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname || undefined,
        allowCredentials: [
          {
            id: credentialIdBuffer,
            type: "public-key",
          },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    });

    if (!assertion) {
      return { success: false, error: "Authentication was cancelled." };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Biometric verification failed.";
    return { success: false, error: message };
  }
}
