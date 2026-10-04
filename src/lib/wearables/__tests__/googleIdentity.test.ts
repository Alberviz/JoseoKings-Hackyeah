import { afterEach, describe, expect, it, vi } from "vitest";
import { requestGoogleAccessToken } from "../googleIdentity";

describe("requestGoogleAccessToken", () => {
  afterEach(() => {
    delete window.google;
  });

  it("opens the popup synchronously when the Google script is already loaded", async () => {
    const requestAccessToken = vi.fn();
    let callback: (r: { access_token: string; expires_in: number }) => void = () => undefined;
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: vi.fn((config) => {
            callback = config.callback;
            return { requestAccessToken };
          }),
        },
      },
    };

    const promise = requestGoogleAccessToken("client-id");
    // No await happened yet: the popup was requested inside the same call (the click).
    expect(requestAccessToken).toHaveBeenCalledTimes(1);

    callback({ access_token: "abc", expires_in: 3600 });
    await expect(promise).resolves.toMatchObject({ token: "abc" });
  });
});
