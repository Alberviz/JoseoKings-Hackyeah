import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authenticateBiometric,
  base64UrlToBuffer,
  BIOMETRIC_CREDENTIAL_KEY,
  bufferToBase64Url,
  clearBiometric,
  isBiometricAvailable,
  isBiometricEnrolled,
  registerBiometric,
} from "./biometrics";

describe("Biometrics on-device helper (WebAuthn)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  describe("Base64Url conversion", () => {
    it("converts ArrayBuffer to Base64Url and back accurately", () => {
      const original = new Uint8Array([1, 2, 3, 4, 10, 20, 30, 255, 0, 128]);
      const base64url = bufferToBase64Url(original.buffer);
      const recoveredBuffer = base64UrlToBuffer(base64url);
      const recovered = new Uint8Array(recoveredBuffer);

      expect(recovered).toEqual(original);
    });
  });

  describe("Availability checks", () => {
    it("returns false if PublicKeyCredential is not present in window", async () => {
      const available = await isBiometricAvailable();
      expect(available).toBe(false);
    });

    it("returns true if platform authenticator is available", async () => {
      vi.stubGlobal("PublicKeyCredential", {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockResolvedValue(true),
      });

      const available = await isBiometricAvailable();
      expect(available).toBe(true);
    });
  });

  describe("Enrollment state", () => {
    it("returns false when no credentials stored", () => {
      expect(isBiometricEnrolled()).toBe(false);
    });

    it("returns true when credential stored, and clearBiometric clears it", () => {
      localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, "test-credential-id");
      expect(isBiometricEnrolled()).toBe(true);

      clearBiometric();
      expect(isBiometricEnrolled()).toBe(false);
      expect(localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY)).toBeNull();
    });
  });

  describe("Registration & Authentication", () => {
    it("registers credential and saves ID to localStorage", async () => {
      const mockRawId = new Uint8Array([10, 20, 30, 40]).buffer;
      const mockCreate = vi.fn().mockResolvedValue({
        rawId: mockRawId,
      });

      vi.stubGlobal("navigator", {
        credentials: {
          create: mockCreate,
        },
      });

      const res = await registerBiometric("MyCrohnie", "Parent");
      expect(res.success).toBe(true);
      expect(mockCreate).toHaveBeenCalled();
      expect(isBiometricEnrolled()).toBe(true);
      expect(localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY)).toBe(bufferToBase64Url(mockRawId));
    });

    it("authenticates when credential is enrolled and assertion succeeds", async () => {
      const mockRawId = new Uint8Array([10, 20, 30, 40]).buffer;
      localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, bufferToBase64Url(mockRawId));

      const mockGet = vi.fn().mockResolvedValue({
        id: "assertion-id",
      });

      vi.stubGlobal("navigator", {
        credentials: {
          get: mockGet,
        },
      });

      const res = await authenticateBiometric();
      expect(res.success).toBe(true);
      expect(mockGet).toHaveBeenCalled();
    });

    it("returns error if authenticating without enrollment", async () => {
      vi.stubGlobal("navigator", {
        credentials: {
          get: vi.fn(),
        },
      });

      const res = await authenticateBiometric();
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/No biometric credentials registered/);
    });
  });
});
